# WU-50 verification matrix

| Area | Evidence | Result |
| --- | --- | --- |
| Exact base | merge-base and branch ancestor checks against `a762e254…` | PASS |
| Protected paths | base-to-HEAD diff for `prisma/`, `server/`, `shared/schemas/` | PASS — no changes |
| Dependencies | `package.json` and `pnpm-lock.yaml` base-to-HEAD diff | PASS — no changes |
| Routes | base and HEAD page/API path inventories | PASS — unchanged |
| Type safety | `pnpm typecheck` | PASS |
| Unit/integration regression | `pnpm test` | PASS |
| Production compilation | `pnpm build` | PASS (existing chunk-size advisory only) |
| Production dependencies | `pnpm audit --prod` | PASS — no known vulnerabilities |
| Prisma | `prisma validate` and `prisma generate` | PASS |
| Fresh clone | frozen install, tests, typecheck and build | PASS at `0e2d0a2aaf97e5dcd3ae0bb1b653470fb92ae3b4` |
| GitHub Actions | implementation SHA `bc939c30…`, Verify run `35475968801` | PASS |
| Windows QA | verified backup, exact implementation-SHA deploy and representative regression | PASS |

## Contract assertions

- DB schema unchanged.
- Migrations unchanged.
- API contracts unchanged; no additive `WU49_UI_ALIGNMENT_EXCEPTION` was needed.
- Route set unchanged.
- Domain fields and capabilities unchanged.
- Only the redundant controls listed in `UI-CONTRACT-DIFF.md` were removed.

## Focused automated coverage

- Admin navigation and shell accessibility.
- Single-Map dashboard behavior and Map creation semantics.
- Illustration/Real navigation status.
- Spot latitude/longitude inputs and paired/range validation.
- PIN editor inspector modes, action ordering and responsive geometry.
- Public mobile Map zoom-control policy.
- Existing regression suite for publication, RBAC, revisions, uploads, map interactions and product flows.

Final local regression count: 79 files passed, 3 skipped; 533 tests passed, 16 skipped.

## Windows QA evidence

- Previous release: `cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`.
- Deployed implementation: `bc939c30d16611530d7e37b96360d135f26fb8c4`.
- Immutable release: `C:\DigitalMap\releases\bc939c30d16611530d7e37b96360d135f26fb8c4`.
- Verified pre-deploy DB/Media backup: `C:\DigitalMap\backups\pre-wu50-cfdaa7d-20260920-0830`.
- Archive SHA-256: `f39018cb9c97c076f709380f35dd11201cc9f180af35e475af7c8c470abdea91`.
- Windows gates: all 30 migrations current/no pending migration; Tenant and IMAGE audits zero anomalies; 82 files/549 tests PASS; typecheck and production build PASS.
- Runtime: app, PostgreSQL and Cloudflare tunnel RUNNING; local ready, public Map and admin login returned HTTP 200.
- Browser: 1280×800 admin workspace, 390×844 PIN editor and Spot form, 390×844 public Map/Spot sheet, 844×390 public Map/info dialog; no horizontal overflow and no browser console warning/error.
- Public QA URL: `https://sur-context-basin-concert.trycloudflare.com`.
- Existing releases and backups were preserved. Production was not accessed or deployed.

The evidence commit that records these results is documentation-only and is intentionally not an application deployment; the exact application implementation above is the Windows QA release.
