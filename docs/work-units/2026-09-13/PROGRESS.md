# Phase 1 Product Foundation & Feedback Batch Progress

Date: 2026-09-13  
Branch: `feat/phase1-product-foundations-20260913`  
Start SHA: `a58b4353bd108e6586f329080c772f69b8aaffda`

## Baseline

| Check | Result | Notes |
|---|---|---|
| Frozen lockfile install | PASS | `pnpm install --frozen-lockfile`; lockfile integrity passed. Registry metadata lookup was unavailable, dependencies resolved from the local store. |
| Prisma validate | PASS | `pnpm prisma:validate` |
| Current tests | PASS | `pnpm test`: 24 files, 197 tests |
| Typecheck | PASS | `nuxt typecheck` |
| Production build | PASS | `nuxt build`; existing sourcemap/chunk-size warnings only |

## Work units

| WU | Jira | Status | Commit | Tests / notes |
|---|---|---|---|---|
| WU-00 | KAN-49/50/51 and referenced PdM decisions | PASS | `75e64c4` | Product contracts created; baseline 24 files / 197 tests; runtime unchanged |
| WU-01 | KAN-49 | PASS | `508b74f` | IMAGE x/y and normalized reference points; migration-only epsilon `1e-12`; focused 83 tests, full 26 files / 219 tests, typecheck, Prisma validate, build PASS. Read-only audit command exits 2 because this worktree has no configured `DATABASE_URL`; migration remains fail-closed for unresolved rows. |
| WU-02 | KAN-7/40/49 | PASS | `8b2004c` | Replacement updates only image reference/dimensions and preserves normalized placement/georeference; selected-image preview/choose-again/reset UX; focused 7 tests, full 26 files / 223 tests, typecheck PASS. |
| WU-03 | KAN-33/40 | PASS | `f69f097` | Two-point flow retained; image zoom/pan, overlay opacity, non-destructive editing reset, confirmed saved mapping removal; focused 48 tests, full 27 files / 227 tests, typecheck PASS. |
| WU-04 | KAN-30 | PASS | `d46ccc3` | Dedicated candidate mode for set/reconfigure; only selected PIN draggable; explicit save/cancel; confirmed unplace preserves Spot and unpublishes; focused 38 tests, full 28 files / 233 tests, typecheck, Prisma validate, build PASS. |
| WU-05 | KAN-51 | PASS | `4e072ec` | Tenant MediaAsset and SpotPhoto foundation, tenant-scoped list/delete, usage reporting/deletion guard, managed upload registration with SHA-256. Legacy URL fields retained without guessed backfill; focused 5 tests, full 29 files / 238 tests, typecheck and Prisma validate PASS. |
| WU-06 | KAN-39 | PASS | `a6787a4` | One common picker with upload/library/recent/Map/all/usage views applied to Floor, Spot photos, Category icon, Custom PIN, and logo. Same-Tenant cross-use via asset IDs; URL compatibility retained; focused 33 tests, full 30 files / 243 tests, typecheck, Prisma validate, build PASS. |
| WU-07 | KAN-50 | PASS | PENDING COMMIT | MAP-scoped standard/custom field definitions, six defaults, address/website columns, typed custom values, mutation/required/type/deletion rules, and admin configuration UI. Full 31 files / 249 tests, typecheck, Prisma validate, and build PASS. Migration preflight remains unavailable without DATABASE_URL and exits fail-closed with code 2. |
| WU-08 | KAN-50 | PENDING | — | |
| WU-09 | KAN-38 | PENDING | — | |
| WU-10 | KAN-42 | PENDING | — | |
| WU-11 | KAN-44/37 | PENDING | — | |
| WU-12 | KAN-45 | PENDING | — | |
| WU-13 | KAN-11/14/31 | PENDING | — | |
| WU-14 | KAN-26/27/43 | PENDING | — | |
| WU-15 | KAN-12/25/47 | PENDING | — | |
| WU-16 | KAN-28 | PENDING | — | |
| WU-17 | KAN-35 | PENDING | — | |
| WU-18 | KAN-36 | PENDING | — | |
| WU-19 | KAN-46 | PENDING | — | |
| WU-20 | KAN-48 | PENDING | — | |
| WU-21 | KAN-16 | PENDING | — | Regression-only audit |
| WU-22 | — | PENDING | — | Documentation and QA handoff |
