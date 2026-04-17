-- AlterTable
ALTER TABLE "Model" ADD COLUMN "coverAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "ModelAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
