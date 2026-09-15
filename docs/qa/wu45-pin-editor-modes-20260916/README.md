# WU-45 PIN editor QA evidence

- Date: 2026-09-16 (Asia/Tokyo)
- Base SHA: `99f7c423e5dd69fd39c93b85cf418650ec1e16d2`
- Implementation SHA after responsive fix: `136bc870eed93d347ad64fc87bf1f51799f54b5b`
- Branch: `feat/wu45-pin-editor-modes-20260916`
- Local isolated worktree: `/Users/naoki/Documents/Codex/2026-09-16/files-pasted-by-the-user-wu/work/digital-map`
- Windows QA URL: `https://sur-context-basin-concert.trycloudflare.com/`

## Automated verification

Local, after the responsive fix:

- Vitest: 71 files / 487 tests passed.
- Nuxt typecheck: passed.
- Prisma validate: passed; no WU-45 schema or migration change.
- Production build: passed on the preceding implementation commit; the final exact release is gated again on Windows.
- `git diff --check`: passed.

The first Windows candidate (`af71ffe8f6faa7224ca0b51c214c0c8a3dd1c65e`) passed frozen install, Prisma generate/validate, the image-spatial audit, migration status/deploy (28 migrations, no pending migration), 71 files / 487 tests, typecheck, and production build. Browser QA then found that a long floor list could compress the positioned-spot search control. The candidate was not treated as final; the responsive fix is `136bc870eed93d347ad64fc87bf1f51799f54b5b` and is subject to a fresh exact-SHA Windows gate.

## Local browser fixture and results

Disposable exact IDs:

- Existing positioned PIN: `wu45-pin-existing`
- Initially unpositioned spot: `wu45-pin-new`

The helper is `scripts/qa/wu45-pin-editor-fixture.ts`; it supports setup, inspection, and exact-ID cleanup. The fixtures were created only in the isolated local database.

Observed results:

- Desktop at 1440x900: map and editor measured approximately 630px / 630px (gutter excluded). After the responsive fix the positioned search measured 206px instead of collapsing.
- 900x800 and 390x844: panes stacked vertically and document `scrollWidth` equaled viewport width. Search widths were 280px and 358px respectively after the fix.
- Labels were exactly プリセット / カスタム / イラスト; format descriptions and permanent preset labels were absent. Preset buttons retained accessible names and selection state.
- Position and design modes replaced the right-panel body exclusively. The design draft changed only the selected map PIN immediately; other PINs and the database stayed unchanged before save.
- Design save returned to unselected state and survived reload; coordinates stayed unchanged.
- Position save returned to unselected state and survived reload; design stayed unchanged. Camera was retained and ring/dimming/ghost cleared.
- A new unpositioned spot did not appear automatically. Its placed candidate used the real PIN design; cancel did not persist it. A later placement save survived reload.
- With the local server deliberately stopped, save failure retained the selected spot and draft and showed an error. The database stayed unchanged. Restarting the server allowed cancel/discard recovery.
- Dirty guards were exercised for floor, route, mode/cancel, and Escape. A regression where explicit dialog close also emitted a second cancel was fixed and covered by `tests/native-dialog.test.ts`.
- Map controls were exercised through four zoom-in steps and four zoom-out steps; viewport resizing retained the PIN layer. Position candidate/ghost and saved state were visually checked at a stable camera.

Screenshots were visually inspected through the browser automation surface but were not exported as files. This document does not claim stored screenshots.

## Windows QA and safety boundary

Pre-WU-45 rollback backup was verified at:

`C:\DigitalMap\backups\pre-wu45-pin-editor-af71ffe-20260916-044304`

It contains a PostgreSQL dump, media archive, runtime configuration, scripts archive, release-state metadata, and SHA-256 manifest. The previous release and tunnel URL were preserved. An earlier partial backup attempt (`...-044241`) and an aborted wrong-SHA, non-active release directory were retained rather than deleted.

Windows browser checks are read-only unless an exact spot is already declared disposable or separately approved. No exact Windows WU-45 disposable ID was available, so Windows save/unplace writes are intentionally not performed. Local isolated-fixture checks cover the write paths; this limitation keeps the final result `BLOCKED` under the task's stated verdict rule until a Windows disposable exact ID is approved and exercised.

## Scope

No GitHub push, main merge, production deployment, database reset/reseed, old backup deletion, Jira update, or automatic Human UAT approval was performed.
