# WU-23〜WU-40 実装進捗

- Baseline: `3f373e6ae576b06fe386af544834b8fb7dc989b7`
- Branch: `feat/wu23-40-phase15-full-20260914`
- Worktree: `/Users/naoki/Documents/Codex/2026-09-14/digital-map-wu-23-through-wu/work/digital-map`
- Browser / Human UAT: WU-40 まで意図的に保留

| WU | Jira | Start SHA | Commit SHA | Schema / migration | Focused tests | Full tests | Typecheck | Prisma | Build | External | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WU-23 | KAN-56 | `3f373e6` | `6ab5eb3` | `20260914010000_auth_lifecycle` | 2 files / 12 tests PASS | 44 files / 312 tests PASS | PASS | validate + generate PASS | phase boundary pending | Email delivery deferred to WU-26 | PASS |
| WU-24 | KAN-53 | `6ab5eb3` | `1db0dc0` | `20260914020000_spot_editor_revisions` | 4 files / 19 tests PASS | 45 files / 317 tests PASS | PASS | validate + generate PASS | PASS | Email delivery deferred to WU-26 | PASS |
| WU-25 | KAN-54 | `1db0dc0` | this WU commit | `20260914030000_audit_events` | 3 files / 14 tests PASS | 46 files / 321 tests PASS | PASS | validate + generate PASS | not required | none | PASS |

## WU-23 notes

- Invitation and reset raw tokens are issued once, while only SHA-256 hashes are stored.
- Organization invitation acceptance derives `tenantId` from the invitation row and creates only `MEMBER` membership.
- `User.authVersion` is the authoritative stale-session invalidation mechanism; active-user and live membership checks remain server-side.
- npm registry DNS was unavailable in the sandbox. Validation used the already-verified dependency tree from the baseline worktree without modifying `pnpm-lock.yaml`.

## WU-24 notes

- Spot Editor is represented only by `SpotEditorAssignment`; no Tenant role was added.
- A partial unique PostgreSQL index enforces at most one `PENDING` revision per Spot.
- Revision media uses real `MediaAsset` references, and approval applies only the fixed editable field set after checking `baseVersion` against `Spot.liveVersion`.
- Public endpoints remain backed by live Spot relations and never query `SpotRevision`, so pending content remains isolated.

## WU-25 notes

- `AuditEvent` is tenant indexed and database-trigger protected against update/delete.
- The centralized writer recursively strips secret/token/password/header/body/hash metadata keys.
- Membership, Map role, invitation, Spot Editor, revision, publication, and high-impact deletion events are inserted inside the protected mutation transaction where practical.
- Audit reads are Owner-only, tenant constrained, newest first, and cursor paginated; no mutation route exists.
