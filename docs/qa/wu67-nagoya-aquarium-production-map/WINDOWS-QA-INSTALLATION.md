# Windows QA art installation

App runtime remains 4a90be0186666a0e2007029da85e5a0846539e2a (WU-66). WU-67 changes art/data, not application behavior or schema. There is no need to redeploy unchanged application code.

## Verified backup and rehearsal

Host CHIFFONCHAN; existing QA DB digital_map. Verified DB, managed-media and public-storage backup: C:/DigitalMap/backups/wu67-art-20260929. No Production connection or mutation.

A fresh disposable database digital_map_test_wu67_art was restored from that backup. Media and public storage were restored into isolated rehearsal directories, with the standard backup integrity checks. Existing QA paths/pointer were not used for writes.

Installer source 3ba5a58dbd71216d2d765db50ad973785fc6a887:
- Explicit Production rejection tested.
- Exact Map ID, slug, old release, 5 floor IDs, 37 Spot IDs/names/category associations, 6 categories, asset digests/dimensions and absent georeferences validated.
- No pending editorial revisions allowed; concurrent row changes cause rejection.
- Intentional failure after committed draft installation restored floor art/placements/appearance and the two archived QA decoration rows. Immutable content and old public pointer were rechecked. Result ROLLBACK_VERIFIED.
- Full installation then generated managed-media variants, built a new immutable release through existing application functions, checked photos/content/categories, and activated only the rehearsal pointer. Result APPLIED_PASS; see REHEARSAL-REPORT.json.

Existing Spot IDs, photos, descriptions, category memberships and field content are checked before/after. LiveVersion increments intentionally invalidate stale editing forms. Two old QA branding decoration records are archived in baseline and old immutable release; no old source image or public release is deleted. Unused new media can remain if an attempt rolls back, for the normal media lifecycle.

The new audit event identifies automated maintenance. The release schema requires a creator; it uses the existing responsible QA publisher, not a new account. No credentials, accounts, roles or permissions were changed.

Live QA dry-run and apply both PASS. New release: `cmum8fu9i0013iwva9733nbgi`; see WINDOWS-QA-REPORT.json. Live rollback baseline is at C:/DigitalMap/backups/wu67-art-20260929/installation. The old public release is retained.

PR #25: https://github.com/NAOKI-Ko/digital-map/pull/25
Normal merge into dev: cc0d3fc8b67e49ea89a04e98c194511f86bf6ba0.
Post-merge Verify PASS before live QA application: https://github.com/NAOKI-Ko/digital-map/actions/runs/36525826127.
Application runtime remains 4a90be0186666a0e2007029da85e5a0846539e2a. No app rebuild/restart or schema migration was needed. Assets and scoped map data are supplied by the rehearsed artifact 3ba5a58dbd71216d2d765db50ad973785fc6a887, contained in the merged history.
Production main was rechecked unchanged at a58b4353bd108e6586f329080c772f69b8aaffda.


## Final Windows QA verification — 2026-09-29

Actual Windows QA public release `cmum8fu9i0013iwva9733nbgi` was reviewed through the public VisitorMapExperience at 390×844 and 1440×1000. All five floor selector choices, one representative detail per floor, North2 equipment filtering (exactly locker + accessible WC), and existing Dolphin/Beluga/Orca photo attribution were exercised. Native marker counts 11/4/6/9/7; pairwise 60px target overlap counts all zero in initial full-floor mobile views. Loaded final artwork and pictograms were visually inspected. No browser console errors were reported. Cold image loading was allowed to complete before judging visuals. Detail opening pans the map; the existing full-map control restores overview.

This validates the actual public shared visitor renderer; no authenticated Admin Preview session or physical mobile-device test is claimed. Browser screenshots were viewed inline in the task history; no persisted screenshot artifact is claimed.
