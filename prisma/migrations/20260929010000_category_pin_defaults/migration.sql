-- Additive: every existing PIN keeps its exact explicit appearance.
ALTER TABLE "Category"
  ADD COLUMN "pinDefaultType" TEXT,
  ADD COLUMN "pinDefaultIconId" TEXT,
  ADD COLUMN "pinDefaultImageUrl" TEXT,
  ADD COLUMN "pinDefaultAssetId" TEXT,
  ADD COLUMN "pinDefaultColor" TEXT,
  ADD COLUMN "pinDefaultSize" TEXT,
  ADD COLUMN "pinDefaultRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Spot"
  ADD COLUMN "pinSourceMode" TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN "pinSourceCategoryId" TEXT;
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_pin_source_valid" CHECK (
  "pinSourceMode" IN ('standard', 'category', 'individual') AND
  ("pinSourceMode" <> 'category' OR "pinSourceCategoryId" IS NOT NULL) AND
  ("pinSourceMode" <> 'standard' OR "pinSourceCategoryId" IS NULL)
);
ALTER TABLE "Category" ADD CONSTRAINT "Category_pin_default_complete" CHECK (
  ("pinDefaultType" IS NULL AND "pinDefaultIconId" IS NULL AND "pinDefaultImageUrl" IS NULL AND "pinDefaultAssetId" IS NULL AND "pinDefaultColor" IS NULL AND "pinDefaultSize" IS NULL)
  OR ("pinDefaultType" IS NOT NULL AND "pinDefaultType" IN ('preset','custom','illustration') AND "pinDefaultColor" IS NOT NULL AND "pinDefaultColor" ~ '^#[0-9A-Fa-f]{6}$' AND "pinDefaultSize" IS NOT NULL AND "pinDefaultSize" IN ('small','medium','large')
    AND (("pinDefaultType" = 'preset' AND "pinDefaultIconId" IS NOT NULL AND "pinDefaultImageUrl" IS NULL AND "pinDefaultAssetId" IS NULL)
      OR ("pinDefaultType" IN ('custom','illustration') AND "pinDefaultIconId" IS NULL AND "pinDefaultAssetId" IS NOT NULL AND "pinDefaultImageUrl" IS NOT NULL)))
);
CREATE INDEX "Spot_pinSourceCategoryId_pinSourceMode_idx" ON "Spot"("pinSourceCategoryId", "pinSourceMode");
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_pinSourceCategoryId_fkey" FOREIGN KEY ("pinSourceCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_pinDefaultAssetId_fkey" FOREIGN KEY ("pinDefaultAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
