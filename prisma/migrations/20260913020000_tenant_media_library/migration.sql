CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "sha256" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpotPhoto" (
  "id" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpotPhoto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Map" ADD COLUMN "logoAssetId" TEXT;
ALTER TABLE "MapFloor" ADD COLUMN "illustrationAssetId" TEXT;
ALTER TABLE "Category" ADD COLUMN "iconAssetId" TEXT;
ALTER TABLE "Spot" ADD COLUMN "pinIconAssetId" TEXT;

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_tenantId_createdAt_idx" ON "MediaAsset"("tenantId", "createdAt");
CREATE INDEX "MediaAsset_tenantId_sha256_idx" ON "MediaAsset"("tenantId", "sha256");
CREATE UNIQUE INDEX "SpotPhoto_spotId_assetId_key" ON "SpotPhoto"("spotId", "assetId");
CREATE INDEX "SpotPhoto_spotId_order_idx" ON "SpotPhoto"("spotId", "order");
CREATE INDEX "SpotPhoto_assetId_idx" ON "SpotPhoto"("assetId");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotPhoto" ADD CONSTRAINT "SpotPhoto_spotId_fkey"
  FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotPhoto" ADD CONSTRAINT "SpotPhoto_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Map" ADD CONSTRAINT "Map_logoAssetId_fkey"
  FOREIGN KEY ("logoAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MapFloor" ADD CONSTRAINT "MapFloor_illustrationAssetId_fkey"
  FOREIGN KEY ("illustrationAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_iconAssetId_fkey"
  FOREIGN KEY ("iconAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_pinIconAssetId_fkey"
  FOREIGN KEY ("pinIconAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Legacy URL/JSON image fields intentionally remain readable. Their bytes and
-- metadata cannot be reconstructed safely inside SQL, so no guessed backfill occurs.
