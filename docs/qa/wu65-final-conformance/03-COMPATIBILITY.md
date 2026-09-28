# Compatibility

Initial classification **PASS based on source and previously executed comparison**, subject to fresh final Windows read-only check after corrections.

Migration adds fields with individual/null defaults; it does not UPDATE existing tuples/coordinates/targets or release pointers. Resolver individual branch normalizes through existing helpers; marker/CSS unchanged. New records explicitly choose standard. Category defaults never auto-adopt existing Spots.

Approved private backup comparison: Aquarium 37, Arimatsu 52, other 1 = 90. `tests/wu65-migration-equivalence.integration.test.ts` compares actual marker DOM in visitor/editor modes, not merely serialized mode. Stored tuple digest `c8a2089ff6ce2ca7b4c6da5f59a4003214273861cb42a1aac3461387cc5d3935`. This is structural equivalence, not pixel screenshot comparison.

Windows before/after migration, activation and replay compared all 90 tuples, 20 Category icons, nine publication references and public-file hash: `4b0dc77748567f08ff7079f7388832e911321ef2bd2eb92bced4036849316c44`. Existing rows are individual, source null. Private backup remains outside Git. Existing records are references only; mutation acceptance uses a separate disposable database/storage.

Old-reader rollback after adoption is unsafe until resolving/freezing current styles. That behavior follows directly from old reader ignoring source metadata. The required disposable rehearsal remains PARTIAL until executed (G5); prose alone is insufficient.

## Final executed compatibility gate

**PASS at `0d0d1d5d75b6009c34e4bc37f9a6c5231e5cb245`.** No new schema/migration in corrections. Windows migration status reports current; initial additive migration remains unchanged. Local full suite executed the private before/after comparison again: Aquarium37 + Arimatsu52 + other1, marker DOM in view/edit, tuples/coordinates/publication targets; all legacy source modes individual/null.

Windows backup `C:\DigitalMap\backups\wu65-final-conformance`: DB `digital-map-20260928T221727Z.dump`, media `20260928T221728Z`, public `20260928T221730Z`; backup verification PASS. Before activation, after activation, and after final isolated replay, digest remained `4b0dc77748567f08ff7079f7388832e911321ef2bd2eb92bced4036849316c44` for 90 Spots/20 Category icons/9 Map publication references/public-file hashes. This does not claim screenshot pixel diff or membership hashing. Canonical database/storage were not used for mutation acceptance.

Rollback rehearsal now PASS via `tests/pin-rollback.integration.test.ts` on disposable local/CI/Windows test DBs. It freezes an inherited whole tuple into individual columns, verifies old-reader equality and unchanged coordinates/target/membership, and rolls back the fixture transaction. It is not an actual downgrade of Windows QA. Existing releases are never rewritten.

Fresh replay DB `digital_map_test_wu65_final`; storage only under backup `isolated-replay/uploads` and `isolated-replay/public`; listener only localhost3066. Canonical QA remains3011. Production untouched.
