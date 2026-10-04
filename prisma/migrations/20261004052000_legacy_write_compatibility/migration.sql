BEGIN;
-- Transitional database adapter for existing seed/QA writers. New application
-- mutations still use the explicit transactional adapter and canonical version.
CREATE FUNCTION wu72_initialize_spot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_map TEXT;
BEGIN
  IF NEW."floorId" IS NOT NULL THEN
    SELECT "mapId" INTO owner_map FROM "MapFloor" WHERE id=NEW."floorId";
    NEW."schemaMapId" := COALESCE(NEW."schemaMapId",owner_map);
    NEW."stewardMapId" := COALESCE(NEW."stewardMapId",owner_map);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_spot_initialization BEFORE INSERT ON "Spot" FOR EACH ROW EXECUTE FUNCTION wu72_initialize_spot();
CREATE FUNCTION wu72_legacy_spot_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE consumer TEXT; usage_id TEXT; primary_id TEXT;
BEGIN
  IF NEW."floorId" IS NULL THEN RETURN NEW; END IF;
  SELECT "mapId" INTO consumer FROM "MapFloor" WHERE id=NEW."floorId";
  IF NEW."schemaMapId" IS DISTINCT FROM consumer THEN RAISE EXCEPTION 'WU72_CONSUMER_TRANSFER_DEFERRED'; END IF;
  SELECT id INTO usage_id FROM "MapSpotUsage" WHERE "spotId"=NEW.id;
  IF usage_id IS NULL THEN
    usage_id := 'usage_'||NEW.id;
    INSERT INTO "MapSpotUsage" (id,"spotId","mapId","isPublished",importance,"pinSourceMode","pinSourceCategoryId","pinIconType","pinIconId","pinIconImageUrl","pinIconAssetId","pinColor","pinSize","createdAt","updatedAt")
    VALUES (usage_id,NEW.id,consumer,NEW."isPublished",NEW.importance,NEW."pinSourceMode",NEW."pinSourceCategoryId",NEW."pinIconType",NEW."pinIconId",NEW."pinIconImageUrl",NEW."pinIconAssetId",NEW."pinColor",NEW."pinSize",NEW."createdAt",NEW."updatedAt");
  ELSE
    UPDATE "MapSpotUsage" SET "isPublished"=NEW."isPublished",importance=NEW.importance,"pinSourceMode"=NEW."pinSourceMode","pinSourceCategoryId"=NEW."pinSourceCategoryId","pinIconType"=NEW."pinIconType","pinIconId"=NEW."pinIconId","pinIconImageUrl"=NEW."pinIconImageUrl","pinIconAssetId"=NEW."pinIconAssetId","pinColor"=NEW."pinColor","pinSize"=NEW."pinSize",version=version+1,"updatedAt"=NEW."updatedAt"
    WHERE id=usage_id AND ROW("isPublished",importance,"pinSourceMode","pinSourceCategoryId","pinIconType","pinIconId","pinIconImageUrl","pinIconAssetId","pinColor","pinSize") IS DISTINCT FROM ROW(NEW."isPublished",NEW.importance,NEW."pinSourceMode",NEW."pinSourceCategoryId",NEW."pinIconType",NEW."pinIconId",NEW."pinIconImageUrl",NEW."pinIconAssetId",NEW."pinColor",NEW."pinSize");
  END IF;
  SELECT id INTO primary_id FROM "IllustrationPlacement" WHERE "usageId"=usage_id AND "isPrimary";
  IF primary_id IS NULL THEN
    INSERT INTO "IllustrationPlacement" (id,"usageId","floorId",x,y,"isPrimary","createdAt","updatedAt") VALUES ('placement_'||md5(random()::text||clock_timestamp()::text||NEW.id),usage_id,NEW."floorId",NEW.x,NEW.y,true,NEW."createdAt",NEW."updatedAt");
  ELSE
    UPDATE "IllustrationPlacement" SET "floorId"=NEW."floorId",x=NEW.x,y=NEW.y,version=version+1,"updatedAt"=NEW."updatedAt" WHERE id=primary_id AND ROW("floorId",x,y) IS DISTINCT FROM ROW(NEW."floorId",NEW.x,NEW.y);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wu72_spot_legacy_write AFTER INSERT OR UPDATE OF "floorId",x,y,"isPublished",importance,"pinSourceMode","pinSourceCategoryId","pinIconType","pinIconId","pinIconImageUrl","pinIconAssetId","pinColor","pinSize" ON "Spot" FOR EACH ROW EXECUTE FUNCTION wu72_legacy_spot_write();
COMMIT;
