CREATE TABLE "Library" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastScannedAt" TIMESTAMP(3),

  CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Library_path_key" ON "Library"("path");
