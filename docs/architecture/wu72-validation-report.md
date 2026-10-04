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

## Windows candidate evidence

The user authorized PR #30 through Windows candidate QA, dev merge, exact merge-SHA redeployment and Asana completion, subject to all blocking acceptance gates passing. Production remains excluded.

Fresh Windows QA started at `2d12122fdf016e77b477ed6296a4c44ae7b6cfd6`. A frozen custom-format DB backup and Media/Public backups were restored into an isolated DB and isolated directories, then compared with every original table/column and file SHA256. Restore PASS. The rollback anchor retains the old application, verified backups and original immutable releases; rollback does not reverse migrations or overwrite active data.

Candidate `3e52bb8672ab6a9c867f5e7a3623a3430bab9926` passed Windows frozen install, Prisma validate/generate, all five migrations, domain/tenant/image/paper audits, typecheck and build. A second frozen backup preceded active QA migration and cutover. Readiness and exact candidate SHA passed.

| Preserved boundary | Before / after migration |
| --- | --- |
| Workspace / Map / Floor | 9 / 9 / 9, unchanged |
| canonical Spot / Category | 90 / 20, same IDs and all original columns |
| Usage / Placement / Category Usage | 90 / 90 / 20 added; missing mapping, duplicate and wrong-Map mapping: 0 |
| unpositioned / unpublished | 32 / 32 included in backfill |
| PublicRelease | 19, unchanged; existing slugs/current pointers unchanged |
| MediaAsset / SpotPhoto | 56 / 24, unchanged |
| field definitions / values / translated values | 31 / 0 / 0, unchanged |
| pending revision / assignment | 0 / 0, unchanged |
| original Media / Public files | 124 / 160, byte hashes unchanged |

Because the existing Windows fixture has no pending revisions, assignments or custom values, the historical upgrade regression now adds those before migration, together with CSV-origin field identity, translations, analytics references and a READY Release/current pointer. All original records and pending baseVersion survive backfill unchanged. Independent Codex review found no actionable defects. A Windows-only test initialization issue was fixed by importing AnalyticsBuffer after its Prisma global is installed; production behavior is unchanged.

Windows black-box HTTP QA exercised 16 groups: login/zero Map; 1 Map dashboard; second Map creation/list/ACL; managed Media/Floors; Category unique name/translation/default; Spot custom content/photo/translation; same-Floor and multi-Floor occurrences; direct-ID/nested-payload denials; DB sole consumer/steward/field invariants; CSV round-trip; assignment/revision approval after placement addition; authenticated LIVE/READY activation/public occurrences; immutable release/draft isolation/unpublish/rollback; referenced Category deletion refusal; Placement/Floor deletion retention; second Map publication/archive; analytics and existing Aquarium/Arimatsu Public URLs. API groups PASS. Public Aquarium retains 5 snapshot Floors/37 occurrences; Arimatsu URLs remain accessible. Four legacy `publication-*` synthetic missing-manifest fixtures already existed in the frozen baseline and remain fail-closed; WU63's existing empty public snapshot validly has zero Floors.

Browser and exact final-head Windows revalidation are required before Ready/merge. Their final results, CI URLs, deployment SHA, all acceptance judgments and post-merge evidence are recorded on PR #30 and Asana against the final SHA rather than rewriting this document after merge. Raw logs and screenshots stay in the task evidence directory.

Production is untouched. No main update or Production deployment is authorized. Legacy compatibility columns remain intentionally; cross-Map Spot/Category reuse and transfer remain deferred. App rollback retains new domain records/schema and immutable release pointers, without deleting content or placements to recreate a singleton model.
