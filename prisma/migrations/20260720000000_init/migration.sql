-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFloor" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "illustrationUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "topLeftLat" DOUBLE PRECISION,
    "topLeftLng" DOUBLE PRECISION,
    "topRightLat" DOUBLE PRECISION,
    "topRightLng" DOUBLE PRECISION,
    "bottomRightLat" DOUBLE PRECISION,
    "bottomRightLng" DOUBLE PRECISION,
    "bottomLeftLat" DOUBLE PRECISION,
    "bottomLeftLng" DOUBLE PRECISION,
    "isOutdoor" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photosJson" JSONB NOT NULL DEFAULT '[]',
    "hoursText" TEXT,
    "holidayText" TEXT,
    "phone" TEXT,
    "pinIconType" TEXT NOT NULL DEFAULT 'preset',
    "pinIconId" TEXT,
    "pinIconImageUrl" TEXT,
    "pinColor" TEXT NOT NULL DEFAULT '#C7401F',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Map_slug_key" ON "Map"("slug");

-- CreateIndex
CREATE INDEX "Map_tenantId_idx" ON "Map"("tenantId");

-- CreateIndex
CREATE INDEX "MapFloor_mapId_order_idx" ON "MapFloor"("mapId", "order");

-- CreateIndex
CREATE INDEX "Spot_floorId_idx" ON "Spot"("floorId");

-- CreateIndex
CREATE INDEX "Spot_floorId_isPublished_idx" ON "Spot"("floorId", "isPublished");

-- CreateIndex
CREATE INDEX "Spot_category_idx" ON "Spot"("category");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFloor" ADD CONSTRAINT "MapFloor_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MapFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
