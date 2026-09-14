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

- Deployed code SHA: `9245b4d77ddfb3ce828fc73cab2c6cc6b1f8ef59` by the established release-by-SHA flow. The release archive SHA-256 was verified before extraction. PostgreSQL, cloudflared, prior releases, and rollback backup `C:\DigitalMap\backups\wu23-40-b2581f3` were preserved.
- Windows gate: focused 1 file / 16 tests, full 62 files / 413 tests, typecheck, Prisma validate/generate, production build, and Prisma migration status all PASS. The existing 28 migrations are up to date; WU-41 adds no migration. `/api/health` and `/api/ready` return 200 with database ready and fake mail.
- OWNER export returned 15 selected-Floor Spots including positioned/unpositioned and published/unpublished rows. UTF-8 BOM, the four system columns, five stable custom-field ID columns plus English text variants, IDs, and row versions were present.
- Mixed browser preview returned NEW 1 / UPDATE 1 / UNCHANGED 14 / ERROR 0 / CONFLICT 0, with four nonblocking duplicate-name warnings. Diffs covered standard values, optional clear, ja/en translations, Category add/remove, and all five custom types. Apply returned create 1 / update 1 / unchanged 14.
- Persisted text retained comma, quote, embedded newline, and leading `=` / `@` values exactly. The blank-ID Spot was created on the selected Floor with null x/y and unpublished state. The updated Spot preserved x/y, Floor, publish, PIN preset/icon/color, importance, visual size, both legacy photo URLs, and the Media relation.
- Audit action `SPOT_CSV_BULK_APPLIED` contains actor/Tenant/Map/Floor, counts, and two bounded IDs; it contains no raw CSV or changed field contents.
- Conflict flow: export, separate admin edit, stale upload produced CONFLICT 1 / ERROR 0 with Apply disabled and exact instruction `最新CSVを再Exportしてください`; a fresh no-edit export returned UNCHANGED 16 and applied with create/update 0. The later Chrome mobile conflict repeated the same zero-write block.
- Pending SpotRevision stayed PENDING at base v6 while CSV/admin edits advanced live state to v8 and later v9. Browser approval returned the existing stale-revision conflict and did not merge or approve it.
- Snapshot flow: after CSV apply, current public release `cmu0y07460008kwva0pgyga47` still displayed the old Spot. Republish created `cmu15w386000u4sva3mh5wty7`, which displayed the CSV name, formula-like/multiline values, Categories, every custom-field type, and English translations. A subsequent live admin edit again left that READY release unchanged.
- RBAC browser and same-origin endpoint probes: OWNER and assigned Map EDITOR export/preview/apply PASS; the editor's unassigned Map, Spot Editor, and Tenant B owner against Tenant A returned 404 for export, preview, and apply. Spot Editor dashboard exposed no bulk UI.
- Chrome responsive pass at 390 x 844 measured `scrollWidth === clientWidth === 390`. Summary counts, row warnings, CONFLICT, disabled Apply, and the re-export instruction were readable without horizontal clipping or ambiguity.
- Temporary QA credential hashes were restored and the temporary backup/helper files were removed. One empty/unpublished synthetic RBAC probe Spot created by the status probe was identified by strict invariants and removed; no production/shared database or rollback artifact was touched.

## Final result

- Start/docs baseline: `893b7eed64e71a49a38b0c7c6527a81eabedaca4`.
- Final code SHA: `9245b4d77ddfb3ce828fc73cab2c6cc6b1f8ef59`.
- WU-41 open defects: P0 0 / P1 0 / core P2 0 / P3 0. The previously accepted WU-40 cosmetic P3 remains outside this change.
- Result: **WU-41 PASS — READY TO RESUME HUMAN UAT**.
