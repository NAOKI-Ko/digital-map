# WU-55 Git / local development unification report

## Verdict at evidence commit

Local implementation and verification are PASS. GitHub PR/CI/default-branch/protection/tag/remote-cleanup gates are completed after this evidence commit and are reported in the task handoff; they must not be inferred as PASS from this file alone.

## Immutable references

- Starting `dev`: `db662f07490b7a2016ea27f3221cbf738f586fed`
- Starting `main`: `a58b4353bd108e6586f329080c772f69b8aaffda`
- WU-55 implementation: `abef5fe192f41d85e158ce8d41c1713e46cccfc0`
- Evidence SHA: the commit containing this report; resolve with `git log --format=%H -- outputs/WU55-GIT-LOCAL-DEV-UNIFICATION-REPORT.md`
- Production: unchanged; no deployment performed

## Git before state

- GitHub default branch: `main`
- Open PRs: none
- Remote branches: `main`, `dev`, WU-47 through WU-54 lines, WU-48-R2, WU-53 ops, WU-55, and `review/source-sync-20260919-203237`
- Canonical clone had one worktree. A separate clean WU-54 clone existed with ignored runtime artifacts.

## Local topology after unification

- Canonical clone: `/Users/naoki/Documents/Codex/2026-09-20/files-mentioned-by-the-user-digital/digital-map`
- Compose project: `digital-map-local`
- Services: profile-free `postgres`; `app` behind profile `full`
- Canonical DB: `digital_map`, host endpoint `127.0.0.1:5432`
- PostgreSQL volume: `digital-map-local_postgres_data`
- Managed Media: `.local-data/uploads`
- Local Public Storage: `.local-data/public`
- Host Nuxt and Docker app use the same DB and bind mounts
- Old `digital-map` Compose containers/network removed without `-v`
- Old `digital-map-wu52-postgres` container removed; its anonymous volume retained for recovery
- Old clean duplicate clone moved to Trash after its unique `.env` was copied outside Git with mode 600 and Media/Public hashes were proven identical

## Backup and baseline restore

- Pre-unification DB dump: `be072f97b7c00793730fc9d074292f9cbda11f96d8a7dba1c59973603e67f544`
- Pre-unification Managed Media: `393fb181399673b9f9a820cc539b955cab575ab552d603e15030d5ec2460d347`
- Pre-unification empty Public Storage: `05eb7d113dd6f70ed8a41635d029dc63ba5e27d5461b4d8ba028f564d58a3b54`
- WU-54 DB source: `434f708c5fbb483ccdf2c63432b082b8fe6f7e224c5a7be31531b96996c9fcb9`
- WU-54 Managed Media source: `8f6c92f47bd5d7be5f2d615095d87c44c59562194515da2e238bf4de8ac6c1d5`
- WU-54 Public Storage source: `8c8813b609083f2216fade29200118f52a7fbeb775ea869633e694e164416c1a`
- Restored counts: 3 users, 3 Workspaces, 3 Maps, 48 Spots, 18 standard Spot Fields, 3 READY current releases
- Discrepancy: the authoritative local WU-54 bundle has zero custom Spot Fields. No custom field was invented or approximated.

## Persistence proof

- Managed Media: 4 files; stable content-list signature `30155f97524de46b60bd7724306db146709d3f27564aea83b4d39db1057ca1e1`
- Public Storage: 30 files; stable content-list signature `8bef286ed93cca044c1ba3e8df9838ff4a108c214be252aa1b35a48e7fdf8037`
- Two explicit app build/recreate cycles, plus configuration recreates, retained the same DB volume and identical counts/hashes
- Docker app `/api/ready`: 200
- Host `pnpm dev` with Docker PostgreSQL: 200 and shared public Map rendered
- `docker compose down -v` was never run

The first Vitest pass was mistakenly pointed at canonical `digital_map` and left one fixture. The verified WU-54 dump was immediately restored. The final PostgreSQL test pass used disposable `digital_map_wu55_test`; it was removed after PASS and canonical counts remained unchanged.

## Quality gates

- `pnpm install --frozen-lockfile`: PASS
- `pnpm audit --prod --audit-level high`: PASS, no known vulnerabilities
- Prisma validate/generate: PASS, Prisma 7.10.0
- 30 migrations on disposable DB: PASS
- Vitest: PASS, 86 files / 572 tests
- Typecheck: PASS
- Production build: PASS
- Tenant Data Foundation audit: PASS, zero anomalies
- IMAGE spatial audit: PASS, zero exceptions
- Default Spot Field audit: PASS, six semantic standard fields per Map
- Compose config: PASS
- `git diff --check`: PASS

## Browser and authenticated smoke

- Browser top page: meaningful content, no framework error overlay
- Browser public `arimatsu-fon` and `arimatsu-tama`: MapLibre canvas and restored map image rendered
- Read-only authenticated smoke as `ふぉん`: 3 Workspaces visible; OWNER on own Workspace; MEMBER access to two other Maps; all three Maps readable; six standard Spot Fields each
- Public route status: 200
- QA credentials were not printed or committed; temporary clipboard content was cleared

## Remaining post-evidence gates

- Push WU-55 branch and open PR to `dev`
- Verify PR and post-merge GitHub Actions
- Change GitHub default branch to `dev`
- Protect `dev` and `main` with PR + required `verify`; disable force push/deletion
- Create annotated tag `qa-baseline-wu54-20260921` at starting `dev`
- Delete only remote branches proven merged/closed/unreferenced
- Reconfirm `main` SHA and Production remain unchanged
