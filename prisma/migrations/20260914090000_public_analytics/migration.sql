CREATE TABLE "MapDailyAnalytics" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MapDailyAnalytics_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SpotDailyAnalytics" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotDailyAnalytics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MapDailyAnalytics_mapId_date_key" ON "MapDailyAnalytics"("mapId", "date");
CREATE INDEX "MapDailyAnalytics_tenantId_date_idx" ON "MapDailyAnalytics"("tenantId", "date");
CREATE UNIQUE INDEX "SpotDailyAnalytics_spotId_date_key" ON "SpotDailyAnalytics"("spotId", "date");
CREATE INDEX "SpotDailyAnalytics_tenantId_mapId_date_idx" ON "SpotDailyAnalytics"("tenantId", "mapId", "date");
ALTER TABLE "MapDailyAnalytics" ADD CONSTRAINT "MapDailyAnalytics_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotDailyAnalytics" ADD CONSTRAINT "SpotDailyAnalytics_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotDailyAnalytics" ADD CONSTRAINT "SpotDailyAnalytics_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
