-- IMAGE Spots use normalized image coordinates. This migration deliberately aborts
-- rather than guessing when legacy data does not satisfy the audited preconditions.
ALTER TABLE "Spot" ADD COLUMN "x" DOUBLE PRECISION;
ALTER TABLE "Spot" ADD COLUMN "y" DOUBLE PRECISION;

ALTER TABLE "MapFloor" ADD COLUMN "refAImageX" DOUBLE PRECISION;
ALTER TABLE "MapFloor" ADD COLUMN "refAImageY" DOUBLE PRECISION;
ALTER TABLE "MapFloor" ADD COLUMN "refBImageX" DOUBLE PRECISION;
ALTER TABLE "MapFloor" ADD COLUMN "refBImageY" DOUBLE PRECISION;

DO $$
DECLARE
  floor_row RECORD;
  spot_row RECORD;
  radians_per_degree DOUBLE PRECISION := pi() / 180.0;
  earth_radius DOUBLE PRECISION := 6378137.0;
  migration_epsilon DOUBLE PRECISION := 1e-12;
  aspect DOUBLE PRECISION;
  half_lng DOUBLE PRECISION;
  half_lat DOUBLE PRECISION;
  px_dx DOUBLE PRECISION;
  px_dy DOUBLE PRECISION;
  meters_x DOUBLE PRECISION;
  meters_y DOUBLE PRECISION;
  pixel_distance DOUBLE PRECISION;
  meter_distance DOUBLE PRECISION;
  scale_value DOUBLE PRECISION;
  pixel_angle DOUBLE PRECISION;
  meter_angle DOUBLE PRECISION;
  rotation_value DOUBLE PRECISION;
  cos_value DOUBLE PRECISION;
  sin_value DOUBLE PRECISION;
  image_dx DOUBLE PRECISION;
  image_dy DOUBLE PRECISION;
  raw_x DOUBLE PRECISION;
  raw_y DOUBLE PRECISION;
BEGIN
  IF EXISTS (SELECT 1 FROM "MapFloor" WHERE "imageWidth" <= 0 OR "imageHeight" <= 0) THEN
    RAISE EXCEPTION 'IMAGE spatial migration blocked: non-positive Floor image dimensions remain. Run audit:image-spatial-migration.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Spot"
    WHERE ("lat" IS NULL AND "lng" IS NOT NULL)
       OR ("lat" IS NOT NULL AND "lng" IS NULL)
  ) THEN
    RAISE EXCEPTION 'IMAGE spatial migration blocked: partial Spot lat/lng remains. Run audit:image-spatial-migration.';
  END IF;

  FOR floor_row IN SELECT * FROM "MapFloor" LOOP
    UPDATE "MapFloor"
    SET
      "refAImageX" = CASE
        WHEN floor_row."refAPixelX" IS NULL THEN NULL
        WHEN abs(floor_row."refAPixelX" / floor_row."imageWidth") <= migration_epsilon THEN 0
        WHEN abs(floor_row."refAPixelX" / floor_row."imageWidth" - 1) <= migration_epsilon THEN 1
        ELSE floor_row."refAPixelX" / floor_row."imageWidth"
      END,
      "refAImageY" = CASE
        WHEN floor_row."refAPixelY" IS NULL THEN NULL
        WHEN abs(floor_row."refAPixelY" / floor_row."imageHeight") <= migration_epsilon THEN 0
        WHEN abs(floor_row."refAPixelY" / floor_row."imageHeight" - 1) <= migration_epsilon THEN 1
        ELSE floor_row."refAPixelY" / floor_row."imageHeight"
      END,
      "refBImageX" = CASE
        WHEN floor_row."refBPixelX" IS NULL THEN NULL
        WHEN abs(floor_row."refBPixelX" / floor_row."imageWidth") <= migration_epsilon THEN 0
        WHEN abs(floor_row."refBPixelX" / floor_row."imageWidth" - 1) <= migration_epsilon THEN 1
        ELSE floor_row."refBPixelX" / floor_row."imageWidth"
      END,
      "refBImageY" = CASE
        WHEN floor_row."refBPixelY" IS NULL THEN NULL
        WHEN abs(floor_row."refBPixelY" / floor_row."imageHeight") <= migration_epsilon THEN 0
        WHEN abs(floor_row."refBPixelY" / floor_row."imageHeight" - 1) <= migration_epsilon THEN 1
        ELSE floor_row."refBPixelY" / floor_row."imageHeight"
      END
    WHERE "id" = floor_row."id";

    IF EXISTS (
      SELECT 1
      FROM "MapFloor"
      WHERE "id" = floor_row."id"
        AND (
          "refAImageX" < 0 OR "refAImageX" > 1
          OR "refAImageY" < 0 OR "refAImageY" > 1
          OR "refBImageX" < 0 OR "refBImageX" > 1
          OR "refBImageY" < 0 OR "refBImageY" > 1
        )
    ) THEN
      RAISE EXCEPTION 'IMAGE spatial migration blocked: Floor % has a reference point outside the illustration.', floor_row."id";
    END IF;

    IF floor_row."refAPixelX" IS NOT NULL
      AND floor_row."refAPixelY" IS NOT NULL
      AND floor_row."refALat" IS NOT NULL
      AND floor_row."refALng" IS NOT NULL
      AND floor_row."refBPixelX" IS NOT NULL
      AND floor_row."refBPixelY" IS NOT NULL
      AND floor_row."refBLat" IS NOT NULL
      AND floor_row."refBLng" IS NOT NULL
    THEN
      px_dx := floor_row."refBPixelX" - floor_row."refAPixelX";
      px_dy := floor_row."refBPixelY" - floor_row."refAPixelY";
      meters_x := (floor_row."refBLng" - floor_row."refALng") * radians_per_degree * earth_radius * cos(floor_row."refALat" * radians_per_degree);
      meters_y := (floor_row."refBLat" - floor_row."refALat") * radians_per_degree * earth_radius;
      pixel_distance := sqrt(px_dx * px_dx + px_dy * px_dy);
      meter_distance := sqrt(meters_x * meters_x + meters_y * meters_y);
      IF pixel_distance < 50 OR meter_distance < 20 THEN
        RAISE EXCEPTION 'IMAGE spatial migration blocked: invalid current georeference on Floor %.', floor_row."id";
      END IF;
    END IF;

    FOR spot_row IN
      SELECT * FROM "Spot"
      WHERE "floorId" = floor_row."id" AND "lat" IS NOT NULL AND "lng" IS NOT NULL
    LOOP
      IF floor_row."refAPixelX" IS NOT NULL
        AND floor_row."refAPixelY" IS NOT NULL
        AND floor_row."refALat" IS NOT NULL
        AND floor_row."refALng" IS NOT NULL
        AND floor_row."refBPixelX" IS NOT NULL
        AND floor_row."refBPixelY" IS NOT NULL
        AND floor_row."refBLat" IS NOT NULL
        AND floor_row."refBLng" IS NOT NULL
      THEN
        px_dx := floor_row."refBPixelX" - floor_row."refAPixelX";
        px_dy := floor_row."refBPixelY" - floor_row."refAPixelY";
        meters_x := (floor_row."refBLng" - floor_row."refALng") * radians_per_degree * earth_radius * cos(floor_row."refALat" * radians_per_degree);
        meters_y := (floor_row."refBLat" - floor_row."refALat") * radians_per_degree * earth_radius;
        pixel_distance := sqrt(px_dx * px_dx + px_dy * px_dy);
        meter_distance := sqrt(meters_x * meters_x + meters_y * meters_y);
        IF pixel_distance < 50 OR meter_distance < 20 THEN
          RAISE EXCEPTION 'IMAGE spatial migration blocked: invalid current georeference on Floor %.', floor_row."id";
        END IF;

        scale_value := meter_distance / pixel_distance;
        pixel_angle := atan2(-px_dy, px_dx);
        meter_angle := atan2(meters_y, meters_x);
        rotation_value := meter_angle - pixel_angle;
        cos_value := cos(rotation_value);
        sin_value := sin(rotation_value);
        meters_x := (spot_row."lng" - floor_row."refALng") * radians_per_degree * earth_radius * cos(floor_row."refALat" * radians_per_degree);
        meters_y := (spot_row."lat" - floor_row."refALat") * radians_per_degree * earth_radius;
        image_dx := (meters_x * cos_value + meters_y * sin_value) / scale_value;
        image_dy := (-meters_x * sin_value + meters_y * cos_value) / scale_value;
        raw_x := (floor_row."refAPixelX" + image_dx) / floor_row."imageWidth";
        raw_y := (floor_row."refAPixelY" - image_dy) / floor_row."imageHeight";
      ELSE
        aspect := floor_row."imageWidth"::double precision / floor_row."imageHeight"::double precision;
        half_lng := CASE WHEN aspect >= 1 THEN 0.005 ELSE 0.005 * aspect END;
        half_lat := CASE WHEN aspect >= 1 THEN 0.005 / aspect ELSE 0.005 END;
        raw_x := (spot_row."lng" + half_lng) / (2 * half_lng);
        raw_y := (half_lat - spot_row."lat") / (2 * half_lat);
      END IF;

      IF abs(raw_x) <= migration_epsilon THEN raw_x := 0; END IF;
      IF abs(raw_x - 1) <= migration_epsilon THEN raw_x := 1; END IF;
      IF abs(raw_y) <= migration_epsilon THEN raw_y := 0; END IF;
      IF abs(raw_y - 1) <= migration_epsilon THEN raw_y := 1; END IF;

      IF raw_x < 0 OR raw_x > 1 OR raw_y < 0 OR raw_y > 1 THEN
        RAISE EXCEPTION 'IMAGE spatial migration blocked: Spot % is outside illustration (raw x %, raw y %).', spot_row."id", raw_x, raw_y;
      END IF;

      UPDATE "Spot" SET "x" = raw_x, "y" = raw_y WHERE "id" = spot_row."id";
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_image_position_check" CHECK (
    ("x" IS NULL AND "y" IS NULL)
    OR ("x" IS NOT NULL AND "y" IS NOT NULL AND "x" >= 0 AND "x" <= 1 AND "y" >= 0 AND "y" <= 1)
  );

ALTER TABLE "MapFloor"
  ADD CONSTRAINT "MapFloor_refA_image_position_check" CHECK (
    ("refAImageX" IS NULL OR ("refAImageX" >= 0 AND "refAImageX" <= 1))
    AND ("refAImageY" IS NULL OR ("refAImageY" >= 0 AND "refAImageY" <= 1))
  ),
  ADD CONSTRAINT "MapFloor_refB_image_position_check" CHECK (
    ("refBImageX" IS NULL OR ("refBImageX" >= 0 AND "refBImageX" <= 1))
    AND ("refBImageY" IS NULL OR ("refBImageY" >= 0 AND "refBImageY" <= 1))
  );

ALTER TABLE "Spot" DROP COLUMN "lat", DROP COLUMN "lng";
ALTER TABLE "MapFloor"
  DROP COLUMN "refAPixelX",
  DROP COLUMN "refAPixelY",
  DROP COLUMN "refBPixelX",
  DROP COLUMN "refBPixelY";
