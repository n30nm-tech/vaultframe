import { prisma } from "@/lib/prisma";
import {
  clearMissingModelAssets,
  collectModelAssets,
  updateModelImportState,
  upsertModelAsset,
} from "@/lib/data/models";
import { getDirectoryAvailability, validateLibraryPath } from "@/lib/server/folder-browser";

const MODEL_IMPORT_RUNNER_INTERVAL_MS = 2000;
const MODEL_IMPORT_PROGRESS_INTERVAL_MS = 1500;
const MODEL_IMPORT_FILE_STEP = 25;

const globalForModelImportRunner = globalThis as unknown as {
  vaultFrameModelImportRunnerStarted?: boolean;
  vaultFrameModelImportRunnerTimer?: ReturnType<typeof setInterval>;
  vaultFrameActiveModelImportId?: string | null;
};

export async function enqueueModelImport(modelId: string) {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    select: {
      id: true,
      path: true,
      importStatus: true,
    } as never,
  } as never) as
    | {
        id: string;
        path: string;
        importStatus: string;
      }
    | null;

  if (!model) {
    throw new Error("Model not found.");
  }

  if (model.importStatus === "RUNNING" || model.importStatus === "QUEUED") {
    return;
  }

  await updateModelImportState(modelId, {
    importStatus: "QUEUED",
    importQueuedAt: new Date(),
    importStartedAt: null,
    importFinishedAt: null,
    importCurrentPath: null,
    importTotalFiles: 0,
    importFilesScanned: 0,
    importPhotosFound: 0,
    importVideosFound: 0,
    importError: null,
  });

  ensureModelImportRunnerStarted();
  void runModelImportCycle();
}

export function ensureModelImportRunnerStarted() {
  if (globalForModelImportRunner.vaultFrameModelImportRunnerStarted) {
    return;
  }

  globalForModelImportRunner.vaultFrameModelImportRunnerStarted = true;
  globalForModelImportRunner.vaultFrameModelImportRunnerTimer = setInterval(() => {
    void runModelImportCycle();
  }, MODEL_IMPORT_RUNNER_INTERVAL_MS);

  void runModelImportCycle();
}

async function runModelImportCycle() {
  if (globalForModelImportRunner.vaultFrameActiveModelImportId) {
    return;
  }

  const nextModel = await prisma.model.findFirst({
    where: {
      importStatus: "QUEUED",
    },
    orderBy: [{ importQueuedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
    },
  } as never) as { id: string } | null;

  if (!nextModel) {
    return;
  }

  globalForModelImportRunner.vaultFrameActiveModelImportId = nextModel.id;

  try {
    await importModelById(nextModel.id);
  } catch (error) {
    await updateModelImportState(nextModel.id, {
      importStatus: "FAILED",
      importFinishedAt: new Date(),
      importError: error instanceof Error ? error.message : "Model import failed.",
    });
  } finally {
    globalForModelImportRunner.vaultFrameActiveModelImportId = null;
  }
}

async function importModelById(modelId: string) {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    select: {
      id: true,
      path: true,
      importStatus: true,
    } as never,
  } as never) as
    | {
        id: string;
        path: string;
        importStatus: string;
      }
    | null;

  if (!model) {
    throw new Error("Model not found.");
  }

  const validatedPath = await validateLibraryPath(model.path);
  const availability = await getDirectoryAvailability(validatedPath, { fresh: true });

  if (!availability.available) {
    throw new Error(availability.message || "The model folder is currently unavailable.");
  }

  const startedAt = new Date();
  await updateModelImportState(modelId, {
    importStatus: "RUNNING",
    importQueuedAt: null,
    importStartedAt: startedAt,
    importFinishedAt: null,
    importCurrentPath: validatedPath,
    importTotalFiles: 0,
    importFilesScanned: 0,
    importPhotosFound: 0,
    importVideosFound: 0,
    importError: null,
  });

  const now = new Date();
  const discoveredAssets = await collectModelAssets(validatedPath, now);
  await updateModelImportState(modelId, {
    importTotalFiles: discoveredAssets.length,
  });

  let filesScanned = 0;
  let photosFound = 0;
  let videosFound = 0;
  const seenPaths: string[] = [];
  let lastProgressWriteAt = Date.now();
  let lastProgressWriteCount = 0;

  const persistProgress = async (currentPath: string, force = false) => {
    const nowMs = Date.now();
    const shouldWrite =
      force ||
      nowMs - lastProgressWriteAt >= MODEL_IMPORT_PROGRESS_INTERVAL_MS ||
      filesScanned - lastProgressWriteCount >= MODEL_IMPORT_FILE_STEP;

    if (!shouldWrite) {
      return;
    }

    lastProgressWriteAt = nowMs;
    lastProgressWriteCount = filesScanned;

    await updateModelImportState(modelId, {
      importCurrentPath: currentPath,
      importFilesScanned: filesScanned,
      importPhotosFound: photosFound,
      importVideosFound: videosFound,
    });
  };

  for (const asset of discoveredAssets) {
    await upsertModelAsset(modelId, asset);
    seenPaths.push(asset.fullPath);
    filesScanned += 1;

    if (asset.assetType === "PHOTO") {
      photosFound += 1;
    } else {
      videosFound += 1;
    }

    await persistProgress(asset.fullPath);
  }

  await clearMissingModelAssets(modelId, seenPaths);
  const finishedAt = new Date();

  await updateModelImportState(modelId, {
    importStatus: "IDLE",
    importStartedAt: startedAt,
    importFinishedAt: finishedAt,
    importCurrentPath: null,
    importTotalFiles: discoveredAssets.length,
    importFilesScanned: filesScanned,
    importPhotosFound: photosFound,
    importVideosFound: videosFound,
    importError: null,
    lastImportedAt: finishedAt,
  });
}
