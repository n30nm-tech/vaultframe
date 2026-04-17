import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { validateLibraryPath, validateMediaFilePath } from "@/lib/server/folder-browser";
import { ensureThumbnailForVideo } from "@/lib/server/thumbnails";

const PHOTO_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
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

export type ModelRecord = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  importStatus: string;
  importQueuedAt: Date | null;
  importStartedAt: Date | null;
  importFinishedAt: Date | null;
  importCurrentPath: string | null;
  importTotalFiles: number;
  importFilesScanned: number;
  importPhotosFound: number;
  importVideosFound: number;
  importError: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastImportedAt: Date | null;
  assetCount: number;
  photoCount: number;
  videoCount: number;
  folderCount: number;
  coverAssetId: string | null;
  coverUrl: string | null;
  coverType: "photo" | "video" | null;
};

export type ModelAssetRecord = {
  id: string;
  modelId: string;
  fullPath: string;
  relativePath: string;
  folderPath: string;
  fileName: string;
  assetType: "photo" | "video";
  extension: string;
  thumbnailPath: string | null;
  sizeBytes: bigint | null;
  durationSeconds: number | null;
  missing: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  assetUrl: string;
};

export type ModelGalleryRecord = ModelRecord & {
  assets: ModelAssetRecord[];
};

export async function listModels() {
  const [models, groupedCounts, distinctFolders] = (await Promise.all([
    prisma.model.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      include: {
        assets: {
          select: {
            id: true,
            assetType: true,
            thumbnailPath: true,
          },
          orderBy: [{ assetType: "asc" }, { updatedAt: "desc" }],
          take: 1,
        },
      },
    } as never),
    prisma.modelAsset.groupBy({
      by: ["modelId", "assetType"],
      _count: {
        _all: true,
      },
    } as never),
    prisma.modelAsset.findMany({
      select: {
        modelId: true,
        folderPath: true,
      },
      distinct: ["modelId", "folderPath"],
    } as never),
  ]) as unknown as [
    Array<{
      id: string;
      name: string;
      path: string;
      enabled: boolean;
      importStatus: string;
      importQueuedAt: Date | null;
      importStartedAt: Date | null;
      importFinishedAt: Date | null;
      importCurrentPath: string | null;
      importTotalFiles: number;
      importFilesScanned: number;
      importPhotosFound: number;
      importVideosFound: number;
      importError: string | null;
      createdAt: Date;
      updatedAt: Date;
      lastImportedAt: Date | null;
      coverAssetId: string | null;
      assets: Array<{
        id: string;
        assetType: string;
        thumbnailPath: string | null;
      }>;
    }>,
    Array<{
      modelId: string;
      assetType: string;
      _count: { _all: number };
    }>,
    Array<{
      modelId: string;
      folderPath: string;
    }>
  ]);

  const countsByModel = new Map<
    string,
    {
      photoCount: number;
      videoCount: number;
    }
  >();

  for (const row of groupedCounts) {
    const existing = countsByModel.get(row.modelId) ?? { photoCount: 0, videoCount: 0 };

    if (row.assetType === "PHOTO") {
      existing.photoCount = row._count._all;
    }

    if (row.assetType === "VIDEO") {
      existing.videoCount = row._count._all;
    }

    countsByModel.set(row.modelId, existing);
  }

  const folderCountByModel = new Map<string, number>();

  for (const folder of distinctFolders) {
    folderCountByModel.set(folder.modelId, (folderCountByModel.get(folder.modelId) ?? 0) + 1);
  }

  return models.map((model) => {
    const counts = countsByModel.get(model.id) ?? { photoCount: 0, videoCount: 0 };
      const previewAsset =
        (model.coverAssetId
          ? model.assets.find((asset) => asset.id === model.coverAssetId) ?? null
          : null) ?? model.assets[0] ?? null;

    return {
      id: model.id,
      name: model.name,
      path: model.path,
      enabled: model.enabled,
      importStatus: model.importStatus,
      importQueuedAt: model.importQueuedAt,
      importStartedAt: model.importStartedAt,
      importFinishedAt: model.importFinishedAt,
      importCurrentPath: model.importCurrentPath,
      importTotalFiles: model.importTotalFiles,
      importFilesScanned: model.importFilesScanned,
      importPhotosFound: model.importPhotosFound,
      importVideosFound: model.importVideosFound,
      importError: model.importError,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      lastImportedAt: model.lastImportedAt,
      coverAssetId: model.coverAssetId,
      assetCount: counts.photoCount + counts.videoCount,
      photoCount: counts.photoCount,
      videoCount: counts.videoCount,
      folderCount: folderCountByModel.get(model.id) ?? 0,
      coverUrl: previewAsset
        ? previewAsset.assetType === "PHOTO"
          ? `/api/models/assets/${previewAsset.id}`
          : previewAsset.thumbnailPath
        : null,
      coverType: previewAsset
        ? previewAsset.assetType === "PHOTO"
          ? "photo"
          : "video"
        : null,
    } satisfies ModelRecord;
  });
}

export async function getModelById(id: string) {
  const model = await prisma.model.findUnique({
    where: { id },
    include: {
      assets: {
        orderBy: [{ updatedAt: "desc" }, { fileName: "asc" }],
      },
    },
  } as never) as
    | ({
        id: string;
        name: string;
        path: string;
        enabled: boolean;
        importStatus: string;
        importQueuedAt: Date | null;
        importStartedAt: Date | null;
        importFinishedAt: Date | null;
        importCurrentPath: string | null;
        importTotalFiles: number;
        importFilesScanned: number;
        importPhotosFound: number;
        importVideosFound: number;
        importError: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastImportedAt: Date | null;
        coverAssetId: string | null;
        assets: Array<{
          id: string;
          modelId: string;
          fullPath: string;
          relativePath: string;
          folderPath: string;
          fileName: string;
          assetType: string;
          extension: string;
          thumbnailPath: string | null;
          sizeBytes: bigint | null;
          durationSeconds: number | null;
          missing: boolean;
          createdAt: Date;
          updatedAt: Date;
          lastSeenAt: Date;
        }>;
      })
    | null;

  if (!model) {
    return null;
  }

  const photoCount = model.assets.filter((asset) => asset.assetType === "PHOTO").length;
  const videoCount = model.assets.filter((asset) => asset.assetType === "VIDEO").length;
  const folderCount = new Set(model.assets.map((asset) => asset.folderPath)).size;
  const previewAsset =
    (model.coverAssetId
      ? model.assets.find((asset) => asset.id === model.coverAssetId) ?? null
      : null) ??
    model.assets.find((asset) => asset.assetType === "PHOTO") ??
    model.assets[0] ??
    null;

  return {
    id: model.id,
    name: model.name,
    path: model.path,
    enabled: model.enabled,
    importStatus: model.importStatus,
    importQueuedAt: model.importQueuedAt,
    importStartedAt: model.importStartedAt,
    importFinishedAt: model.importFinishedAt,
    importCurrentPath: model.importCurrentPath,
    importTotalFiles: model.importTotalFiles,
    importFilesScanned: model.importFilesScanned,
    importPhotosFound: model.importPhotosFound,
    importVideosFound: model.importVideosFound,
    importError: model.importError,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    lastImportedAt: model.lastImportedAt,
    coverAssetId: model.coverAssetId,
    assetCount: model.assets.length,
    photoCount,
    videoCount,
    folderCount,
    coverUrl: previewAsset
      ? previewAsset.assetType === "PHOTO"
        ? `/api/models/assets/${previewAsset.id}`
        : previewAsset.thumbnailPath
      : null,
    coverType: previewAsset
      ? previewAsset.assetType === "PHOTO"
        ? "photo"
        : "video"
      : null,
    assets: model.assets.map((asset) => ({
      id: asset.id,
      modelId: asset.modelId,
      fullPath: asset.fullPath,
      relativePath: asset.relativePath,
      folderPath: asset.folderPath,
      fileName: asset.fileName,
      assetType: asset.assetType === "PHOTO" ? "photo" : "video",
      extension: asset.extension,
      thumbnailPath: asset.thumbnailPath,
      sizeBytes: asset.sizeBytes,
      durationSeconds: asset.durationSeconds,
      missing: asset.missing,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      lastSeenAt: asset.lastSeenAt,
      assetUrl: `/api/models/assets/${asset.id}`,
    })),
  } satisfies ModelGalleryRecord;
}

export async function getModelAssetById(id: string) {
  const asset = await prisma.modelAsset.findUnique({
    where: { id },
    include: {
      model: {
        select: {
          id: true,
          path: true,
        },
      },
    },
  });

  if (!asset) {
    return null;
  }

  return asset;
}

export async function setModelCoverAsset(modelId: string, assetId: string) {
  const asset = await prisma.modelAsset.findFirst({
    where: {
      id: assetId,
      modelId,
      missing: false,
    },
    select: {
      id: true,
    },
  });

  if (!asset) {
    throw new Error("That asset cannot be used as this model cover.");
  }

  await prisma.model.update({
    where: { id: modelId },
    data: {
      coverAssetId: asset.id,
    } as never,
  } as never);

  return asset.id;
}

export async function createModel(input: {
  name: string;
  path: string;
  enabled: boolean;
}) {
  const validatedPath = await validateLibraryPath(input.path);
  const existing = await prisma.model.findUnique({
    where: {
      path: validatedPath,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new Error("That folder is already saved as a model.");
  }

  const model = await prisma.model.create({
    data: {
      name: input.name.trim() || path.basename(validatedPath),
      path: validatedPath,
      enabled: input.enabled,
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
      lastImportedAt: null,
    },
  } as never);

  return model;
}

export async function createModelsFromSubfolders(input: {
  path: string;
  enabled: boolean;
}) {
  const validatedPath = await validateLibraryPath(input.path);
  const entries = await readdir(validatedPath, { withFileTypes: true });
  const immediateSubfolders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => ({
      name: entry.name,
      path: path.join(validatedPath, entry.name),
    }));

  const existingModels = await prisma.model.findMany({
    where: {
      path: {
        in: immediateSubfolders.map((folder) => folder.path),
      },
    },
    select: {
      path: true,
    },
  });
  const existingPaths = new Set(existingModels.map((model) => model.path));
  const foldersWithAssets: Array<{ name: string; path: string }> = [];
  const skippedFolders: Array<{ name: string; path: string; reason: "exists" | "empty" }> = [];

  for (const folder of immediateSubfolders) {
    if (existingPaths.has(folder.path)) {
      skippedFolders.push({ ...folder, reason: "exists" });
      continue;
    }

    if (await folderContainsSupportedAssets(folder.path)) {
      foldersWithAssets.push(folder);
    } else {
      skippedFolders.push({ ...folder, reason: "empty" });
    }
  }

  if (foldersWithAssets.length === 0) {
    return {
      createdModels: [] as Array<{ id: string; name: string; path: string }>,
      createdCount: 0,
      skippedFolders,
    };
  }

  const queuedAt = new Date();
  const createdModels = await Promise.all(
    foldersWithAssets.map((folder) =>
      prisma.model.create({
        data: {
          name: folder.name,
          path: folder.path,
          enabled: input.enabled,
          importStatus: "QUEUED",
          importQueuedAt: queuedAt,
          importStartedAt: null,
          importFinishedAt: null,
          importCurrentPath: null,
          importTotalFiles: 0,
          importFilesScanned: 0,
          importPhotosFound: 0,
          importVideosFound: 0,
          importError: null,
          lastImportedAt: null,
        },
        select: {
          id: true,
          name: true,
          path: true,
        },
      } as never),
    ),
  );

  return {
    createdModels,
    createdCount: createdModels.length,
    skippedFolders,
  };
}

export async function deleteModel(id: string) {
  await prisma.model.delete({
    where: {
      id,
    },
  });
}

export async function collectModelAssets(rootPath: string, now: Date) {
  const assets: Array<{
    fullPath: string;
    relativePath: string;
    folderPath: string;
    fileName: string;
    assetType: "PHOTO" | "VIDEO";
    extension: string;
    thumbnailPath: string | null;
    sizeBytes: bigint | null;
    durationSeconds: number | null;
    lastSeenAt: Date;
  }> = [];
  const queue = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.shift();

    if (!currentPath) {
      continue;
    }

    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      const assetType = getModelAssetType(extension);

      if (!assetType) {
        continue;
      }

      const fileStats = await stat(entryPath);
      const relativePath = path.relative(rootPath, entryPath);
      const folderPath = path.dirname(relativePath) === "."
        ? path.basename(rootPath)
        : path.dirname(relativePath);
      const thumbnailPath =
        assetType === "VIDEO" ? await ensureThumbnailForVideo(entryPath) : null;

      assets.push({
        fullPath: entryPath,
        relativePath,
        folderPath,
        fileName: entry.name,
        assetType,
        extension,
        thumbnailPath,
        sizeBytes: BigInt(fileStats.size),
        durationSeconds: null,
        lastSeenAt: now,
      });
    }
  }

  return assets;
}

export async function updateModelImportState(
  modelId: string,
  data: Partial<{
    importStatus: string;
    importQueuedAt: Date | null;
    importStartedAt: Date | null;
    importFinishedAt: Date | null;
    importCurrentPath: string | null;
    importTotalFiles: number;
    importFilesScanned: number;
    importPhotosFound: number;
    importVideosFound: number;
    importError: string | null;
    lastImportedAt: Date | null;
  }>,
) {
  await prisma.model.update({
    where: { id: modelId },
    data: data as never,
  } as never);
}

export async function markAllModelAssetsMissing(modelId: string) {
  await prisma.modelAsset.updateMany({
    where: { modelId },
    data: { missing: true } as never,
  } as never);
}

export async function upsertModelAsset(
  modelId: string,
  asset: Awaited<ReturnType<typeof collectModelAssets>>[number],
) {
  await prisma.modelAsset.upsert({
    where: {
      fullPath: asset.fullPath,
    },
    create: {
      modelId,
      fullPath: asset.fullPath,
      relativePath: asset.relativePath,
      folderPath: asset.folderPath,
      fileName: asset.fileName,
      assetType: asset.assetType,
      extension: asset.extension,
      thumbnailPath: asset.thumbnailPath,
      sizeBytes: asset.sizeBytes,
      durationSeconds: asset.durationSeconds,
      missing: false,
      lastSeenAt: asset.lastSeenAt,
    },
    update: {
      modelId,
      relativePath: asset.relativePath,
      folderPath: asset.folderPath,
      fileName: asset.fileName,
      assetType: asset.assetType,
      extension: asset.extension,
      thumbnailPath: asset.thumbnailPath,
      sizeBytes: asset.sizeBytes,
      durationSeconds: asset.durationSeconds,
      missing: false,
      lastSeenAt: asset.lastSeenAt,
    } as never,
  } as never);
}

export async function clearMissingModelAssets(modelId: string, seenPaths: string[]) {
  if (seenPaths.length === 0) {
    await markAllModelAssetsMissing(modelId);
    return;
  }

  await prisma.modelAsset.updateMany({
    where: {
      modelId,
      fullPath: {
        notIn: seenPaths,
      },
    },
    data: {
      missing: true,
    },
  } as never);
}

function getModelAssetType(extension: string) {
  if (PHOTO_EXTENSIONS.has(extension)) {
    return "PHOTO" as const;
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "VIDEO" as const;
  }

  return null;
}

export async function validateModelAssetStreamPath(fullPath: string, modelPath: string) {
  return validateMediaFilePath(fullPath, modelPath);
}

async function folderContainsSupportedAssets(rootPath: string) {
  const queue = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.shift();

    if (!currentPath) {
      continue;
    }

    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (getModelAssetType(path.extname(entry.name).toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}
