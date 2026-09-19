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
| Fresh clone | frozen install, tests, typecheck and build | pending final gate |
| GitHub Actions | exact final SHA | pending final gate |
| Windows QA | backup, exact-SHA deploy and representative regression | pending final gate |

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
