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

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".webm",
  ".m4v",
  ".ts",
  ".m2ts",
  ".mts",
  ".mpg",
  ".mpeg",
  ".flv",
  ".3gp",
  ".ogv",
]);
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

  const libraryCheckpoint = library as typeof library & {
    scanPendingFiles?: string[];
    scanTotalFiles?: number;
    scanFilesScanned?: number;
    scanVideosFound?: number;
    scanStartedAt?: Date | null;
  };
  const pendingFiles = Array.isArray(libraryCheckpoint.scanPendingFiles)
    ? libraryCheckpoint.scanPendingFiles
    : [];

  const libraryPath = await validateLibraryPath(library.path);
  const availability = await getDirectoryAvailability(libraryPath, { fresh: true });

  if (!availability.available) {
    throw new Error(availability.message || "The library folder is currently unavailable.");
  }

  const isResuming =
    library.scanStatus === "RUNNING" &&
    pendingFiles.length > 0 &&
    library.scanFilesScanned > 0;
  const now = new Date();
  await updateLibraryScanState(libraryId, {
    scanStatus: "RUNNING",
    scanQueuedAt: null,
    scanStartedAt: isResuming ? libraryCheckpoint.scanStartedAt ?? now : now,
    scanFinishedAt: null,
    scanCurrentPath: libraryPath,
    scanPendingFiles: isResuming ? pendingFiles : [],
    scanResumed: isResuming,
    scanTotalFiles: isResuming ? libraryCheckpoint.scanTotalFiles ?? 0 : 0,
    scanFilesScanned: isResuming ? libraryCheckpoint.scanFilesScanned ?? 0 : 0,
    scanVideosFound: isResuming ? libraryCheckpoint.scanVideosFound ?? 0 : 0,
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

  const files = isResuming
    ? await collectResumableVideoFiles(pendingFiles)
    : await collectVideoFiles(
        libraryPath,
        async (currentPath, videosFound, filesVisited) => {
          await persistProgress(currentPath, filesVisited, videosFound);
        },
      );

  const initialProcessedCount = isResuming
    ? Math.min(libraryCheckpoint.scanFilesScanned ?? 0, files.length)
    : 0;
  const initialIndexedCount = isResuming
    ? Math.min(libraryCheckpoint.scanVideosFound ?? 0, initialProcessedCount)
    : 0;

  await updateLibraryScanState(libraryId, {
    scanCurrentPath:
      files[initialProcessedCount]?.fullPath ?? files[files.length - 1]?.fullPath ?? libraryPath,
    scanPendingFiles: files.map((file) => file.fullPath),
    scanTotalFiles: files.length,
    scanFilesScanned: initialProcessedCount,
    scanVideosFound: initialIndexedCount,
  });
  const enabledTagRules = await listEnabledTagRules();
  const seenPaths: string[] = files
    .slice(0, initialProcessedCount)
    .map((file) => file.fullPath);
  let processedCount = initialProcessedCount;
  let indexedCount = initialIndexedCount;
  let skippedCount = 0;
  let lastNonFatalError: string | null = null;

  for (const file of files.slice(initialProcessedCount)) {
    try {
      seenPaths.push(file.fullPath);
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
        thumbnailPath: null,
        storyboardPaths: [],
        storyboardTimestamps: [],
        extension: file.extension,
        sizeBytes: file.sizeBytes,
        durationSeconds: null,
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
        extension: file.extension,
        sizeBytes: file.sizeBytes,
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
      indexedCount += 1;
      await persistProgress(file.fullPath, processedCount, indexedCount, true);

      try {
        const thumbnailPath = await ensureThumbnailForVideo(file.fullPath);
        const storyboard = await ensureStoryboardForVideo(file.fullPath);
        const enrichmentData: Record<string, unknown> = {
          durationSeconds: storyboard.durationSeconds ?? undefined,
        };

        if (thumbnailPath) {
          enrichmentData.thumbnailPath = thumbnailPath;
        }

        if (storyboard.frames.length > 0) {
          enrichmentData.storyboardPaths = storyboard.frames.map((frame) => frame.path);
          enrichmentData.storyboardTimestamps = storyboard.frames.map((frame) => frame.timestamp);
        }

        await prisma.mediaItem.update({
          where: {
            fullPath: file.fullPath,
          },
          data: enrichmentData as never,
        });
      } catch (error) {
        lastNonFatalError =
          error instanceof Error ? error.message : "Skipped thumbnail/storyboard enrichment.";
        console.error("Library scan skipped enrichment", {
          libraryId,
          path: file.fullPath,
          error: lastNonFatalError,
        });
      }
    } catch (error) {
      skippedCount += 1;
      lastNonFatalError = error instanceof Error ? error.message : "Skipped a file during scan.";
      console.error("Library scan skipped file", {
        libraryId,
        path: file.fullPath,
        error: lastNonFatalError,
      });
    }

    if (processedCount < indexedCount + skippedCount) {
      processedCount = indexedCount + skippedCount;
      await persistProgress(file.fullPath, processedCount, indexedCount, true);
    }
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
    scanPendingFiles: [],
    scanResumed: false,
    scanTotalFiles: files.length,
    scanFilesScanned: processedCount,
    scanVideosFound: indexedCount,
    scanError:
      skippedCount > 0
        ? `Skipped ${skippedCount} file${skippedCount === 1 ? "" : "s"} during scan.${lastNonFatalError ? ` Last error: ${lastNonFatalError}` : ""}`
        : null,
  };

  await prisma.library.update({
    where: { id: libraryId },
    data: completionData as never,
  });

  return {
    scannedCount: indexedCount,
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
    await queueLibraryScan(libraryId);
    ensureScanRunnerStarted();
    void runScanCycle();

    return {
      started: false,
      queued: true,
      message: `Queued behind ${runningScan.name}. It will start automatically.`,
    };
  }

  await queueLibraryScan(libraryId);
  ensureScanRunnerStarted();
  void runScanCycle();

  return {
    started: true,
    queued: true,
    message: "Scan queued. It should start automatically in a moment.",
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
  void runScanCycle();
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
    const autoQueuedLibrary = await prisma.library.findFirst({
      where: {
        enabled: true,
        scanStatus: "IDLE",
        lastScannedAt: null,
      },
      orderBy: [{ createdAt: "asc" }, { updatedAt: "asc" }],
      select: {
        id: true,
      },
    });

    if (!autoQueuedLibrary) {
      return;
    }

    await updateLibraryScanState(autoQueuedLibrary.id, {
      scanStatus: "QUEUED",
      scanQueuedAt: new Date(),
      scanError: null,
    });

    await runScanCycle();
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

async function collectResumableVideoFiles(filePaths: string[]) {
  const results: Array<{
    fullPath: string;
    folderPath: string;
    fileName: string;
    extension: string;
    sizeBytes: bigint | null;
  }> = [];

  for (const fullPath of filePaths) {
    const file = await toVideoFileRecord(fullPath);

    if (file) {
      results.push(file);
    }
  }

  return results;
}

async function toVideoFileRecord(fullPath: string) {
  try {
    const entryStats = await stat(fullPath);

    if (!entryStats.isFile()) {
      return null;
    }

    const extension = path.extname(fullPath).toLowerCase();

    if (!VIDEO_EXTENSIONS.has(extension)) {
      return null;
    }

    return {
      fullPath,
      folderPath: path.dirname(fullPath),
      fileName: path.basename(fullPath),
      extension,
      sizeBytes: typeof entryStats.size === "number" ? BigInt(entryStats.size) : null,
    };
  } catch {
    return null;
  }
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
    console.error("Library scan failed", {
      libraryId,
      error: error instanceof Error ? error.message : "Scan failed.",
    });
    await updateLibraryScanState(libraryId, {
      scanStatus: "FAILED",
      scanQueuedAt: null,
      scanFinishedAt: new Date(),
      scanResumed: false,
      scanError: error instanceof Error ? error.message : "Scan failed.",
    });
  } finally {
    globalForScanRunner.vaultFrameActiveScanLibraryId = null;
    void runScanCycle();
  }
}

async function markLibraryScanRunning(libraryId: string) {
  await updateLibraryScanState(libraryId, {
    scanStatus: "RUNNING",
    scanQueuedAt: null,
    scanStartedAt: new Date(),
    scanFinishedAt: null,
    scanCurrentPath: null,
    scanPendingFiles: [],
    scanResumed: false,
    scanTotalFiles: 0,
    scanFilesScanned: 0,
    scanVideosFound: 0,
    scanError: null,
  });
}

async function queueLibraryScan(libraryId: string) {
  await updateLibraryScanState(libraryId, {
    scanStatus: "QUEUED",
    scanQueuedAt: new Date(),
    scanStartedAt: null,
    scanFinishedAt: null,
    scanCurrentPath: null,
    scanPendingFiles: [],
    scanResumed: false,
    scanTotalFiles: 0,
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
