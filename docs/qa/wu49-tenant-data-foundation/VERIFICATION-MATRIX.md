# WU-49 Verification Matrix

Date: 2026-09-20 (Asia/Tokyo)

Baseline: `f22c04a3adefcd384053751c53394e9d35186029`  
Deployed implementation: `8c4675ee019cbfcde06fe9964fcb05a70b699b94`

## Automated verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Frozen dependency install | PASS | `pnpm install --frozen-lockfile` completed locally and in an exact-SHA fresh clone. |
| Dependency audit | PASS | Production audit reported no known vulnerabilities. No ignore rule was added. |
| Prisma validation / generation | PASS | `prisma validate` and `prisma generate` completed. |
| Existing-DB upgrade | PASS | After replaying the approved cleanup against the new verified QA backup restore, migrations `20260920010000_tenant_data_foundation` and `20260920020000_map_tenant_unique` applied successfully. All 17 retained Spots and 7 Categories received canonical tenant ownership; integrity anomaly counts remained zero. |
| Fresh database | PASS | All 30 migrations applied from zero. Hard `Map.tenantId` uniqueness is present and onboarding Tenants with zero Maps remain valid. |
| Representative upgrade | PASS | New pre-cleanup QA backup restored locally, exact cleanup transaction replayed, migrations 29/30 applied, hard unique index confirmed, and tenant/image audits returned zero anomalies. |
| Tenant foundation audit | PASS | Orphan/mismatch/collision/capability/coordinate counts and multi-Map Tenant count are zero; audit now treats the hard one-Map policy as authoritative. |
| IMAGE spatial audit | PASS | Audit correctly uses `x/y` as Illustration coordinates after `lat/lng` addition; no anomalies found. |
| Type check | PASS | Nuxt type check completed without errors. |
| Tests | PASS | 81 files / 542 tests passed against PostgreSQL, including hard unique success/failure, direct second-Map rejection, and concurrent first-Map creation. |
| Build | PASS | Nuxt production build completed. Only the existing large Map chunk and plugin timing warnings were emitted. |
| Fresh-clone reproduction | PASS | Clean checkout of exact SHA `8c4675e` passed frozen install, production audit, Prisma validation/generation, type check, 81 files / 542 tests (526 passed, 16 DB-dependent skipped without local `DATABASE_URL`), build, `git diff --check`, and clean-tree checks. The same exact SHA passed all 542 tests against isolated PostgreSQL on Windows QA. |
| GitHub Actions | PASS | Final `Verify` run [35469796067](https://github.com/NAOKI-Ko/digital-map/actions/runs/35469796067) passed for pushed SHA `8c4675ee019cbfcde06fe9964fcb05a70b699b94`. An intermediate run at `4993c64` correctly failed because append-only audit cleanup was attempted; commit `8c4675e` reverted that weakening and the final run passed. |
| Windows candidate gates | PASS | Frozen install, production audit, Prisma generation/validation, all 30 migrations, tenant/image audits, 81 files / 542 tests on an isolated database, type check, and production build passed. |
| Exact tracked-tree deployment | PASS | Archive SHA-256 `1d7e7d1038d0a93214fbd617729b203702dcb70890ab2c03e72b55c1f1534bd6`; all 535 tracked files were verified byte-for-byte before activation. |
| Windows health | PASS | Active release `C:\DigitalMap\releases\8c4675ee019cbfcde06fe9964fcb05a70b699b94`; PostgreSQL/app/tunnel healthy; local and public health, ready, admin login, and public Map endpoints returned HTTP 200. |
| Post-deploy backup/restore | PASS | Verified backup `post-wu49-unblock-8c4675e-20260920-064305` restored to disposable DB/media; exact media verification, all migrations, both audits, counts `4/3/8/17/7`, expected public Map, and restored `/api/ready` 200 passed; disposable targets were deleted. |

## Contract and regression coverage

| Requirement | Verification |
| --- | --- |
| Spot / Category canonical tenant | Schema, migration, CRUD/query integration tests, and restored-data audit. |
| No silent ownership fallback | Isolated migration tests prove orphan Spot and tenant Category-name collision abort before an unsafe result. |
| Cross-tenant rejection | Integration tests cover Floor/Map, SpotCategory, CSV, revisions, invitations, and access-path checks. |
| Tenant-first reads | `getTenantSpots`, `getTenantSpotById`, and `getTenantCategories` return the same owned rows under integration coverage. |
| Illustration / Real coordinates | Boundary, null-pair, NaN/infinity, DB-check, and independence tests cover `x/y` versus nullable `lat/lng`. |
| Map capabilities | Schema validation and DB constraints cover enabled views and valid default view; migrated Maps default to Illustration-only. |
| One Map creation path | Transaction-scoped advisory-lock integration test proves concurrent first-Map creation permits exactly one winner. PostgreSQL unique index independently rejects a second Map. |
| Public compatibility | Public payload test proves canonical `tenantId` and `lat/lng` are not exposed and the established payload shape remains unchanged. |
| Standard seed | Fresh seed is idempotent and creates one Arimatsu Map only; it does not delete/reassign legacy rows. |

## Browser regression

A local Nuxt server was run against the disposable fresh database. The following passed in Chrome:

- administrator login and dashboard rendering;
- exactly one Map shown and no second-Map creation action offered;
- Map home, settings, and publication management navigation;
- immutable public release creation;
- public Illustration map rendering with all 10 pins;
- public Spot detail opening;
- no browser console warnings or errors during the final public flow.

The demo seed's remote `picsum.photos` photo URLs are intentionally not valid uploaded-asset URLs for immutable publication. For this disposable browser fixture only, `Spot.photosJson` was cleared before publication; product code and repository seed data were not changed. The local publication URL display uses the configured default `localhost:3000`, so verification opened the equivalent route on the test server's port `3011` directly.

Windows Chrome regression passed for dashboard (exactly one Map), Map home, 16-item Spot list, Spot detail/edit, all 7 Categories, PIN move/cancel without saving, public pins/categories/detail, and zero console warnings/errors. Unpublish succeeded. The immediate publish toggle failed because 13 active legacy `photosJson` values are absolute remote URLs and immutable publication rejects them as `INVALID_PUBLIC_ASSET_URL`. No KEEP data was edited. The original READY release was safely restored through the supported release-history UI (temporary rollback to the preceding READY release, then back to original release `cmu15w386000u4sva3mh5wty7`), and the public Map plus dashboard were reverified.

## Windows QA cleanup and activation status

The approved fixed-ID cleanup, hard one-Map migration, source/CI gates, exact-SHA Windows deployment, endpoint checks, and post-deploy backup/restore succeeded. Exactly four Maps were deleted, KEEP remains intact, no MediaAsset was deleted, every Tenant has zero or one Map, and old releases/backups remain.

Final WU-49 verdict is `BLOCKED`, not `PASS-READY`, because the required Windows browser publish/unpublish/republish path did not complete through the publish toggle. The active service is healthy and restored to its original published release; the remaining blocker is compatibility handling or owner-approved normalization of the 13 legacy remote photo URLs. No main merge or Production deployment was performed.
