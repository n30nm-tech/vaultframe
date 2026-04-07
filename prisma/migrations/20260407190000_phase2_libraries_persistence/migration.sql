-- AlterTable
ALTER TABLE "Library"
ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastScannedAt" TIMESTAMP(3);
