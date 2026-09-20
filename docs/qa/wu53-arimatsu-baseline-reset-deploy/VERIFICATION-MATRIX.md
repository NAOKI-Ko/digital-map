# WU-53 verification matrix

| Gate | Result |
|---|---|
| Exact base SHA and CI 35507354176 | PASS |
| Pre-reset DB + Media + Public backup | PASS |
| Pre-reset disposable restore | PASS |
| Destructive guard tests | PASS |
| Exact users / Workspaces / Maps | PASS |
| Access matrix and owner-only denial | PASS |
| 16 canonical Spots materialized 3× | PASS |
| Tenant and IMAGE audits | PASS |
| Normal publication, 3 READY releases | PASS |
| 3 public paths and `/api/ready` | PASS |
| Chrome illustration rendering | PASS |
| Authoritative three-component backup | PASS |
| Authoritative disposable restore | PASS |
| Full tests / typecheck / build / Prisma / clean clone / CI | PENDING |
| Windows pre-backup, deploy, restore, QA, post-backup | PENDING |

Current verdict remains `BLOCKED: WINDOWS DEPLOY PENDING` until the pending gates complete.
