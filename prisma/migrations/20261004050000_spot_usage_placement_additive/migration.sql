-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_mapId_fkey";

-- DropForeignKey
ALTER TABLE "Spot" DROP CONSTRAINT "Spot_floorId_fkey";

-- AlterTable
ALTER TABLE "Map" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "mapId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stewardMapId" TEXT,
ADD COLUMN     "schemaMapId" TEXT,
ALTER COLUMN "floorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MapSpotUsage" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "pinSourceMode" TEXT NOT NULL DEFAULT 'individual',
    "pinSourceCategoryId" TEXT,
    "pinIconType" TEXT NOT NULL DEFAULT 'preset',
    "pinIconId" TEXT,
    "pinIconImageUrl" TEXT,
    "pinIconAssetId" TEXT,
    "pinColor" TEXT NOT NULL DEFAULT '#C7401F',
    "pinSize" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapSpotUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IllustrationPlacement" (
    "id" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IllustrationPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapCategoryUsage" (
    "mapId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "MapCategoryUsage_pkey" PRIMARY KEY ("mapId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapSpotUsage_spotId_key" ON "MapSpotUsage"("spotId");

-- CreateIndex
CREATE INDEX "MapSpotUsage_mapId_idx" ON "MapSpotUsage"("mapId");

-- CreateIndex
CREATE INDEX "IllustrationPlacement_usageId_idx" ON "IllustrationPlacement"("usageId");

-- CreateIndex
CREATE INDEX "IllustrationPlacement_floorId_idx" ON "IllustrationPlacement"("floorId");

-- CreateIndex
CREATE INDEX "MapCategoryUsage_categoryId_idx" ON "MapCategoryUsage"("categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MapFloor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_stewardMapId_fkey" FOREIGN KEY ("stewardMapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSpotUsage" ADD CONSTRAINT "MapSpotUsage_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSpotUsage" ADD CONSTRAINT "MapSpotUsage_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSpotUsage" ADD CONSTRAINT "MapSpotUsage_pinSourceCategoryId_fkey" FOREIGN KEY ("pinSourceCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSpotUsage" ADD CONSTRAINT "MapSpotUsage_pinIconAssetId_fkey" FOREIGN KEY ("pinIconAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IllustrationPlacement" ADD CONSTRAINT "IllustrationPlacement_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "MapSpotUsage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IllustrationPlacement" ADD CONSTRAINT "IllustrationPlacement_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MapFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapCategoryUsage" ADD CONSTRAINT "MapCategoryUsage_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapCategoryUsage" ADD CONSTRAINT "MapCategoryUsage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "Spot" ADD CONSTRAINT "Spot_schemaMapId_fkey" FOREIGN KEY ("schemaMapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MapCategoryUsage_categoryId_key" ON "MapCategoryUsage"("categoryId");
