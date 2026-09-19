# WU-49 Verification Matrix

Date: 2026-09-20 (Asia/Tokyo)

Baseline: `f22c04a3adefcd384053751c53394e9d35186029`  
Deployed implementation: `cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`

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
| Tests | PASS | 81 files / 545 tests passed against PostgreSQL, including hard unique success/failure, direct second-Map rejection, concurrent first-Map creation, and all three publication-toggle decisions. |
| Build | PASS | Nuxt production build completed. Only the existing large Map chunk and plugin timing warnings were emitted. |
| Fresh-clone reproduction | PASS | Clean checkout of exact SHA `cfdaa7d` passed frozen install, production audit, Prisma validation/generation, type check, 81 files / 545 tests (529 passed, 16 DB-dependent skipped without local `DATABASE_URL`), build, and `git diff --check`. The same exact SHA passed all 545 tests against isolated PostgreSQL on Windows QA. |
| GitHub Actions | PASS | `Verify` run [35472750412](https://github.com/NAOKI-Ko/digital-map/actions/runs/35472750412) passed for pushed SHA `cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`. No audit ignore, test weakening, Prisma major/RC, or unrelated dependency update was used. |
| Windows candidate gates | PASS | Frozen install, production audit, Prisma generation/validation, all 30 migrations, tenant/image audits, 81 files / 545 tests on an isolated database, type check, and production build passed. |
| Exact tracked-tree deployment | PASS | Archive SHA-256 `69a79a7dae8ebd82a121391b83b7ead4a079aa3836839e6e552573646e57fef5`; all 536 tracked files were verified byte-for-byte before activation. |
| Windows health | PASS | Active release `C:\DigitalMap\releases\cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`; PostgreSQL/app/tunnel healthy and local HTTP passed after activation. |
| Post-deploy backup/restore | PASS | Verified backup `post-wu49-unblock-cfdaa7d-20260920-072846` restored to disposable DB/media; exact media verification, all migrations, both audits, counts `4/3/8/17/7`, expected public Map, restored `/api/ready` 200, and disposable cleanup passed. |

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

Windows Chrome regression passed for dashboard (exactly one Map), Map home, 16-item Spot list, Spot detail/edit, all 7 Categories, PIN move/cancel without saving, public pins/categories/detail, and zero console warnings/errors. The final publication regression then passed end to end: unpublish, explicit resume of the stopped current release, and republish of the same release `cmu15w386000u4sva3mh5wty7`. The public Map rendered 10 pins; Category filtering reduced the visible pin set as expected; Spot detail opened; the dashboard still showed exactly one published Map; admin/public console warning and error counts were zero.

Compatibility handling is deliberately narrow. When an unpublished Map still has a current READY release, the primary switch resumes that immutable release via the existing rollback endpoint. A separate `最新内容を公開する` action continues to build a new immutable release and therefore continues to reject the 13 legacy absolute remote photo URLs. No photo was cleared or normalized, no asset validation was weakened, and first publication still uses the new-release path.

## Windows QA cleanup and activation status

The approved fixed-ID cleanup, hard one-Map migration, source/CI gates, exact-SHA Windows deployment, endpoint checks, and post-deploy backup/restore succeeded. Exactly four Maps were deleted, KEEP remains intact, no MediaAsset was deleted, every Tenant has zero or one Map, and old releases/backups remain.

Final WU-49 verdict is `PASS-READY`. The required Windows browser publish/unpublish/republish path completed while preserving the original READY release and all KEEP data. Legacy remote photos remain intentionally blocked only when an operator explicitly asks to build latest content. No main merge or Production deployment was performed. WU-48's overall resume gate remains `BLOCKED` pending its separate real-device UAT.
