ALTER TABLE "MediaItem"
ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER,
ADD COLUMN IF NOT EXISTS "extension" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "folderPath" TEXT,
ADD COLUMN IF NOT EXISTS "fullPath" TEXT,
ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "missing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sizeBytes" BIGINT,
ALTER COLUMN "title" DROP NOT NULL;

UPDATE "MediaItem"
SET
  "fullPath" = COALESCE("fullPath", "filePath"),
  "folderPath" = COALESCE("folderPath", regexp_replace("filePath", '/[^/]+$', '')),
  "fileName" = COALESCE("fileName", regexp_replace("filePath", '^.*/', '')),
  "extension" = COALESCE("extension", lower(substring("filePath" from '\.[^.]+$')))
WHERE "filePath" IS NOT NULL;

ALTER TABLE "MediaItem"
ALTER COLUMN "fullPath" SET NOT NULL,
ALTER COLUMN "folderPath" SET NOT NULL,
ALTER COLUMN "fileName" SET NOT NULL,
ALTER COLUMN "extension" SET NOT NULL;

ALTER TABLE "MediaItem"
DROP COLUMN IF EXISTS "filePath",
DROP COLUMN IF EXISTS "mimeType",
DROP COLUMN IF EXISTS "durationSec";

DROP INDEX IF EXISTS "MediaItem_filePath_key";
CREATE UNIQUE INDEX "MediaItem_fullPath_key" ON "MediaItem"("fullPath");
CREATE INDEX "MediaItem_libraryId_missing_idx" ON "MediaItem"("libraryId", "missing");
