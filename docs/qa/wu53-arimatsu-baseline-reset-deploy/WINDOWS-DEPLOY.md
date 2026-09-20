# WU-53 Windows QA deployment

Status: PASS on 2026-09-20.

## Exact source

- Implementation SHA: `30b983b1ae15083a8a857d95f61d1a59082cefe4`
- GitHub Actions run: `35510714813` PASS on that exact SHA
- Source archive SHA-256: `a809feac13a53be39c7732abaf0bbdd3ba9237207df2c6219817a9ffd0dda2c1`
- Deployed release: `C:\DigitalMap\releases\30b983b1ae15083a8a857d95f61d1a59082cefe4`

## Safety and baseline apply

The previous deployed SHA was `bc939c30d16611530d7e37b96360d135f26fb8c4`. Before any data replacement, the app was stopped and a verified three-component backup was written to `C:\DigitalMap\backups\wu53-pre-30b983b-20260920-2132`:

- DB SHA-256: `40446309336b60624dedb7438ab3134f30e61d7ba3537eb3174beed10021a334`
- Media SHA-256: `c90cda3bc755168ecc78c11a4a3fb738a189b881d4ae72cc8a6ed556b1a925fc`
- Public SHA-256: `64fe2bd6a14912d250cde35bd1cce10dd5954dfd7da0a4b58d74dc7c8b168346`

The accepted Local baseline archive SHA-256 was `7f002fe66272e88f3c14a9af9a4fab7c3b1e66335b9e7333d3b7551d6286d152`. It was checksum-verified and restored as one DB + Managed Media + Public Storage set to the guarded `qa` / `digital_map` / local-storage target. Windows was not independently reseeded. The old active media and public roots were retained alongside the pre-deploy backup.

## Validation

- Baseline, Tenant Data Foundation, and IMAGE audits: PASS; 3 users, 3 Workspaces, 3 Maps, 48 Spots, 12 Categories, 3 MediaAssets, and 3 READY releases
- Real-session QA over encrypted SSH localhost forwarding: all three users logged in, saw all three Workspaces, switched among them, read every Map, received owner controls only in their own Workspace, and received HTTP 403 for owner-only controls elsewhere
- Public routes `/arimatsu-fon`, `/arimatsu-tama`, `/arimatsu-nau`: HTTP 200
- Chrome rendering: PASS; the Arimatsu illustration and map controls rendered
- Local and public `/api/ready`: HTTP 200
- App and Cloudflare tunnel processes: running

## Post-deploy recovery proof

Verified post-deploy backup: `C:\DigitalMap\backups\wu53-post-30b983b-20260920-125852`.

- DB SHA-256: `b2b33babd362ffa36d56376d7f2edbd604df458f9406dff38164097363b80a84`
- Media SHA-256: `9f143a33961db4017b14bcdbdad042ce0b751b9a34df6f78f3949b6aba5d5269`
- Public SHA-256: `ce1b54f91108e08b59a832bfe19488d55a26aa34f3ee34ac48914d682fd92293`

The backup was restored into database `digital_map_wu53_disposable` and separate empty Media/Public roots. Checksums, all three data audits, disposable `/api/ready`, and all three disposable public routes passed. Disposable resources were then removed.

Production, R2, unrelated services, and `main` are out of scope and must remain unchanged.
