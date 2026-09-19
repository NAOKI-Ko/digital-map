# WU-48 Technical Debt Audit and Closure

Date: 2026-09-20 (Asia/Tokyo)

## Current verdict

- R2 execution verdict: **PASS-READY-FOR-HUMAN-UAT**.
- Parent development-restart gate: **BLOCKED** until TD-011 Human UAT and TD-014 approval-gated repository governance are both resolved.
- R2 reopened/new findings: 12. Eleven are `FIXED_VERIFIED`; TD-014's workflow-source half is verified while its repository-settings half remains `BLOCKED_APPROVAL`.
- No main merge, Production deployment, device-UAT substitution, or task-system status change was performed.

The implementation target is `7c57e573e628e94d3858ab923a8d812a1bbbe2ff` on `fix/wu48-r2-debt-closure-20260920`. Windows QA runs that exact SHA. A later documentation-only evidence commit does not change the deployed application.

## Documents

- `CONTRACT-BASELINE.md` — baseline source and preserved contracts
- `AUDIT-COVERAGE.md` — R2 scope, methods, and residual limitations
- `DEBT-REGISTER.tsv` — finding-level status and evidence
- `VERIFICATION-MATRIX.md` — local, fresh-clone, CI, browser, DB, and Windows gates
- `CHANGE-REVIEW.md` — commit-to-debt review and deliberate non-changes
- `R2-REAUDIT-CLOSURE.md` — R2 closure evidence and governance handoff

## R2 closure summary

- Local storage CAS and same-map publication state transitions are serialized; failure compensation remains conditional.
- Restore destinations require a different database name, and media backup rejects links before traversal.
- Public snapshot validation inspects forbidden keys structurally; only typed asset fields can be rewritten, after strict upload-root containment checks.
- Admin save completion is tied to the originating editor generation; public overlays use one exclusive tagged state.
- CI now includes the production advisory gate and runs for `main`; interaction coverage includes geolocation lifecycle and delayed UI state transitions.
- README publication and restore documentation now describes immutable release snapshots, supported storage boundaries, restore safety, and override removal conditions.

## Dependency override

- Path: `@prisma/config 7.10.0 > deepmerge-ts` only.
- Resolution: `deepmerge-ts 8.0.2`; Prisma remains on stable 7.10.0, with no RC, Prisma major, or unrelated bulk update.
- Reason: the stable Prisma line still resolves an affected 7.x dependency while the patched range starts at 8.0.0.
- Removal condition: remove the override when an approved stable Prisma line directly resolves `@prisma/config` to `deepmerge-ts >=8`, then rerun the complete dependency, test, Prisma, isolated-DB, build, browser, CI, backup/restore, and Windows QA matrix.

## Remaining blockers

- TD-011: physical iPhone Safari and a real outside-area GPS event require Human UAT.
- TD-014: source changes are verified, but default-branch promotion, required-check/ruleset settings, direct-push restrictions, and bypass policy require explicit approval.

Old releases and backups were preserved. Windows QA was updated from `5d372a5a4332238af0d7084edd305a557f08f522` to `7c57e573e628e94d3858ab923a8d812a1bbbe2ff` only.
