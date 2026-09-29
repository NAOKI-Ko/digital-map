# Windows QA — WU-66

- Base dev: `d4e4df3a1acc4565e6fc1afee1218e4e6bb8ccf0`
- Contract: `5810a9c`
- Implementation: `d5440ce751b7db8661eb99313da28236d1a4f9f1`
- Implementation PR: https://github.com/NAOKI-Ko/digital-map/pull/23
- PR Verify PASS: https://github.com/NAOKI-Ko/digital-map/actions/runs/36515717882 (push Verify 36515713560 also PASS)
- Merge/exact QA candidate: `4a90be0186666a0e2007029da85e5a0846539e2a`
- Post-merge Verify PASS before Windows backup: https://github.com/NAOKI-Ko/digital-map/actions/runs/36516007556
- Prior QA: `0d0d1d5d75b6009c34e4bc37f9a6c5231e5cb245`
- Production/main baseline: `a58b4353bd108e6586f329080c772f69b8aaffda`

## Backup / source transfer

Windows host chiffonchan, existing C:\DigitalMap runtime, app port 3011. No network/tunnel/OS configuration changes. Script execution uses process-only ExecutionPolicy Bypass for reviewed scripts; initial direct .ps1 execution was rejected by the existing Windows policy before backup ran.

Source is `git archive` of exact merge SHA; source and Windows SHA-256 both `04866449832c8f79c35c12c2538a021c6f3f5c0b410a43393619e1e06818cca1`.

Verified backup root: `C:\DigitalMap\backups\wu66-public-indoor-20260929`

- DB `db\digital-map-20260929T031458Z.dump`
- Managed Media `media\20260929T031500Z`
- Public Storage `public\20260929T031502Z`
- `backup:verify`: PASS

Preservation baseline includes all 90 Spots, 20 Categories, 9 Maps, Floor records, SpotCategory links and public asset hashes. Digest: `f0564760f247798219ffa92d2efcf021d5a06596fe849c75ca24dae7618ec8c1`. Capture precedes all preparation. Before/after audit excludes analytics, sessions and other unrelated transient data.

## Preparation

New release directory is named with exact merge SHA. Frozen install, Prisma validate, IMAGE spatial audit, migration status and preservation comparison PASS. No existing QA DB migration. Destructive tests run only against newly created `digital_map_test_wu65_wu66`; 678 PASS / 1 optional private WU65 comparison SKIP. Typecheck/build and activation results follow below. Full per-step logs remain under backup root `deployment-logs`.

Activation script retains prior release path/SHA and automatically restores them if local/public health or preservation check fails. No schema differences; prior release remains available. Production/main is not an activation target.

## Activation and post-deploy result — PASS

Windows typecheck and build PASS. Activated exact `4a90be0186666a0e2007029da85e5a0846539e2a`; app, PostgreSQL and Cloudflare tunnel RUNNING. Local HTTP PASS, local `/api/ready` 200, public `/api/ready` 200, existing Aquarium page 200. Preservation audit after activation returns the identical digest above (`match: true`). Rollback was not needed.

Public API JSON is structurally identical before/after. Sorted-JSON SHA-256: `0054dc8ad74c5b97caf3b07a6db7ff923ebdbbf43384c578f0c413f297b17906`. Existing map `cmukrf4gz0007c8vawtaeozwn`, release `cmukwfp30003hc8va3evrt3vp`, five Floors, 37 Spots/PINs, six Categories. No republish/rebuild/replacement of fixture. Final browser acceptance is in AQUARIUM-ACCEPTANCE.md. Later evidence-only commits do not change the deployed product tree.
