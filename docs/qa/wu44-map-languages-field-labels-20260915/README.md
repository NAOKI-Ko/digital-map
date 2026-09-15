# WU-44 Map languages and field labels QA evidence

## Verdict

PASS-READY. P0: 0, P1: 0, core P2: 0, P3: 0. Human UAT is a separate gate and was not marked as passed.

## Lineage and scope

- Branch: `feat/wu44-map-languages-field-labels-20260915`
- WU-43 baseline: `cc0507f5a28a84168b078b9f02a4eee5d8145a1e`
- WU-44 implementation/browser-QA candidate: `59114515747c82c345727d7eb144d7f5d640841b`
- Final application release is the documentation-only descendant of the candidate that contains this evidence file. Its exact SHA is recorded in Windows runtime metadata and the external WU-44 report.
- Scope stayed limited to Map language configuration and FieldDefinition display labels. Spot text, categories, map/floor/PIN labels, and application/public chrome were not internationalized.
- WU-43 Reka wrappers were reused for the language Select and Dialog; no competing UI library or custom popup positioning was introduced.

## Existing model review and data semantics

The existing `20260914060000_ja_en_translations` migration already provides `Map.defaultLocale`, ordered `Map.enabledLocales`, and `SpotFieldDefinitionTranslation` with uniqueness on `(fieldDefinitionId, locale)`. WU-44 reused that coherent model; no Prisma schema change, new migration, DDL, or destructive backfill was required.

- Supported locales: `ja`, `en`, `zh-CN`, `zh-TW`, `ko`, `fr`, `de`, `es`, `it`, `pt-BR`.
- The legacy `SpotFieldDefinition.label` remains the authoritative required default-language label.
- Non-default translations remain locale rows. Nonblank updates upsert; an explicitly blank value removes only that locale row.
- Disabling a locale changes Map membership only and retains translation rows; re-adding restores their values.
- Read fallback is requested nonblank translation, then the Map default label. Fallback text is never persisted as a fake translation.
- Existing English translation rows are retained and surfaced when English is re-enabled. No duplicate or competing translation model was created.

## API and authorization

- Map detail and spot-field reads expose `defaultLocale`, ordered `enabledLocales`, and field translations.
- `GET/PATCH /api/maps/:mapId/languages` provide coherent language configuration operations.
- Field create/update accepts default label and translations in one operation.
- Existing Map settings and FieldDefinition authorization was reused. Automated tests cover unauthorized and cross-Tenant access; IDs alone do not bypass parent Map/Tenant checks.

## Local validation

- Focused WU-44/WU-43/public tests: 5 files, 41 tests passed.
- Full suite: 70 files, 478 tests passed.
- Typecheck: passed.
- Prisma validate: passed.
- Prisma generate 7.10.0: passed.
- Migration status: 28 migrations, database up to date.
- Production build: passed.
- `git diff --check`: passed.
- Read-only audit after QA cleanup: Maps 4; FieldDefinitions 1; SpotFieldValues 0; translations 0; English translations 0; missing default locale 0; missing enabled default 0; blank field labels 0; duplicate translation keys 0.

Local browser QA added/reloaded English, added/removed `zh-CN`, verified duplicate suppression, saved/reloaded a field translation, verified disable/re-add retention, and restored the original data. With all 10 supported languages temporarily enabled, both edit and add-field forms rendered 10 stacked inputs without horizontal overflow at desktop, 900px, or 390x844.

## Windows backup and migration safety

- Previous active SHA: `cc0507f5a28a84168b078b9f02a4eee5d8145a1e`
- Previous release: `C:\DigitalMap\releases\cc0507f5a28a84168b078b9f02a4eee5d8145a1e`
- Verified backup: `C:\DigitalMap\backups\pre-wu44-map-languages-5911451-20260915-194110`
- DB dump: `C:\DigitalMap\backups\pre-wu44-map-languages-5911451-20260915-194110\db\digital-map-20260915T104111Z.dump`
- Media snapshot: `C:\DigitalMap\backups\pre-wu44-map-languages-5911451-20260915-194110\media\20260915T104112Z`
- Checksum manifest: `C:\DigitalMap\backups\pre-wu44-map-languages-5911451-20260915-194110\SHA256SUMS.txt` (1291 bytes)
- Backup verification passed; all earlier backups were preserved.
- Candidate archive SHA-256: `1c552afc57ad370b0141569098562c7cc8873f8e70f6b6b52b185c8e951a6c23`; local and Windows hashes matched.
- Migration directories remained exactly the same 28 entries. `prisma migrate deploy` reported no pending migrations, and status remained up to date.
- Pre/post migration audit was identical: Maps 5; FieldDefinitions 29; SpotFieldValues 10; translations 1; English translations 1; missing default locale 0; missing enabled default 0; blank field labels 0; duplicate keys 0.

The exact final SHA was deployed release-by-SHA to a new immutable release after this evidence commit. The previous release and backup are the rollback anchors; DB restore is reserved for an actual data/runtime P0 or P1 because WU-44 added no migration.

## Windows automated and browser QA

Candidate Windows gates passed: frozen install, Prisma validate/generate/status, IMAGE audit, 70 files/478 tests, typecheck, production build, health, and ready.

Browser QA on the Windows candidate verified:

- Japanese shown first and protected as default.
- Keyboard-driven Reka language Select added English; reload persisted it and duplicate English was unavailable.
- `zh-CN` could be added and removed safely.
- Popup stayed aligned within the viewport at 900x800 and 390x844, with a 6px trigger gap; Escape closed it and restored trigger focus.
- WU-43 compact field list remained intact.
- Expanded editor showed required Japanese and optional English inputs.
- Legacy English `Description` appeared after English was enabled; an edit persisted across reload and was then restored.
- A custom field with Japanese and English labels was created coherently, reloaded, and then safely removed as QA cleanup.
- Cleanup restored `enabledLocales` to `["ja"]`, retained legacy English `Description`, and returned the data audit to Maps 5 / FieldDefinitions 29 / SpotFieldValues 10 / translations 1.
- At 900px and 390x844, stacked multilingual inputs had no page-content horizontal overflow.
- Read-only regression smoke passed for PIN workspace, Floors, Spots, Publish, and the public map.
- Browser console errors: 0.

QA URL: `https://sur-context-basin-concert.trycloudflare.com`

## Rollback readiness

The prior application release, verified pre-WU-44 DB dump, media/runtime snapshot, checksum manifest, and all older backups remain preserved. Application rollback is a release pointer/process switch to the prior SHA. No DB rollback is expected because the migration was a reviewed no-op; if a P0/P1 data issue appears, stop the application and restore the verified DB/media/runtime backup using the established Windows procedure.

## Release constraints

No GitHub push, main merge, Jira update, or Production deployment was performed.
