-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastImportedAt" TIMESTAMP(3),

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelAsset" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "sizeBytes" BIGINT,
    "durationSeconds" INTEGER,
    "missing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Model_path_key" ON "Model"("path");

-- CreateIndex
CREATE UNIQUE INDEX "ModelAsset_fullPath_key" ON "ModelAsset"("fullPath");

-- CreateIndex
CREATE INDEX "ModelAsset_modelId_idx" ON "ModelAsset"("modelId");

-- CreateIndex
CREATE INDEX "ModelAsset_modelId_assetType_idx" ON "ModelAsset"("modelId", "assetType");

-- CreateIndex
CREATE INDEX "ModelAsset_folderPath_idx" ON "ModelAsset"("folderPath");

-- CreateIndex
CREATE INDEX "ModelAsset_updatedAt_idx" ON "ModelAsset"("updatedAt");

-- AddForeignKey
ALTER TABLE "ModelAsset" ADD CONSTRAINT "ModelAsset_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
