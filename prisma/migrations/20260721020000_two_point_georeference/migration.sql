-- AlterTable
-- 既存フロアは画像寸法を保持していないため、imageWidth/imageHeight は nullable で追加する。
-- 新規アップロードはアプリケーション層で必ず正の寸法を保存する。
ALTER TABLE "MapFloor"
ADD COLUMN "imageWidth" INTEGER,
ADD COLUMN "imageHeight" INTEGER,
ADD COLUMN "refAPixelX" DOUBLE PRECISION,
ADD COLUMN "refAPixelY" DOUBLE PRECISION,
ADD COLUMN "refALat" DOUBLE PRECISION,
ADD COLUMN "refALng" DOUBLE PRECISION,
ADD COLUMN "refBPixelX" DOUBLE PRECISION,
ADD COLUMN "refBPixelY" DOUBLE PRECISION,
ADD COLUMN "refBLat" DOUBLE PRECISION,
ADD COLUMN "refBLng" DOUBLE PRECISION,
DROP COLUMN "topLeftLat",
DROP COLUMN "topLeftLng",
DROP COLUMN "bottomRightLat",
DROP COLUMN "bottomRightLng";
