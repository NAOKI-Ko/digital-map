BEGIN;
CREATE FUNCTION wu72_check_usage_resources() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."pinSourceCategoryId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "MapCategoryUsage" WHERE "categoryId"=NEW."pinSourceCategoryId" AND "mapId"=NEW."mapId") THEN RAISE EXCEPTION 'WU72_PIN_CATEGORY_MAP_MISMATCH'; END IF;
  IF NEW."pinIconAssetId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "MediaAsset" a JOIN "Map" m ON m."tenantId"=a."tenantId" WHERE a.id=NEW."pinIconAssetId" AND m.id=NEW."mapId") THEN RAISE EXCEPTION 'WU72_PIN_ASSET_TENANT_MISMATCH'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_usage_resources BEFORE INSERT OR UPDATE ON "MapSpotUsage" FOR EACH ROW EXECUTE FUNCTION wu72_check_usage_resources();
CREATE FUNCTION wu72_check_canonical_category() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Spot" s JOIN "Category" c ON c."tenantId"=s."tenantId" AND c."mapId"=s."schemaMapId" WHERE s.id=NEW."spotId" AND c.id=NEW."categoryId") THEN RAISE EXCEPTION 'WU72_CANONICAL_CATEGORY_MISMATCH'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_canonical_category BEFORE INSERT OR UPDATE ON "SpotCategory" FOR EACH ROW EXECUTE FUNCTION wu72_check_canonical_category();
CREATE FUNCTION wu72_check_field_schema() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Spot" s JOIN "SpotFieldDefinition" d ON d."mapId"=s."schemaMapId" WHERE s.id=NEW."spotId" AND d.id=NEW."fieldDefinitionId") THEN RAISE EXCEPTION 'WU72_FIELD_SCHEMA_MISMATCH'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_field_schema BEFORE INSERT OR UPDATE ON "SpotFieldValue" FOR EACH ROW EXECUTE FUNCTION wu72_check_field_schema();
CREATE TRIGGER wu72_translated_field_schema BEFORE INSERT OR UPDATE ON "SpotFieldValueTranslation" FOR EACH ROW EXECUTE FUNCTION wu72_check_field_schema();
CREATE FUNCTION wu72_fixed_parent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='Map' AND (to_jsonb(NEW)->>'tenantId') IS DISTINCT FROM (to_jsonb(OLD)->>'tenantId') THEN RAISE EXCEPTION 'WU72_MAP_OWNER_TRANSFER_DEFERRED'; END IF;
  IF TG_TABLE_NAME IN ('MapFloor','SpotFieldDefinition') AND (to_jsonb(NEW)->>'mapId') IS DISTINCT FROM (to_jsonb(OLD)->>'mapId') THEN RAISE EXCEPTION 'WU72_MAP_CHILD_TRANSFER_DEFERRED'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_map_parent BEFORE UPDATE ON "Map" FOR EACH ROW EXECUTE FUNCTION wu72_fixed_parent();
CREATE TRIGGER wu72_floor_parent BEFORE UPDATE ON "MapFloor" FOR EACH ROW EXECUTE FUNCTION wu72_fixed_parent();
CREATE TRIGGER wu72_field_parent BEFORE UPDATE ON "SpotFieldDefinition" FOR EACH ROW EXECUTE FUNCTION wu72_fixed_parent();
COMMIT;
