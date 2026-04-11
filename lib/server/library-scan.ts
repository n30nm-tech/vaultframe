import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { updateLibraryScanState } from "@/lib/data/libraries";
import { listEnabledTagRules } from "@/lib/data/tag-rules";
import {
  FolderBrowserError,
  getDirectoryAvailability,
  validateLibraryPath,
} from "@/lib/server/folder-browser";
import { ensureStoryboardForVideo, ensureThumbnailForVideo } from "@/lib/server/thumbnails";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".avi", ".mov", ".wmv", ".webm", ".m4v"]);
const SCAN_PROGRESS_INTERVAL_MS = 1500;
const SCAN_PROGRESS_FILE_STEP = 25;
const SCAN_RUNNER_INTERVAL_MS = 2000;

const globalForScanRunner = globalThis as unknown as {
  vaultFrameScanRunnerStarted?: boolean;
  vaultFrameScanRunnerTimer?: ReturnType<typeof setInterval>;
  vaultFrameActiveScanLibraryId?: string | null;
};

export async function scanLibraryById(libraryId: string) {
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
  });

  if (!library) {
    throw new Error("Library not found.");
  }

  const libraryPath = await validateLibraryPath(library.path);
  const availability = await getDirectoryAvailability(libraryPath, { fresh: true });

  if (!availability.available) {
    throw new Error(availability.message || "The library folder is currently unavailable.");
  }

  const now = new Date();
  await updateLibraryScanState(libraryId, {
    scanStatus: "RUNNING",
    scanQueuedAt: null,
    scanStartedAt: now,
    scanFinishedAt: null,
    scanCurrentPath: libraryPath,
    scanFilesScanned: 0,
    scanVideosFound: 0,
    scanError: null,
  });

  let lastProgressWriteAt = Date.now();
  let lastProcessedWriteCount = 0;

  const persistProgress = async (
    currentPath: string,
    filesScanned: number,
    videosFound: number,
    force = false,
  ) => {
    const nowMs = Date.now();
    const shouldWrite =
      force ||
      nowMs - lastProgressWriteAt >= SCAN_PROGRESS_INTERVAL_MS ||
      filesScanned - lastProcessedWriteCount >= SCAN_PROGRESS_FILE_STEP;

    if (!shouldWrite) {
      return;
    }

    lastProgressWriteAt = nowMs;
    lastProcessedWriteCount = filesScanned;

    await updateLibraryScanState(libraryId, {
      scanCurrentPath: currentPath,
      scanFilesScanned: filesScanned,
      scanVideosFound: videosFound,
    });
  };

  const files = await collectVideoFiles(libraryPath, async (currentPath, videosFound, filesVisited) => {
    await persistProgress(currentPath, filesVisited, videosFound);
  });
  const enabledTagRules = await listEnabledTagRules();
  const seenPaths: string[] = [];
  let processedCount = 0;

  for (const file of files) {
    seenPaths.push(file.fullPath);
    const thumbnailPath = await ensureThumbnailForVideo(file.fullPath);
    const storyboard = await ensureStoryboardForVideo(file.fullPath);
    const storyboardPaths = storyboard.frames.map((frame) => frame.path);
    const storyboardTimestamps = storyboard.frames.map((frame) => frame.timestamp);
    const matchedTagNames = getMatchedRuleTagNames({
      fileName: file.fileName,
      folderPath: file.folderPath,
      libraryName: library.name,
      rules: enabledTagRules,
    });
    const matchedTags = await Promise.all(
      matchedTagNames.map((tagName) => ensureTag(tagName)),
    );
    const tagConnections = matchedTags.map((tag) => ({ id: tag.id }));

    const createData: Record<string, unknown> = {
      libraryId: library.id,
      fullPath: file.fullPath,
      folderPath: file.folderPath,
      fileName: file.fileName,
      title: null,
      thumbnailPath,
      storyboardPaths,
      storyboardTimestamps,
      extension: file.extension,
      sizeBytes: file.sizeBytes,
      durationSeconds: storyboard.durationSeconds,
      missing: false,
      lastSeenAt: now,
      tags:
        tagConnections.length > 0
          ? {
              connect: tagConnections,
            }
          : undefined,
    };

    const updateData: Record<string, unknown> = {
      libraryId: library.id,
      folderPath: file.folderPath,
      fileName: file.fileName,
      thumbnailPath: thumbnailPath ?? undefined,
      storyboardPaths,
      storyboardTimestamps,
      extension: file.extension,
      sizeBytes: file.sizeBytes,
      durationSeconds: storyboard.durationSeconds ?? undefined,
      missing: false,
      lastSeenAt: now,
      tags:
        tagConnections.length > 0
          ? {
              connect: tagConnections,
            }
          : undefined,
    };

    await prisma.mediaItem.upsert({
      where: {
        fullPath: file.fullPath,
      },
      create: createData as never,
      update: updateData as never,
    });

    processedCount += 1;
    await persistProgress(file.fullPath, processedCount, files.length);
  }

  if (seenPaths.length > 0) {
    await prisma.mediaItem.updateMany({
      where: {
        libraryId,
        fullPath: {
          notIn: seenPaths,
        },
      },
      data: {
        missing: true,
      },
    });
  } else {
    await prisma.mediaItem.updateMany({
      where: {
        libraryId,
      },
      data: {
        missing: true,
      },
    });
  }

  const completionData: Record<string, unknown> = {
    lastScannedAt: now,
    scanStatus: "IDLE",
    scanQueuedAt: null,
    scanFinishedAt: new Date(),
    scanCurrentPath: null,
    scanFilesScanned: processedCount,
    scanVideosFound: files.length,
    scanError: null,
  };

  await prisma.library.update({
    where: { id: libraryId },
    data: completionData as never,
  });

  return {
    scannedCount: files.length,
    missingCount: await prisma.mediaItem.count({
      where: {
        libraryId,
        missing: true,
      },
    }),
  };
}

export async function enqueueLibraryScan(libraryId: string) {
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    select: {
      id: true,
      name: true,
      scanStatus: true,
    },
  });

  if (!library) {
    throw new Error("Library not found.");
  }

  if (library.scanStatus === "RUNNING") {
    return {
      started: false,
      queued: false,
      message: "This library is already scanning.",
    };
  }

  if (library.scanStatus === "QUEUED") {
    return {
      started: false,
      queued: true,
      message: "This library is already queued.",
    };
  }

  const runningScan = await prisma.library.findFirst({
    where: {
      scanStatus: "RUNNING",
      NOT: {
        id: libraryId,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (runningScan) {
    await updateLibraryScanState(libraryId, {
      scanStatus: "QUEUED",
      scanQueuedAt: new Date(),
      scanStartedAt: null,
      scanFinishedAt: null,
      scanCurrentPath: null,
      scanFilesScanned: 0,
      scanVideosFound: 0,
      scanError: null,
    });

    return {
      started: false,
      queued: true,
      message: `Queued behind ${runningScan.name}. It will start automatically.`,
    };
  }

  await markLibraryScanRunning(libraryId);
  ensureScanRunnerStarted();
  void runScanCycle();

  return {
    started: true,
    queued: false,
    message: "Scan started. Other queued libraries will run automatically after this one.",
  };
}

export async function getLibraryScanAvailability(libraryId: string) {
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    select: {
      path: true,
      enabled: true,
    },
  });

  if (!library) {
    throw new Error("Library not found.");
  }

  if (!library.enabled) {
    throw new Error("Enable this library before scanning it.");
  }

  const libraryPath = await validateLibraryPath(library.path);
  const availability = await getDirectoryAvailability(libraryPath, { fresh: true });

  if (!availability.available) {
    throw new Error(availability.message || "The library folder is currently unavailable.");
  }

  return true;
}

export function ensureScanRunnerStarted() {
  if (globalForScanRunner.vaultFrameScanRunnerStarted) {
    return;
  }

  globalForScanRunner.vaultFrameScanRunnerStarted = true;
  globalForScanRunner.vaultFrameScanRunnerTimer = setInterval(() => {
    void runScanCycle();
  }, SCAN_RUNNER_INTERVAL_MS);
}

async function runScanCycle() {
  if (globalForScanRunner.vaultFrameActiveScanLibraryId) {
    return;
  }

  const runningLibrary = await prisma.library.findFirst({
    where: {
      scanStatus: "RUNNING",
    },
    orderBy: [{ scanStartedAt: "asc" }, { updatedAt: "asc" }],
    select: {
      id: true,
    },
  });

  if (runningLibrary) {
    await executeScanJob(runningLibrary.id);
    return;
  }

  const nextQueuedLibrary = await prisma.library.findFirst({
    where: {
      scanStatus: "QUEUED",
      enabled: true,
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
    },
  });

  if (!nextQueuedLibrary) {
    return;
  }

  const claimedLibrary = await prisma.library.updateMany({
    where: {
      id: nextQueuedLibrary.id,
      scanStatus: "QUEUED",
    },
    data: {
      scanStatus: "IDLE",
    },
  });

  if (claimedLibrary.count === 0) {
    return;
  }

  await markLibraryScanRunning(nextQueuedLibrary.id);
  await executeScanJob(nextQueuedLibrary.id);
}

async function collectVideoFiles(
  rootPath: string,
  onProgress?: (currentPath: string, videosFound: number, filesVisited: number) => Promise<void>,
) {
  const results: Array<{
    fullPath: string;
    folderPath: string;
    fileName: string;
    extension: string;
    sizeBytes: bigint | null;
  }> = [];
  const queue = [rootPath];
  let filesVisited = 0;

  while (queue.length > 0) {
    const currentPath = queue.pop();

    if (!currentPath) {
      continue;
    }

    if (onProgress) {
      await onProgress(currentPath, results.length, filesVisited);
    }

    let entries;

    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      try {
        const entryStats = await stat(fullPath);

        if (entryStats.isDirectory()) {
          queue.push(fullPath);
          continue;
        }

        if (!entryStats.isFile()) {
          continue;
        }

        filesVisited += 1;

        const extension = path.extname(entry.name).toLowerCase();

        if (!VIDEO_EXTENSIONS.has(extension)) {
          continue;
        }

        results.push({
          fullPath,
          folderPath: path.dirname(fullPath),
          fileName: entry.name,
          extension,
          sizeBytes: typeof entryStats.size === "number" ? BigInt(entryStats.size) : null,
        });

        if (onProgress) {
          await onProgress(fullPath, results.length, filesVisited);
        }
      } catch {
        continue;
      }
    }
  }

  return results;
}

export function isFolderBrowserError(error: unknown) {
  return error instanceof FolderBrowserError;
}

async function executeScanJob(libraryId: string) {
  if (globalForScanRunner.vaultFrameActiveScanLibraryId) {
    return;
  }

  globalForScanRunner.vaultFrameActiveScanLibraryId = libraryId;

  try {
    await scanLibraryById(libraryId);
  } catch (error) {
    await updateLibraryScanState(libraryId, {
      scanStatus: "FAILED",
      scanQueuedAt: null,
      scanFinishedAt: new Date(),
      scanError: error instanceof Error ? error.message : "Scan failed.",
    });
  } finally {
    globalForScanRunner.vaultFrameActiveScanLibraryId = null;
  }
}

async function markLibraryScanRunning(libraryId: string) {
  await updateLibraryScanState(libraryId, {
    scanStatus: "RUNNING",
    scanQueuedAt: null,
    scanStartedAt: new Date(),
    scanFinishedAt: null,
    scanCurrentPath: null,
    scanFilesScanned: 0,
    scanVideosFound: 0,
    scanError: null,
  });
}

async function ensureTag(tagName: string) {
  const normalizedTagName = tagName.trim().replace(/\s+/g, " ").toLowerCase();
  const prismaWithTag = prisma as typeof prisma & {
    tag: {
      upsert: (args: unknown) => Promise<{ id: string; name: string }>;
    };
  };

  return prismaWithTag.tag.upsert({
    where: {
      name: normalizedTagName,
    },
    create: {
      name: normalizedTagName,
    },
    update: {},
  });
}

function getMatchedRuleTagNames({
  fileName,
  folderPath,
  libraryName,
  rules,
}: {
  fileName: string;
  folderPath: string;
  libraryName: string;
  rules: Array<{
    target: string;
    matchMode: string;
    pattern: string;
    tagName: string;
  }>;
}) {
  const values = {
    FILE_NAME: fileName,
    FOLDER_PATH: folderPath,
    LIBRARY_NAME: libraryName,
  } as const;

  const matchedTags = new Set<string>();

  for (const rule of rules) {
    const candidate = values[rule.target as keyof typeof values];

    if (!candidate) {
      continue;
    }

    const haystack = candidate.toLowerCase();
    const needle = rule.pattern.trim().toLowerCase();

    if (!needle) {
      continue;
    }

    const matches =
      rule.matchMode === "EQUALS" ? haystack === needle : haystack.includes(needle);

    if (matches) {
      matchedTags.add(rule.tagName);
    }
  }

  return Array.from(matchedTags);
}
