# WU-41 / KAN-71 — CSV Export + Existing Spot Safe Bulk Edit

Date: 2026-09-14

## Contract

- v1 has no reserved system columns and remains create-only, unpositioned, and unpublished.
- v2 reserves `__csvVersion`, `__schemaVersion`, `__spotId`, and `__rowVersion`. ID is the only update identity; a blank ID is CREATE. Missing rows are no-op.
- Export reads every Spot on one selected Floor without UI-filter input. The shared Map access gate permits Tenant OWNER and assigned Map EDITOR and denies unassigned Map EDITOR, Spot Editor, and cross-Tenant access.
- UPDATE writes only name, enabled standard/custom values, ja/en translation values, and the desired final Category set. It increments `liveVersion`; excluded placement, Floor, publish, PIN, importance/size, Media, Decoration, and georeference state are absent from update data.
- Preview and apply load Field Definitions, Categories, and all candidate Map Spots in a fixed five-query context. Validation/hash/diff work is in-memory O(rows × enabled fields), with no per-row validation query. Apply uses only changed rows and is one serializable transaction.

## Concurrency design

- `__schemaVersion`: canonical SHA-256 over CSV contract version, enabled locales, and stable Field Definition ID/kind/semantic key/type/enabled/required. Label and order are deliberately excluded.
- `__rowVersion`: canonical SHA-256 over name, enabled standard values, enabled Custom values by stable ID, enabled ja/en translations, and sorted Category IDs. It does not rely on `updatedAt` and excludes non-editable state.
- Apply reloads and re-hashes the CSV inside the final serializable transaction. Any stale token blocks the whole batch with `最新CSVを再Exportしてください`; a concurrent post-read write aborts serialization rather than silently overwriting.

## Spreadsheet safety

- Serializer emits UTF-8 BOM, CRLF, and RFC4180 quoting for comma, quote, CR, and LF.
- Export prefixes formula-like values beginning `=`, `+`, `-`, or `@` with an apostrophe. A real leading apostrophe before those characters is doubled; v2 import decodes both cases exactly, so the strategy is reversible.
- Raw CSV and full values are not written to audit or application logs. Audit stores actor/Tenant/Map/Floor, counts, at most 20 changed Spot IDs, and the total changed-ID count.

## Local gate

- Focused: 1 file / 16 tests PASS.
- Full: 62 files / 413 tests PASS.
- Typecheck: PASS.
- Prisma validate/generate: PASS. No migration added.
- Production build: PASS.
- In-memory scale fixture: 100 and 1000 rows each below the 1500 ms guard (combined focused suite completed in 12 ms on this host).

## Windows/browser delta

Pending deployment of the final WU-41 SHA. Do not resume Human UAT until this section records Windows full gate plus OWNER round-trip/conflict/Snapshot/Revision, assigned/unassigned Map EDITOR, and Spot Editor denial results.
