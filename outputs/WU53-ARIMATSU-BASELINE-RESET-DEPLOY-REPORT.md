# WU-53 Arimatsu baseline reset and deployment report

## Verdict

IN PROGRESS — Local baseline and disposable restore PASS. Windows deployment is pending exact-SHA CI selection.

## Base and branch

- Base: `61b0acfe34889adcd579bc4f44af4a58a927f2dd`
- Branch: `ops/wu53-arimatsu-baseline-reset-deploy-20260920`
- Base CI: `35507354176` PASS

## Local result

- Login aliases: `fon@arimatsu.test`, `tama@arimatsu.test`, `nau@arimatsu.test`
- Topology: 3 users, 3 Workspaces, 3 Maps, exactly one Map per Workspace
- Dataset: 16 sourced Spots and 4 Categories per Map; 48 and 12 independent rows total
- Media: one independently owned approved illustration asset per tenant
- Publication: three normal-flow READY releases
- Public URLs: `/arimatsu-fon`, `/arimatsu-tama`, `/arimatsu-nau`
- Access matrix, owner-only denial, Tenant audit, IMAGE audit, Chrome rendering: PASS
- Pre-reset and authoritative DB + Media + Public backups: PASS
- Authoritative disposable restore and health/public checks: PASS

## Authoritative backup

`/Users/naoki/Documents/Codex/2026-09-20/t/work/qa-baselines/arimatsu-3user-20260920T122127Z`

DB `9c7319be…eba4`; Media `1c28e0fb…73db`; Public `397ecb48…d4f7e`.

## Security and scope

Passwords and private credentials are omitted. `main`, Production DB, Production storage, and R2 were not changed.

## Pending

Final regression gates, commit/push/CI, exact-SHA Windows QA deployment, Windows validation, and Windows post-deploy backup/restore.
