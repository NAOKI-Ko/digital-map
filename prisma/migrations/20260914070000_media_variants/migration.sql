ALTER TABLE "MediaAsset"
ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "processingError" TEXT;

CREATE TABLE "MediaVariant" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'webp',
  "storageKey" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaVariant_storageKey_key" ON "MediaVariant"("storageKey");
CREATE UNIQUE INDEX "MediaVariant_assetId_kind_format_key" ON "MediaVariant"("assetId", "kind", "format");
CREATE INDEX "MediaVariant_assetId_idx" ON "MediaVariant"("assetId");
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
