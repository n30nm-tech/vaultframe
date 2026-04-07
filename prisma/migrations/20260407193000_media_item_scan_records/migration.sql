CREATE TABLE "MediaItem" (
  "id" TEXT NOT NULL,
  "libraryId" TEXT NOT NULL,
  "fullPath" TEXT NOT NULL,
  "folderPath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "title" TEXT,
  "extension" TEXT NOT NULL,
  "sizeBytes" BIGINT,
  "durationSeconds" INTEGER,
  "missing" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaItem_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MediaItem_fullPath_key" ON "MediaItem"("fullPath");
CREATE INDEX "MediaItem_libraryId_idx" ON "MediaItem"("libraryId");
CREATE INDEX "MediaItem_libraryId_missing_idx" ON "MediaItem"("libraryId", "missing");
