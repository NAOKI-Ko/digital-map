# WU-54 default Spot Fields baseline repair report

## Current verdict

IN PROGRESS — Local correction, repair, republish, recovery proof, and regression gates pass. Exact-SHA CI and Windows QA repair remain pending.

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
- P0/P1/core P2: 0/0/0

## Scope

Branch: `fix/wu54-default-spot-fields-baseline-repair-20260920`. No main merge and no Production deployment. Passwords and private credentials are omitted.

Final CI and Windows evidence will replace this interim verdict before completion.
