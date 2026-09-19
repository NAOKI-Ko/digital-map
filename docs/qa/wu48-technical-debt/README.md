# WU-48 Technical Debt Audit and Closure

Date: 2026-09-19 (Asia/Tokyo)

## Current verdict

- Stage A audit: PASS — 13 candidates classified, zero CANDIDATE, zero audit areas omitted.
- Stage B implementation: PASS for authorized work — 10 confirmed debts fixed and verified.
- Stage C automated/fresh-clone/CI/Windows verification: PASS except explicitly listed approval/device gates.
- Parent development-restart gate: **BLOCKED** by TD-011.

Counts: 13 candidates; 11 confirmed debts/test gaps; 10 fixed and verified; 2 NOT_A_DEBT; 1 unresolved BLOCKED.

## Documents

- `CONTRACT-BASELINE.md` — baseline source and preserved contracts
- `AUDIT-COVERAGE.md` — scope, paths, methods, and omissions
- `DEBT-REGISTER.tsv` — finding-level status and evidence
- `VERIFICATION-MATRIX.md` — automated, browser, device, DB, Windows, and fresh-clone gates
- `CHANGE-REVIEW.md` — commit-to-debt review and deliberate non-changes

## Fixed areas

- stale address/geocode response rejection and duplicate mutation guards;
- viewer/admin timers and listener teardown plus failed decoration-save rollback;
- typed, readable Spot editor action handling;
- ETag/CAS publication pointer compensation;
- canonical safe restore targets and exact media manifest verification;
- repository CI parity;
- Reka dialog title/focus accessibility contract;
- the `deepmerge-ts` high advisory through a path-scoped compatibility override.

## Dependency override

- Path: `@prisma/config 7.10.0 > deepmerge-ts` only.
- Resolution: `deepmerge-ts 8.0.2`; Prisma remains on stable 7.10.0, with no RC or unrelated bulk update.
- Reason: Prisma 7.10.0 is the latest stable 7.x and fixes the vulnerable dependency at 7.1.5; the patched range starts at 8.0.0.
- Removal condition: remove the override when an approved stable Prisma line directly resolves `@prisma/config` to `deepmerge-ts >=8`, then rerun the complete dependency, test, Prisma, DB, build, and browser matrix.

## Blocking items

- TD-011: physical iPhone Safari and real outside-area GPS event require user/device execution.

No main merge, Production deployment, or task-system status update was performed.

Windows QA runs exact SHA `81dbc0f0ff0f19351d5c3987621f3886bd8f54c9`; the later evidence commit is documentation-only.
