BEGIN;
-- Every legacy row has a Floor, even an unpublished/unpositioned row.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Spot" s LEFT JOIN "MapFloor" f ON f.id=s."floorId" LEFT JOIN "Map" m ON m.id=f."mapId" WHERE m.id IS NULL OR s."tenantId"<>m."tenantId") THEN
    RAISE EXCEPTION 'WU72: unresolved legacy Spot ownership; no backfill performed';
  END IF;
  IF EXISTS (SELECT 1 FROM "SpotFieldValue" v JOIN "Spot" s ON s.id=v."spotId" JOIN "MapFloor" f ON f.id=s."floorId" JOIN "SpotFieldDefinition" d ON d.id=v."fieldDefinitionId" WHERE d."mapId"<>f."mapId") THEN
    RAISE EXCEPTION 'WU72: incompatible field schema; no backfill performed';
  END IF;
  IF EXISTS (SELECT 1 FROM "SpotFieldValueTranslation" v JOIN "Spot" s ON s.id=v."spotId" JOIN "MapFloor" f ON f.id=s."floorId" JOIN "SpotFieldDefinition" d ON d.id=v."fieldDefinitionId" WHERE d."mapId"<>f."mapId") THEN
    RAISE EXCEPTION 'WU72: incompatible translated field schema';
  END IF;
  IF EXISTS (SELECT 1 FROM "SpotRevision" r JOIN "Spot" s ON s.id=r."spotId" JOIN "MapFloor" f ON f.id=s."floorId", jsonb_array_elements(COALESCE(r.payload->'fieldValues','[]'::jsonb)) v LEFT JOIN "SpotFieldDefinition" d ON d.id=v->>'fieldDefinitionId' WHERE d.id IS NULL OR d."mapId"<>f."mapId") THEN
    RAISE EXCEPTION 'WU72: incompatible revision field schema';
  END IF;
  IF EXISTS (SELECT 1 FROM "SpotCategory" sc JOIN "Spot" s ON s.id=sc."spotId" JOIN "MapFloor" f ON f.id=s."floorId" JOIN "Category" c ON c.id=sc."categoryId" WHERE c."tenantId"<>s."tenantId" OR c."mapId"<>f."mapId") THEN
    RAISE EXCEPTION 'WU72: incompatible Category adoption';
  END IF;
END $$;
INSERT INTO "MapSpotUsage" (id,"spotId","mapId",version,"isPublished",importance,"pinSourceMode","pinSourceCategoryId","pinIconType","pinIconId","pinIconImageUrl","pinIconAssetId","pinColor","pinSize","createdAt","updatedAt")
SELECT 'usage_'||s.id,s.id,f."mapId",1,s."isPublished",s.importance,s."pinSourceMode",s."pinSourceCategoryId",s."pinIconType",s."pinIconId",s."pinIconImageUrl",s."pinIconAssetId",s."pinColor",s."pinSize",s."createdAt",s."updatedAt"
FROM "Spot" s JOIN "MapFloor" f ON f.id=s."floorId";
INSERT INTO "IllustrationPlacement" (id,"usageId","floorId",x,y,version,"isPrimary","createdAt","updatedAt")
SELECT 'placement_'||s.id,'usage_'||s.id,s."floorId",s.x,s.y,1,true,s."createdAt",s."updatedAt" FROM "Spot" s;
UPDATE "Spot" s SET "contentVersion"=s."liveVersion", "schemaMapId"=u."mapId", "stewardMapId"=u."mapId" FROM "MapSpotUsage" u WHERE u."spotId"=s.id;
INSERT INTO "MapCategoryUsage" ("mapId","categoryId") SELECT "mapId",id FROM "Category" WHERE "mapId" IS NOT NULL;
DO $$ BEGIN
  IF (SELECT count(*) FROM "Spot")<>(SELECT count(*) FROM "MapSpotUsage") OR (SELECT count(*) FROM "Spot")<>(SELECT count(*) FROM "IllustrationPlacement") THEN
    RAISE EXCEPTION 'WU72: backfill count mismatch';
  END IF;
END $$;
CREATE UNIQUE INDEX "IllustrationPlacement_primary_usage_key" ON "IllustrationPlacement" ("usageId") WHERE "isPrimary";
ALTER TABLE "IllustrationPlacement" ADD CONSTRAINT "IllustrationPlacement_coordinates_check" CHECK ((x IS NULL AND y IS NULL) OR (x IS NOT NULL AND y IS NOT NULL AND x BETWEEN 0 AND 1 AND y BETWEEN 0 AND 1));
ALTER TABLE "IllustrationPlacement" ADD CONSTRAINT "IllustrationPlacement_version_check" CHECK (version>0);
ALTER TABLE "MapSpotUsage" ADD CONSTRAINT "MapSpotUsage_version_check" CHECK (version>0);

-- Deferred constraints allow coordinated mutations, but never commit a mismatched owner.
CREATE FUNCTION wu72_check_spot_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target TEXT;
BEGIN
  target := CASE WHEN TG_TABLE_NAME='Spot' THEN COALESCE(to_jsonb(NEW)->>'id',to_jsonb(OLD)->>'id') ELSE COALESCE(to_jsonb(NEW)->>'spotId',to_jsonb(OLD)->>'spotId') END;
  IF EXISTS (SELECT 1 FROM "Spot" s LEFT JOIN "MapSpotUsage" u ON u."spotId"=s.id LEFT JOIN "Map" m ON m.id=u."mapId" WHERE s.id=target AND ((s."stewardMapId" IS NOT NULL AND (u.id IS NULL OR s."stewardMapId"<>u."mapId")) OR (u.id IS NOT NULL AND (s."tenantId"<>m."tenantId" OR s."schemaMapId" IS DISTINCT FROM u."mapId")))) THEN
    RAISE EXCEPTION 'WU72_SPOT_CONSUMER_STEWARD_MISMATCH';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER wu72_spot_ownership AFTER INSERT OR UPDATE ON "Spot" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wu72_check_spot_ownership();
CREATE CONSTRAINT TRIGGER wu72_usage_ownership AFTER INSERT OR UPDATE OR DELETE ON "MapSpotUsage" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wu72_check_spot_ownership();
CREATE FUNCTION wu72_check_placement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "MapSpotUsage" u JOIN "MapFloor" f ON f."mapId"=u."mapId" WHERE u.id=NEW."usageId" AND f.id=NEW."floorId") THEN RAISE EXCEPTION 'WU72_PLACEMENT_MAP_MISMATCH'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_placement_map BEFORE INSERT OR UPDATE ON "IllustrationPlacement" FOR EACH ROW EXECUTE FUNCTION wu72_check_placement();
CREATE FUNCTION wu72_no_consumer_transfer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."mapId"<>OLD."mapId" OR NEW."spotId"<>OLD."spotId" THEN RAISE EXCEPTION 'WU72_CONSUMER_TRANSFER_DEFERRED'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_no_consumer_transfer BEFORE UPDATE ON "MapSpotUsage" FOR EACH ROW EXECUTE FUNCTION wu72_no_consumer_transfer();
-- Phase 1 Category consumer is 0..1; legacy mapId preserves provenance.
CREATE FUNCTION wu72_check_category_usage() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Category" c JOIN "Map" m ON m.id=NEW."mapId" WHERE c.id=NEW."categoryId" AND c."mapId"=m.id AND c."tenantId"=m."tenantId") THEN RAISE EXCEPTION 'WU72_CATEGORY_CONSUMER_MISMATCH'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_category_usage BEFORE INSERT OR UPDATE ON "MapCategoryUsage" FOR EACH ROW EXECUTE FUNCTION wu72_check_category_usage();
CREATE FUNCTION wu72_preserve_provenance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='Category' AND (to_jsonb(NEW)->>'mapId') IS DISTINCT FROM (to_jsonb(OLD)->>'mapId') THEN RAISE EXCEPTION 'WU72_CATEGORY_TRANSFER_DEFERRED'; END IF;
  IF TG_TABLE_NAME='Spot' AND (to_jsonb(OLD)->>'schemaMapId') IS NOT NULL AND (to_jsonb(NEW)->>'schemaMapId') IS DISTINCT FROM (to_jsonb(OLD)->>'schemaMapId') THEN RAISE EXCEPTION 'WU72_SCHEMA_TRANSFER_DEFERRED'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_category_provenance BEFORE UPDATE ON "Category" FOR EACH ROW EXECUTE FUNCTION wu72_preserve_provenance();
CREATE TRIGGER wu72_spot_provenance BEFORE UPDATE ON "Spot" FOR EACH ROW EXECUTE FUNCTION wu72_preserve_provenance();
-- Legacy seed/import tooling creates Categories directly. Preserve adoption atomically.
CREATE FUNCTION wu72_adopt_category() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."mapId" IS NOT NULL THEN INSERT INTO "MapCategoryUsage" ("mapId","categoryId") VALUES (NEW."mapId",NEW.id); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_category_adoption AFTER INSERT ON "Category" FOR EACH ROW EXECUTE FUNCTION wu72_adopt_category();
COMMIT;
