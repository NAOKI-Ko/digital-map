CREATE TABLE "FloorDecoration" (
  "id" TEXT NOT NULL, "floorId" TEXT NOT NULL, "assetId" TEXT NOT NULL,
  "x" DOUBLE PRECISION NOT NULL, "y" DOUBLE PRECISION NOT NULL, "width" DOUBLE PRECISION NOT NULL,
  "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0, "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FloorDecoration_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FloorDecoration_floorId_order_idx" ON "FloorDecoration"("floorId", "order");
CREATE INDEX "FloorDecoration_assetId_idx" ON "FloorDecoration"("assetId");
ALTER TABLE "FloorDecoration" ADD CONSTRAINT "FloorDecoration_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MapFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FloorDecoration" ADD CONSTRAINT "FloorDecoration_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FloorDecoration" ADD CONSTRAINT "FloorDecoration_x_check" CHECK ("x" >= 0 AND "x" <= 1);
ALTER TABLE "FloorDecoration" ADD CONSTRAINT "FloorDecoration_y_check" CHECK ("y" >= 0 AND "y" <= 1);
ALTER TABLE "FloorDecoration" ADD CONSTRAINT "FloorDecoration_width_check" CHECK ("width" > 0 AND "width" <= 1);
