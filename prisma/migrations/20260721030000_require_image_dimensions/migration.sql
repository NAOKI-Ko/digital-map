-- AlterTable
-- 旧フロアは画像寸法が未計測のため0で識別し、再アップロードを案内する。
UPDATE "MapFloor" SET "imageWidth" = 0 WHERE "imageWidth" IS NULL;
UPDATE "MapFloor" SET "imageHeight" = 0 WHERE "imageHeight" IS NULL;

ALTER TABLE "MapFloor"
ALTER COLUMN "imageWidth" SET NOT NULL,
ALTER COLUMN "imageHeight" SET NOT NULL;
