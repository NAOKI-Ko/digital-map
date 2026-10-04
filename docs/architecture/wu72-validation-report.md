# WU-72 Phase 1 validation and candidate gate

2026-10-04. Base: `acbcba3378ef7bc3cdf76fef768195899b0ab370`. Its exact post-merge [Verify](https://github.com/NAOKI-Ko/digital-map/actions/runs/37175891872) passed before implementation. WU-72 and Accepted WU-71 Decision D were read from Asana; the user approved exclusive Category adoption before code changes. The [fixed inventory and migration plan](wu72-phase1-migration-plan.md) records every requested singleton boundary.

## Scope and compatibility

- Workspace 1:N Map, Owner-only creation, authorized explicit Map selection and no arbitrary first-Map choice.
- Workspace canonical Spot; unique consumer Map 0..1; optional matching canonical steward. No cross-Map content or Category sharing/transfer. Category retains Tenant/name uniqueness and its exclusive Map Editor rights.
- Independent same-Map Floor occurrences, including repeat placements on one Floor; canonical ID/content/photo/field/revision/assignment/analytics identity retained. Usage owns publication/PIN appearance; legacy Spot fields mirror primary occurrence and Usage.
- Map archive, Floor deletion and Map detachment preserve canonical content and schema provenance. Workspace Owner can manage detached/archived content and revisions. Adopted content with no placements can still be edited without creating an occurrence.
- Custom definition/value/translation identities retained; original schema Map immutable; disabled field values retained. CSV stays one row per canonical Spot and round-trips after the last occurrence is removed. Paper render numbering/keys use occurrence IDs while settings/content overrides retain canonical IDs.
- Immutable public releases are not rewritten; old manifests adapt in memory. New releases read locale and domain data in one repeatable-read snapshot. Public activation/rollback stays pointer-based; no LIVE fallback. Visitor details and analytics retain canonical identity.
- Additive schema, backfill, compatibility writes, ownership guards, then final singleton-index removal. No canonical record or column deletion. Backfill includes unpublished/unpositioned Spots and fails on inconsistent provenance. Existing pending revision versions are initialized without invalidation; movement never increments canonical contentVersion.

## Local evidence

All DB mutations/tests/migrations used localhost disposable `digital_map_test_*` databases. Canonical `digital_map` was read and dumped only (5 Workspaces / 5 Maps / 58 Spots / 18 Categories / 8 releases). The custom-format backup successfully restored into disposable databases. Both full migration deploy on a restored database and historical-schema upgrade tests passed; schema drift is empty and all 37 migrations are applied.

- Prisma validate and generate: PASS.
- Typecheck and production build: PASS.
- Full database-enabled tests: 763 PASS, 1 skipped. The existing WU-65 before/after external-DB equivalence test requires separate URLs; its skip is explicit. WU-72 historical upgrade and live domain integration tests ran.
- Domain/tenant/image/paper audits: PASS, no blocking anomalies. Multi-Map tenants are now informational, consistent with the approved scope.
- Codex independent review: full implementation reviewed in successive passes; findings on publication, list/media membership, concurrent conflicts, CSV without occurrences, paper numbering, Category dependents, placement-free edits and HTTP(S) validation were fixed. A final incremental review checks the last URL/null-coordinate corrections; its result is recorded in the Draft PR.
- Browser QA on local built output: 0 Map onboarding, 2 Map explicit selection, canonical detail with two Floors, secondary detail, primary deletion promoting remaining occurrence, adding and explicitly saving an independent occurrence. Mobile/reduced-motion dense recovery reached distinct PINs and canonical detail; desktop Floor switching and public release publication succeeded. An explicit bundled MapLibre worker URL was added after the built-output QA exposed missing relative worker assets.

Raw logs, screenshots and the read-only backup are retained outside Git in the task's `evidence/` directory. They are not production data or candidate deployment evidence. Final commit and Verify run SHA/URLs are recorded on the Draft PR so the evidence can be tied to its exact head without changing that SHA.

## Windows / Production status

Windows candidate has not been deployed or migrated. The prior Windows inventory in the plan is historical and cannot authorize a migration. Before candidate deployment, refresh its exact deployed SHA/data inventory, verify DB/Media/Public backups and restoration, confirm all head checks (tests/typecheck/build/Prisma/Verify/Codex review), then perform Windows QA on that exact candidate SHA. Public-LIVE parity, same-Floor repeat placements, Floor/delete/archive retention and publication rollback remain explicit Windows QA cases.

Production is untouched. No merge, Production promotion, main update, destructive migration or backup restore over active data is authorized by this PR. Rollback retains new domain records/schema, uses compatible application writes and immutable release pointers, and never deletes new content/placements to recreate a singleton model.
