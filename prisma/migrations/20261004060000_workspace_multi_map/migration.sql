BEGIN;
-- Last step only: prior additive schema, backfill and compatibility must exist.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Spot" s LEFT JOIN "MapSpotUsage" u ON u."spotId"=s.id WHERE s."stewardMapId" IS NOT NULL AND (u.id IS NULL OR s."stewardMapId"<>u."mapId")) THEN RAISE EXCEPTION 'WU72: inconsistent consumer/steward; multi-Map remains locked'; END IF;
END $$;
DROP INDEX "Map_tenantId_key";
CREATE INDEX "Map_tenantId_idx" ON "Map"("tenantId");
COMMIT;
