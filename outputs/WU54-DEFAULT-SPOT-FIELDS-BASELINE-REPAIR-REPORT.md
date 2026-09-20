# WU-54 default Spot Fields baseline repair report

## Verdict

PASS-READY — root-cause correction, Local and Windows add-only repair, normal republish, exact-SHA CI/deployment, browser regression, and both recovery proofs passed.

## Correction

Every Map now receives exactly one standard definition for `description`, `address`, `hours`, `holiday`, `website`, and `phone` through a shared write-path helper. Repair adds only missing keys and does not normalize user customization or custom fields. GET remains read-only.

The WU-53 direct baseline builder now uses the same helper as normal Map creation. A guarded repair and a whole-database invariant audit were added.

## Local evidence

- Before: all three Arimatsu Maps had 0 total / 0 standard / 0 custom definitions.
- After: all three have the exact six-key standard set.
- Second repair: zero rows created.
- Settings UI, Spot create/edit, CSV v3, normal republish, public HTTP 200: PASS.
- Users, Workspaces, Maps, 48 Spots, 12 Categories, Media, and access boundaries were preserved.
- Three old immutable releases were retained and three new READY releases became current.

## Recovery

The verified pre-repair three-component backup is retained. A new post-repair authoritative DB + Managed Media + Public Storage baseline was created, checksum-verified, and restored to disposable roots. Default-field, Arimatsu, Tenant, IMAGE, readiness, and public-route checks passed.

The old WU-53 bundle is retained and marked superseded; it is not deleted or rewritten.

## Regression gates

- Prisma validate/generate: PASS
- Full suite: 86 files, 572 tests PASS
- Typecheck and production build: PASS
- Production dependency audit: PASS, no known vulnerabilities
- Local data audits and `git diff --check`: PASS
- Clean clone: frozen install, 572 tests, typecheck, production build PASS
- GitHub Actions Verify `35518510261`: PASS on exact implementation SHA `4d59caae58f011d6940fa61a8be11f1181d238ed`
- P0/P1/core P2: 0/0/0

## Windows QA

- Previous SHA: `30b983b1ae15083a8a857d95f61d1a59082cefe4`
- Deployed SHA: `4d59caae58f011d6940fa61a8be11f1181d238ed`
- Verified pre-repair backup: `C:\DigitalMap\backups\wu54-pre-30b983b-20260920-151142`
- Before repair: `arimatsu-fon` had one custom and no standard definitions; the other two Maps had none. The existing custom definition remained untouched.
- Repair: six standard definitions added per Map; second run added zero; default-field, Arimatsu, Tenant, and IMAGE audits PASS.
- Chrome: all three settings screens, create form, and edit form PASS. Phone is visible as disabled/non-public in settings and absent from normal forms.
- CSV v3 enabled-default columns, three-account Owner/Editor matrix, normal republish, and all public routes: PASS.
- Each current release ID changed and each immutable release history increased from one to two.
- Verified post-fix backup: `C:\DigitalMap\backups\wu54-post-4d59caa-20260920-153420`
- Disposable post-backup restore and four audits/readiness/public checks: PASS; disposable resources removed afterward.

Windows preparation initially left integration-test data in the active QA DB. The topology audit stopped acceptance, and the verified pre-repair DB + Media + Public backup was restored before the accepted repair. The final database contains exactly the intended 3-user/3-Workspace/3-Map baseline.

## Scope

Branch: `fix/wu54-default-spot-fields-baseline-repair-20260920`. No main merge and no Production deployment. Passwords and private credentials are omitted; authenticated Windows QA used encrypted SSH localhost forwarding.

Final verdict: `PASS-READY`. Retain the new Local authoritative baseline and both WU-54 Windows backups. The historical WU-53 baseline remains retained but superseded.
