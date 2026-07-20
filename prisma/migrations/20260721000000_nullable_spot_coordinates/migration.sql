-- Spot may remain a draft until its position has been decided.
ALTER TABLE "Spot"
  ALTER COLUMN "lat" DROP NOT NULL,
  ALTER COLUMN "lng" DROP NOT NULL;
