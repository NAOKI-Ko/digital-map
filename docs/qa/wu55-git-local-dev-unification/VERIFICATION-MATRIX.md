# WU-55 verification matrix

| Area | Gate | Result |
|---|---|---|
| Git | WU-55 starts from exact `dev` SHA | PASS — `db662f07490b7a2016ea27f3221cbf738f586fed` |
| Git | PR merge to `dev`, post-merge CI | PASS — PR #1, merge `2a1200e`, run `35527732332` |
| Git | Default branch `dev`; `main` unchanged | PASS — `main` remains `a58b4353` |
| Git | `dev`/`main` protection with `verify` | PASS — strict PR + `verify`, no force push/delete |
| Git | Checkpoint tag and safe branch cleanup | PASS — annotated tag at `db662f0`; final remote branches `dev`/`main` |
| Local | Compose resolves to `digital-map-local` | PASS — profile-free PostgreSQL and `full` app |
| Local | Canonical WU-54 baseline restored | PASS — Windows VERIFIED post-fix baseline: 3 users/Workspaces/Maps, 48 Spots, 18 standard + 1 preserved custom field, 3 READY |
| Local | Shared Media/Public persistence | PASS — all 4 Media and 30 Public manifest checksums |
| Local | Two Docker recreates preserve state | PASS — final authoritative baseline survived two further recreates with same volume, counts, checksums, and ready=200 |
| Local | Host Nuxt sees identical state | PASS — ready=200 and `arimatsu-tama` rendered |
| Quality | Frozen install and production audit | PASS — pnpm 11.9.0; no known production vulnerabilities |
| Quality | Prisma validate/generate | PASS — Prisma 7.10.0; 30 migrations current |
| Quality | Full PostgreSQL tests | PASS — isolated disposable DB, 86 files / 572 tests |
| Quality | Typecheck and build | PASS |
| Quality | Tenant/IMAGE/default-field audits | PASS — zero anomalies; six standard fields per Map |
| Quality | Browser smoke | PASS — top/public Map rendered without overlay; read-only authenticated smoke saw 3 Workspaces, OWNER own Map, MEMBER access to two other Maps, six fields each |
| Scope | Production and `main` unchanged | PASS — no deployment; `main` exact starting SHA |
