# WU-49 Verification Matrix

Date: 2026-09-20 (Asia/Tokyo)

Baseline: `f22c04a3adefcd384053751c53394e9d35186029`  
Implementation candidate: `eb21d65b896042b96e6848c0de85d42453ea952a`

## Automated verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Frozen dependency install | PASS | `pnpm install --frozen-lockfile` completed locally and in an exact-SHA fresh clone. |
| Dependency audit | PASS | Production audit reported no known vulnerabilities. No ignore rule was added. |
| Prisma validation / generation | PASS | `prisma validate` and `prisma generate` completed. |
| Existing-DB upgrade | PASS, staged | Migration `20260920010000_tenant_data_foundation` applied to the verified QA-backup restore. All 20 Spots and 8 Categories received canonical tenant ownership; integrity anomaly counts remained zero. The separate multi-Map blocker remains. |
| Fresh database | PASS | All 29 migrations applied from zero; seed ran twice; final counts were 1 Tenant, 1 Map, 10 Spots, 6 Categories, and 10 SpotCategory rows. |
| Tenant foundation audit | PASS with blocker | Orphan/mismatch/collision counts were zero. The restored QA sample reports one Tenant with more than one Map. |
| IMAGE spatial audit | PASS | Audit correctly uses `x/y` as Illustration coordinates after `lat/lng` addition; no anomalies found. |
| Type check | PASS | Nuxt type check completed without errors. |
| Tests | PASS | 81 files / 539 tests passed against PostgreSQL, including migration failure cases and concurrent first-Map creation. |
| Build | PASS | Nuxt production build completed. Only the existing large Map chunk and plugin timing warnings were emitted. |
| Fresh-clone reproduction | PASS | Exact candidate SHA passed install, audit, Prisma, all 29 migrations, tenant/image audits, type check, 539 tests, build, and clean-tree checks. |
| GitHub Actions | PASS | `Verify` run [35464902322](https://github.com/NAOKI-Ko/digital-map/actions/runs/35464902322) passed install, production audit, Prisma validation/generation/migration, both audits, type check, tests, and build for pushed SHA `bca561ba0b9799fc39c20e3609c954ac268e1e2f`. |

## Contract and regression coverage

| Requirement | Verification |
| --- | --- |
| Spot / Category canonical tenant | Schema, migration, CRUD/query integration tests, and restored-data audit. |
| No silent ownership fallback | Isolated migration tests prove orphan Spot and tenant Category-name collision abort before an unsafe result. |
| Cross-tenant rejection | Integration tests cover Floor/Map, SpotCategory, CSV, revisions, invitations, and access-path checks. |
| Tenant-first reads | `getTenantSpots`, `getTenantSpotById`, and `getTenantCategories` return the same owned rows under integration coverage. |
| Illustration / Real coordinates | Boundary, null-pair, NaN/infinity, DB-check, and independence tests cover `x/y` versus nullable `lat/lng`. |
| Map capabilities | Schema validation and DB constraints cover enabled views and valid default view; migrated Maps default to Illustration-only. |
| One Map creation path | Transaction-scoped advisory-lock integration test proves concurrent first-Map creation permits exactly one winner. Existing duplicate QA rows are not changed. |
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

## Deployment and gate decision

Windows QA migration/deployment was **not attempted**. The verified QA backup contains Tenant `cmtygyjoe0000h8vadv3cau9l` (`qa`) with five Maps, and the audit cannot safely choose a canonical Map or prove the others disposable. Per the mandatory stop condition, no hard `Map.tenantId UNIQUE`, deletion, merge, reassignment, new QA backup, or QA release activation is permitted until an operator-approved resolution exists.

Final WU-49 resume gate: **BLOCKED**.
