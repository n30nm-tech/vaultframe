CREATE INDEX IF NOT EXISTS "MediaItem_updatedAt_idx" ON "MediaItem"("updatedAt");
CREATE INDEX IF NOT EXISTS "MediaItem_createdAt_idx" ON "MediaItem"("createdAt");
CREATE INDEX IF NOT EXISTS "MediaItem_folderPath_idx" ON "MediaItem"("folderPath");
CREATE INDEX IF NOT EXISTS "MediaItem_sizeBytes_idx" ON "MediaItem"("sizeBytes");
CREATE INDEX IF NOT EXISTS "MediaItem_libraryId_updatedAt_idx" ON "MediaItem"("libraryId", "updatedAt");
