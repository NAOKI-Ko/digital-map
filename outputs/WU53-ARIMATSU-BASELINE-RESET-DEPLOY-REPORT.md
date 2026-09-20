# WU-53 Arimatsu baseline reset and deployment report

## Verdict

PASS-READY — Local and Windows QA objectives, exact-SHA deployment, access/public QA, and both recovery proofs passed.

## Base and branch

- Base: `61b0acfe34889adcd579bc4f44af4a58a927f2dd`
- Branch: `ops/wu53-arimatsu-baseline-reset-deploy-20260920`
- Base CI: `35507354176` PASS
- Implementation SHA: `30b983b1ae15083a8a857d95f61d1a59082cefe4`
- Implementation CI: `35510714813` PASS

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

Bundle archive SHA-256: `7f002fe66272e88f3c14a9af9a4fab7c3b1e66335b9e7333d3b7551d6286d152`.

## Regression gates

- Full suite: 85 test files, 564 tests PASS on Windows; Local 548 PASS + 16 skipped where the optional DB gate was unavailable
- Typecheck, production build, Prisma validate/generate, dependency audit, Tenant audit, IMAGE audit: PASS
- Clean-clone verification and Git diff check: PASS
- GitHub Actions run `35510714813`: PASS on the exact deployed implementation SHA

## Windows QA result

- Previous deployed SHA: `bc939c30d16611530d7e37b96360d135f26fb8c4`
- Deployed SHA: `30b983b1ae15083a8a857d95f61d1a59082cefe4`
- Release path: `C:\DigitalMap\releases\30b983b1ae15083a8a857d95f61d1a59082cefe4`
- Public URL at verification time: `https://sur-context-basin-concert.trycloudflare.com`
- The accepted Local bundle was checksum-verified and restored as one unit; Windows was not independently reseeded
- Baseline/Tenant/IMAGE audits: PASS with 3 users, 3 Workspaces, 3 Maps, 48 Spots, 12 Categories, 3 MediaAssets, and 3 READY releases
- All three accounts logged in through an encrypted SSH-local path, saw all Workspaces, switched correctly, had owner controls only in the owned Workspace, and were denied owner-only operations elsewhere
- `/arimatsu-fon`, `/arimatsu-tama`, `/arimatsu-nau`, local `/api/ready`, and public `/api/ready`: HTTP 200
- Chrome visual check: PASS; the Arimatsu illustration rendered with map controls
- App and tunnel: running on the exact implementation SHA

The first activation attempt stopped safely before release activation when its audit invocation was invalid. No unverified release was served; the correct audits passed before the deployed markers were changed and the app was restarted.

## Windows recovery evidence

Pre-deploy verified backup: `C:\DigitalMap\backups\wu53-pre-30b983b-20260920-2132`.

- DB `40446309…a334`; Media `c90cda3b…25fc`; Public `64fe2bd6…346`

Post-deploy verified backup: `C:\DigitalMap\backups\wu53-post-30b983b-20260920-125852`.

- DB `b2b33bab…0a84`; Media `9f143a33…5269`; Public `ce1b54f9…2293`
- Disposable restore to a separate database and empty Media/Public roots: PASS
- Disposable baseline/Tenant/IMAGE audits, readiness, and all three public paths: PASS
- Disposable resources were removed after verification

## Security and scope

Passwords and private credentials are omitted. Authenticated QA did not send plaintext credentials through the public Cloudflare tunnel. `main`, Production DB, Production storage, R2, and unrelated Windows services were not changed.

## Final verdict

`PASS-READY`. Keep the Local authoritative bundle plus both Windows backups. Future recovery is manual restore of the verified DB + Media + Public set, not routine reseeding.
