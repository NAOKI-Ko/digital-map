# CSV v3 evidence

- Export route is map-wide and orders by Floor order, Spot name, then Spot ID.
- Test export begins with Japanese human columns and ends with all five system columns.
- Duplicate custom labels round-trip deterministically.
- Existing row Floor name/ID changes are rejected with the required guidance.
- New rows resolve an exact unique Floor name; unknown/ambiguous names fail.
- v3 unchanged/update/new classification, schema hash, row hash, formula protection, categories, custom fields, and English columns are covered by WU-52 plus retained CSV tests.
- v1/v2 unsafe map-wide imports produce migration guidance. The transaction remains Serializable and all-or-nothing.
- Browser at 430×932 showed only `CSVを書き出す` and `CSVを取り込む`; no target Floor or template action was present.
