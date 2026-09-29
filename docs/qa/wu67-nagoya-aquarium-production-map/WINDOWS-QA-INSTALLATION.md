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

Live QA installation and final browser verification are pending. CI/PR/merge evidence will be recorded before application.
