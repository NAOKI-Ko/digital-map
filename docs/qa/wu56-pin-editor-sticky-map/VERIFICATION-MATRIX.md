# WU-56 verification matrix

Base: `e6b603bd4ae457db54b66df85da99aae9e7c35d2`  
Implementation: `ec7bdfa6070b5d15fac2c14fe964d915a05738e3`  
Branch: `feature/wu56-pin-editor-sticky-map-20260921`  
PR: `#3` → `dev`

| Area | Evidence | Result |
| --- | --- | --- |
| Scope | base-to-implementation diff | PASS — one Vue class change plus focused tests; no API, Prisma, migration, or dependency change |
| Sticky contract | `tests/wu56-pin-editor-sticky-map.test.ts` | PASS — Map-only, `lg`-only, `top-6`, `self-start`, unchanged height, no scroll listener |
| Existing PIN editor contract | `tests/wu45-pin-editor-modes.test.ts` | PASS |
| Frozen dependencies | `pnpm install --frozen-lockfile` | PASS |
| Production dependencies | `pnpm audit --prod --audit-level high` | PASS — no known vulnerabilities |
| Prisma | `pnpm prisma:validate`; `pnpm prisma:generate` | PASS |
| Full PostgreSQL tests | isolated migrated DB, `pnpm test` | PASS — 87 files, 575 tests, zero skipped |
| Type safety | `pnpm typecheck` | PASS |
| Production compilation | `pnpm build` | PASS — existing chunk-size advisory only |
| Tenant foundation audit | isolated fresh migrated DB | PASS — zero anomalies |
| IMAGE spatial audit | isolated fresh migrated DB | PASS — zero exceptions |
| Default Spot Field audit | isolated fresh migrated DB | PASS |
| Diff hygiene | `git diff --check` | PASS |
| Clean clone | frozen install, tests, typecheck, build at implementation SHA | PASS |
| Browser QA | Chromium, isolated seeded PostgreSQL DB, required viewports | PASS |
| Browser console | representative desktop/mobile journeys | PASS — zero errors |
| GitHub Actions | runs `35585720831`, `35585764995` | PASS |
| Windows QA | WU contract | Not required — local/Admin CSS-only change; no platform-specific issue found |

## PostgreSQL audit isolation note

The complete PostgreSQL suite passed 575/575. Running the default Spot Field audit immediately afterward correctly found one temporary publication-test Map without seeded Field Definitions. The three required audits were therefore rerun against a separate, freshly migrated audit database; all passed. No canonical or Production data was changed.

## Invariants

- `height="min(68vh, 46rem)"` is unchanged.
- Toolbar, title, breadcrumbs, and workspace container remain normal-flow.
- No JavaScript scroll or resize-on-scroll logic was introduced.
- Map coordinates, camera state, PIN state, save/cancel behavior, API, and schema are unchanged.
- `main` and Production were not changed.

