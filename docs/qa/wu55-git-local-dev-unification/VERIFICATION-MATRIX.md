# WU-55 verification matrix

| Area | Gate | Result |
|---|---|---|
| Git | WU-55 starts from exact `dev` SHA | PASS — `db662f07490b7a2016ea27f3221cbf738f586fed` |
| Git | PR merge to `dev`, post-merge CI | Pending |
| Git | Default branch `dev`; `main` unchanged | Pending |
| Git | `dev`/`main` protection with `verify` | Pending |
| Git | Checkpoint tag and safe branch cleanup | Pending |
| Local | Compose resolves to `digital-map-local` | PASS — profile-free PostgreSQL and `full` app |
| Local | Canonical WU-54 baseline restored | PASS with recorded discrepancy — 3 users/Workspaces/Maps, 48 Spots, 18 standard fields, 3 READY; authoritative bundle has 0 custom fields |
| Local | Shared Media/Public persistence | PASS — 4 Media files and 30 Public files with stable signatures |
| Local | Two Docker recreates preserve state | PASS — same DB volume, counts, hashes, and ready=200 |
| Local | Host Nuxt sees identical state | PASS — ready=200 and `arimatsu-tama` rendered |
| Quality | Frozen install and production audit | PASS — pnpm 11.9.0; no known production vulnerabilities |
| Quality | Prisma validate/generate | PASS — Prisma 7.10.0; 30 migrations current |
| Quality | Full PostgreSQL tests | PASS — isolated disposable DB, 86 files / 572 tests |
| Quality | Typecheck and build | PASS |
| Quality | Tenant/IMAGE/default-field audits | PASS — zero anomalies; six standard fields per Map |
| Quality | Browser smoke | PASS — top/public Map rendered without overlay; read-only authenticated smoke saw 3 Workspaces, OWNER own Map, MEMBER access to two other Maps, six fields each |
| Scope | Production and `main` unchanged | PASS so far — recheck after Git operations |
