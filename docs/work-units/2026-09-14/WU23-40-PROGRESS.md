# WU-23〜WU-40 実装進捗

- Baseline: `3f373e6ae576b06fe386af544834b8fb7dc989b7`
- Branch: `feat/wu23-40-phase15-full-20260914`
- Worktree: `/Users/naoki/Documents/Codex/2026-09-14/digital-map-wu-23-through-wu/work/digital-map`
- Browser / Human UAT: WU-40 まで意図的に保留

| WU | Jira | Start SHA | Commit SHA | Schema / migration | Focused tests | Full tests | Typecheck | Prisma | Build | External | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WU-23 | KAN-56 | `3f373e6` | this WU commit | `20260914010000_auth_lifecycle` | 2 files / 12 tests PASS | 44 files / 312 tests PASS | PASS | validate + generate PASS | phase boundary pending | Email delivery deferred to WU-26 | PASS |

## WU-23 notes

- Invitation and reset raw tokens are issued once, while only SHA-256 hashes are stored.
- Organization invitation acceptance derives `tenantId` from the invitation row and creates only `MEMBER` membership.
- `User.authVersion` is the authoritative stale-session invalidation mechanism; active-user and live membership checks remain server-side.
- npm registry DNS was unavailable in the sandbox. Validation used the already-verified dependency tree from the baseline worktree without modifying `pnpm-lock.yaml`.
