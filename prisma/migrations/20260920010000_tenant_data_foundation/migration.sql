DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Category" c
    JOIN "Map" m ON m.id = c."mapId"
    GROUP BY m."tenantId", c.name
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'WU-49 cannot establish tenant-scoped Category uniqueness because duplicate names exist';
  END IF;
END
$$;

ALTER TABLE "Spot" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT;

UPDATE "Spot" s
SET "tenantId" = m."tenantId"
FROM "MapFloor" f
JOIN "Map" m ON m.id = f."mapId"
WHERE s."floorId" = f.id;

UPDATE "Category" c
SET "tenantId" = m."tenantId"
FROM "Map" m
WHERE c."mapId" = m.id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Spot" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'WU-49 Spot tenant backfill left unresolved rows';
  END IF;
  IF EXISTS (SELECT 1 FROM "Category" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'WU-49 Category tenant backfill left unresolved rows';
  END IF;
END
$$;

ALTER TABLE "Spot" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category"
  ADD CONSTRAINT "Category_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Spot_tenantId_idx" ON "Spot"("tenantId");
CREATE INDEX "Category_tenantId_order_idx" ON "Category"("tenantId", "order");

DROP INDEX "Category_mapId_name_key";
CREATE UNIQUE INDEX "Category_tenantId_name_key" ON "Category"("tenantId", "name");

ALTER TABLE "Spot"
  ADD COLUMN "lat" DOUBLE PRECISION,
  ADD COLUMN "lng" DOUBLE PRECISION;

ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_real_coordinates_check"
  CHECK (
    ("lat" IS NULL AND "lng" IS NULL)
    OR (
      "lat" IS NOT NULL
      AND "lng" IS NOT NULL
      AND "lat" BETWEEN -90 AND 90
      AND "lng" BETWEEN -180 AND 180
    )
  );

CREATE TYPE "MapView" AS ENUM ('ILLUSTRATION', 'REAL');

ALTER TABLE "Map"
  ADD COLUMN "illustrationEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "realMapEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "defaultMapView" "MapView" NOT NULL DEFAULT 'ILLUSTRATION';

ALTER TABLE "Map"
  ADD CONSTRAINT "Map_at_least_one_view_check"
  CHECK ("illustrationEnabled" OR "realMapEnabled"),
  ADD CONSTRAINT "Map_default_view_enabled_check"
  CHECK (
    ("defaultMapView" = 'ILLUSTRATION' AND "illustrationEnabled")
    OR
    ("defaultMapView" = 'REAL' AND "realMapEnabled")
  );
