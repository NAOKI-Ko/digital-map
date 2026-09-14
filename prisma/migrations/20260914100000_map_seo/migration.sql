ALTER TABLE "Map" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "Map" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Map" ADD COLUMN "seoImageAssetId" TEXT;
CREATE INDEX "Map_seoImageAssetId_idx" ON "Map"("seoImageAssetId");
ALTER TABLE "Map" ADD CONSTRAINT "Map_seoImageAssetId_fkey" FOREIGN KEY ("seoImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
