ALTER TABLE "Spot" ADD COLUMN "address" TEXT;
ALTER TABLE "Spot" ADD COLUMN "website" TEXT;

CREATE TABLE "SpotFieldDefinition" (
  "id" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "semanticKey" TEXT,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "publicVisible" BOOLEAN NOT NULL DEFAULT true,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotFieldDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SpotFieldDefinition_visibility_check" CHECK ("enabled" OR NOT "publicVisible"),
  CONSTRAINT "SpotFieldDefinition_kind_check" CHECK (
    ("kind" = 'standard' AND "semanticKey" IN ('description','address','phone','website','hours','holiday'))
    OR ("kind" = 'custom' AND "semanticKey" IS NULL)
  ),
  CONSTRAINT "SpotFieldDefinition_type_check" CHECK ("type" IN ('single_line_text','multiline_text','number','url','boolean'))
);

CREATE TABLE "SpotFieldValue" (
  "id" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "fieldDefinitionId" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpotFieldDefinition_mapId_semanticKey_key" ON "SpotFieldDefinition"("mapId", "semanticKey");
CREATE INDEX "SpotFieldDefinition_mapId_order_idx" ON "SpotFieldDefinition"("mapId", "order");
CREATE UNIQUE INDEX "SpotFieldValue_spotId_fieldDefinitionId_key" ON "SpotFieldValue"("spotId", "fieldDefinitionId");
CREATE INDEX "SpotFieldValue_fieldDefinitionId_idx" ON "SpotFieldValue"("fieldDefinitionId");

ALTER TABLE "SpotFieldDefinition" ADD CONSTRAINT "SpotFieldDefinition_mapId_fkey"
  FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotFieldValue" ADD CONSTRAINT "SpotFieldValue_spotId_fkey"
  FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotFieldValue" ADD CONSTRAINT "SpotFieldValue_fieldDefinitionId_fkey"
  FOREIGN KEY ("fieldDefinitionId") REFERENCES "SpotFieldDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "SpotFieldDefinition"
  ("id", "mapId", "kind", "semanticKey", "label", "type", "enabled", "publicVisible", "required", "order", "updatedAt")
SELECT 'fd_' || md5(m."id" || defaults.key), m."id", 'standard', defaults.key, defaults.label,
  defaults.type, defaults.enabled, defaults.enabled, false, defaults.sort, CURRENT_TIMESTAMP
FROM "Map" m
CROSS JOIN (VALUES
  ('description', '紹介文', 'multiline_text', true, 0),
  ('address', '住所', 'single_line_text', true, 1),
  ('hours', '営業時間', 'multiline_text', true, 2),
  ('holiday', '定休日', 'multiline_text', true, 3),
  ('website', 'Webサイト', 'url', true, 4),
  ('phone', '電話番号', 'single_line_text', false, 5)
) AS defaults(key, label, type, enabled, sort);
