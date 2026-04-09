import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { updateLibraryScanState } from "@/lib/data/libraries";
import { FolderBrowserError, validateLibraryPath } from "@/lib/server/folder-browser";
import { ensureStoryboardForVideo, ensureThumbnailForVideo } from "@/lib/server/thumbnails";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".avi", ".mov", ".wmv", ".webm", ".m4v"]);

export async function scanLibraryById(libraryId: string) {
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
  });

  if (!library) {
    throw new Error("Library not found.");
  }

  const libraryPath = await validateLibraryPath(library.path);
  const now = new Date();
  await updateLibraryScanState(libraryId, {
    scanStatus: "RUNNING",
    scanStartedAt: now,
    scanFinishedAt: null,
    scanCurrentPath: libraryPath,
    scanFilesScanned: 0,
    scanVideosFound: 0,
    scanError: null,
  });

  const files = await collectVideoFiles(libraryPath, async (currentPath, videosFound) => {
    await updateLibraryScanState(libraryId, {
      scanCurrentPath: currentPath,
      scanVideosFound: videosFound,
    });
  });
  const seenPaths: string[] = [];
  let processedCount = 0;

  for (const file of files) {
    seenPaths.push(file.fullPath);
    const thumbnailPath = await ensureThumbnailForVideo(file.fullPath);
    const storyboardPaths = await ensureStoryboardForVideo(file.fullPath);

    await prisma.mediaItem.upsert({
      where: {
        fullPath: file.fullPath,
      },
      create: {
        libraryId: library.id,
        fullPath: file.fullPath,
        folderPath: file.folderPath,
        fileName: file.fileName,
        title: null,
        thumbnailPath,
        storyboardPaths,
        extension: file.extension,
        sizeBytes: file.sizeBytes,
        durationSeconds: null,
        missing: false,
        lastSeenAt: now,
      },
      update: {
        libraryId: library.id,
        folderPath: file.folderPath,
        fileName: file.fileName,
        thumbnailPath: thumbnailPath ?? undefined,
        storyboardPaths,
        extension: file.extension,
        sizeBytes: file.sizeBytes,
        missing: false,
        lastSeenAt: now,
      },
    });

    processedCount += 1;
    await updateLibraryScanState(libraryId, {
      scanCurrentPath: file.fullPath,
      scanFilesScanned: processedCount,
      scanVideosFound: files.length,
    });
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

  await prisma.library.update({
    where: { id: libraryId },
    data: {
      lastScannedAt: now,
      scanStatus: "IDLE",
      scanFinishedAt: new Date(),
      scanCurrentPath: null,
      scanFilesScanned: processedCount,
      scanVideosFound: files.length,
      scanError: null,
    },
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

export function startLibraryScanInBackground(libraryId: string) {
  void (async () => {
    try {
      await scanLibraryById(libraryId);
    } catch (error) {
      await updateLibraryScanState(libraryId, {
        scanStatus: "FAILED",
        scanFinishedAt: new Date(),
        scanError: error instanceof Error ? error.message : "Scan failed.",
      });
    }
  })();
}

async function collectVideoFiles(
  rootPath: string,
  onProgress?: (currentPath: string, videosFound: number) => Promise<void>,
) {
  const results: Array<{
    fullPath: string;
    folderPath: string;
    fileName: string;
    extension: string;
    sizeBytes: bigint | null;
  }> = [];
  const queue = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.pop();

    if (!currentPath) {
      continue;
    }

    if (onProgress) {
      await onProgress(currentPath, results.length);
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
          await onProgress(fullPath, results.length);
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
