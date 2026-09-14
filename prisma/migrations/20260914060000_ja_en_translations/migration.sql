-- WU-30 / KAN-60: optional English translations; existing base columns remain canonical Japanese.
ALTER TABLE "Map" ADD COLUMN "defaultLocale" TEXT NOT NULL DEFAULT 'ja';
ALTER TABLE "Map" ADD COLUMN "enabledLocales" TEXT[] NOT NULL DEFAULT ARRAY['ja']::TEXT[];

CREATE TABLE "MapTranslation" ("id" TEXT NOT NULL, "mapId" TEXT NOT NULL, "locale" TEXT NOT NULL, "name" TEXT, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "MapTranslation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SpotTranslation" ("id" TEXT NOT NULL, "spotId" TEXT NOT NULL, "locale" TEXT NOT NULL, "name" TEXT, "description" TEXT, "address" TEXT, "hoursText" TEXT, "holidayText" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SpotTranslation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "CategoryTranslation" ("id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "locale" TEXT NOT NULL, "name" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SpotFieldDefinitionTranslation" ("id" TEXT NOT NULL, "fieldDefinitionId" TEXT NOT NULL, "locale" TEXT NOT NULL, "label" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SpotFieldDefinitionTranslation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SpotFieldValueTranslation" ("id" TEXT NOT NULL, "spotId" TEXT NOT NULL, "fieldDefinitionId" TEXT NOT NULL, "locale" TEXT NOT NULL, "value" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SpotFieldValueTranslation_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "MapTranslation_mapId_locale_key" ON "MapTranslation"("mapId", "locale"); CREATE INDEX "MapTranslation_locale_idx" ON "MapTranslation"("locale");
CREATE UNIQUE INDEX "SpotTranslation_spotId_locale_key" ON "SpotTranslation"("spotId", "locale"); CREATE INDEX "SpotTranslation_locale_idx" ON "SpotTranslation"("locale");
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale"); CREATE INDEX "CategoryTranslation_locale_idx" ON "CategoryTranslation"("locale");
CREATE UNIQUE INDEX "SpotFieldDefinitionTranslation_fieldDefinitionId_locale_key" ON "SpotFieldDefinitionTranslation"("fieldDefinitionId", "locale"); CREATE INDEX "SpotFieldDefinitionTranslation_locale_idx" ON "SpotFieldDefinitionTranslation"("locale");
CREATE UNIQUE INDEX "SpotFieldValueTranslation_spotId_fieldDefinitionId_locale_key" ON "SpotFieldValueTranslation"("spotId", "fieldDefinitionId", "locale"); CREATE INDEX "SpotFieldValueTranslation_fieldDefinitionId_locale_idx" ON "SpotFieldValueTranslation"("fieldDefinitionId", "locale");

ALTER TABLE "MapTranslation" ADD CONSTRAINT "MapTranslation_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotTranslation" ADD CONSTRAINT "SpotTranslation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotFieldDefinitionTranslation" ADD CONSTRAINT "SpotFieldDefinitionTranslation_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "SpotFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotFieldValueTranslation" ADD CONSTRAINT "SpotFieldValueTranslation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotFieldValueTranslation" ADD CONSTRAINT "SpotFieldValueTranslation_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "SpotFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
