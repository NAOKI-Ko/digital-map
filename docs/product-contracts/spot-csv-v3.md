# Spot CSV v3

## Product workflow

The current workflow is map-wide: `CSVを書き出す` → spreadsheet edit → select file → `内容を確認` → `この内容で取り込む`. There is no Floor selector or template link in the normal UI.

## API

- `GET /api/maps/:mapId/spots/import/export` exports all Floors; `floorId` is not required.
- Preview and apply accept `{ csv }` only.
- Apply remains an all-or-nothing Serializable transaction.
- The legacy template endpoint remains available only for compatibility and is not linked from the current UI.

## Format

Human columns come first: `フロア`, `スポット名`, enabled standard/custom fields, `カテゴリー`, and enabled English columns. System columns are stable and last: `__csvVersion`, `__schemaVersion`, `__spotId`, `__rowVersion`, `__floorId`.

Duplicate custom labels are deterministic (`駐車場`, `駐車場（2）`, …) and are resolved from the exact generated field ordering, never guessed from labels alone. The schema hash includes CSV version, locales, enabled field identity/type/required/order/label data, and Floor id/name/order data.

Existing rows are identified by `__spotId`. Changing either their human Floor or `__floorId` is a blocking error because coordinates are Floor-relative. New rows resolve an exact, unique current Floor name; unknown or duplicate names are blocking errors. New Spots remain unpositioned and unpublished.

v2 existing rows can be inferred safely from their Spot ID. v1, and v2 new rows without Floor context, are rejected in the map-wide API with guidance to export a current file. Row/schema conflicts, formula protection, category/custom validation, map isolation, and no-delete-by-row-removal are preserved.
