# WU-48 R2 Re-audit Closure

Date: 2026-09-20 (Asia/Tokyo)

## Verdict and identifiers

- Verdict: **PASS-READY-FOR-HUMAN-UAT**
- Parent WU-48 restart gate: **BLOCKED**
- Baseline: `e3d58c8835290cac2dbf3ac9a4e777c5df0b6255`
- Final implementation: `7c57e573e628e94d3858ab923a8d812a1bbbe2ff`
- Working branch: `fix/wu48-r2-debt-closure-20260920`
- Evidence commit: documentation-only successor to the implementation SHA
- R2 reopened/new: 12
- Fully `FIXED_VERIFIED`: 11
- Source-fixed but approval-blocked: TD-014
- Remaining blockers: TD-011, TD-014

## Closure evidence

- TD-005A/B: local same-key CAS is serialized; same-map DB/pointer transitions use a bounded PostgreSQL advisory lock. Deterministic unit races and four real PostgreSQL concurrency/compensation cases passed.
- TD-006A/B: PostgreSQL URL aliases normalize to restore semantics, the destination DB name must differ, links are rejected before traversal, Windows junction rejection passed, and local/Windows disposable restores passed.
- TD-016/017: forbidden keys are inspected structurally; ordinary values may contain those tokens. Only typed asset fields rewrite, with strict shared parsing, extension checks, realpath upload-root containment, escape rejection, and deduplication.
- TD-018/019/021: timer/state tests cover geolocation lifecycle; public overlay state is exclusive; delayed admin save completion can affect only its originating editor context.
- TD-014/015: CI audits production dependencies and verifies main pushes. Hosted Actions run `35459480854` passed. Repository setting changes remain outside authority.
- TD-020: product documentation now reflects immutable publication snapshots, storage-driver boundaries, restore safety, current branch, and override removal.

## Complete verification

- Local and final fresh clone: frozen install; production audit clean; Prisma validate/generate; 28 isolated migrations; zero IMAGE spatial exceptions; typecheck; 78 files/522 tests; production build; clean/diff checks.
- GitHub Actions: `https://github.com/NAOKI-Ko/digital-map/actions/runs/35459480854`, exact implementation SHA, success.
- Browser: local and final Windows public/admin flows passed; final console warning/error log was empty. Responsive Chromium checks do not substitute for physical Safari.
- Windows QA: `5d372a5a4332238af0d7084edd305a557f08f522` → `7c57e573e628e94d3858ab923a8d812a1bbbe2ff`. Local/public health, readiness, login, and public-map routes returned 200.
- A Windows-only direct-module test failure in candidate `82eecf3` was caught before activation. Explicit dependency import `7c57e57` fixed it; the full matrix was rerun.
- Release archive SHA-256: `d60052ce1a37b22f5b995ffadf3d81eb94943c589723eda3d0e87e5fe1fa760a`.
- Backup: `C:\DigitalMap\backups\pre-wu48-r2-5d372a5-20260920-0245`.
- DB dump SHA-256: `eae5a2911842e45b68ed3da2e1ef909a0a8c42e66d2cc6a6532faee50c6d6b2a`.
- Media archive SHA-256: `35912f2eda997bb9deecc2cfef6e469058ff6da442277473c52f2b97c9550349`.
- Disposable Windows restore: 28 migrations, zero spatial exceptions, exact 34 media files; disposable DB/media and junction fixture removed.

## Dependency decision

The only major transitive change is the approved path-scoped override `@prisma/config > deepmerge-ts 8.0.2`. Prisma remains stable 7.10.0. No RC, Prisma major, unrelated bulk update, advisory ignore, or weakened test is present. Remove the override only after an approved stable Prisma release resolves that path to `deepmerge-ts >=8`, followed by this full matrix.

## TD-014 approval handoff

Before authoritative promotion, an approver must decide and apply:

1. Merge strategy for the verified working branch.
2. Authoritative SHA and linkage from the implementation SHA to this evidence SHA.
3. Required status check named `verify`.
4. Branch protection or ruleset for the authoritative/default branch.
5. Direct-push restriction.
6. Administrator bypass policy.
7. Whether and when a post-merge Windows QA or Production deployment is authorized.

No item in this checklist was changed during R2.

## Residual Human UAT

TD-011 remains open for physical iPhone Safari toolbar/gesture behavior and a real outside-area GPS request. It is not auto-passed by responsive Chromium, mock geolocation, or desktop browser evidence. TD-011 and TD-014 must both close before the WU-48 restart gate can move from BLOCKED.

No main merge or Production deployment occurred. Old releases and backups were preserved.
