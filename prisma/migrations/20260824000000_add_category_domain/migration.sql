CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpotCategory" (
    "spotId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "SpotCategory_pkey" PRIMARY KEY ("spotId", "categoryId")
);

WITH category_names AS (
    SELECT DISTINCT
        f."mapId",
        btrim(s."category") AS "name"
    FROM "Spot" s
    INNER JOIN "MapFloor" f ON f."id" = s."floorId"
), ordered_categories AS (
    SELECT
        "mapId",
        "name",
        row_number() OVER (PARTITION BY "mapId" ORDER BY "name") - 1 AS "order"
    FROM category_names
)
INSERT INTO "Category" ("id", "mapId", "name", "order", "updatedAt")
SELECT
    'category_' || md5(length("mapId")::text || ':' || "mapId" || "name"),
    "mapId",
    "name",
    "order",
    CURRENT_TIMESTAMP
FROM ordered_categories;

INSERT INTO "SpotCategory" ("spotId", "categoryId")
SELECT
    s."id",
    c."id"
FROM "Spot" s
INNER JOIN "MapFloor" f ON f."id" = s."floorId"
INNER JOIN "Category" c
    ON c."mapId" = f."mapId"
    AND c."name" = btrim(s."category");

CREATE UNIQUE INDEX "Category_mapId_name_key" ON "Category"("mapId", "name");
CREATE INDEX "Category_mapId_order_idx" ON "Category"("mapId", "order");
CREATE INDEX "SpotCategory_categoryId_idx" ON "SpotCategory"("categoryId");

ALTER TABLE "Category"
ADD CONSTRAINT "Category_mapId_fkey"
FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpotCategory"
ADD CONSTRAINT "SpotCategory_spotId_fkey"
FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpotCategory"
ADD CONSTRAINT "SpotCategory_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
