# Initial gaps and correction boundary

Matrix completed before application edits. All gaps derive from approved documents, not new product decisions.

| Gap | Classification | Smallest correction / verification |
| --- | --- | --- |
| G1 bulk counts | PARTIAL | Exclude invalid rows from changed/no-op counts; retain exact valid/conflict/zero-skip totals. Add planner regression. |
| G2 factual list | MISSING details within PARTIAL D9/B | Add Map-wide unplaced / positioned-target-off counts, compact effective PIN thumbnail, optional no-category filter. Preserve filters and no readiness score. |
| G3 contextual photos | PARTIAL | Separate selected uploaded asset from explicit association; preserve selected asset on failed association; allow authoritative reload; propagate upload busy through manager to dialog; no close while in-flight; keep six/order behavior. |
| G4 visual consequence/busy | PARTIAL | Name individual-save transition, label absent-default fallback, lock Category design inputs while saving. No resolver/model changes. |
| G5 missing acceptance evidence | PARTIAL | Focused tests/browser of failure/concurrency/keyboard/width behavior; disposable old-reader freeze/rollback rehearsal; fresh Windows workflow and read-only legacy digest. Native Excel coverage must be honestly classified if unavailable. |
| G6 queue recovery/focus | PARTIAL | Detect stale/deleted/current-Floor conflicts; hold candidate, expose deliberate refresh/review before next item, refresh Floors too, announce/focus next item, ignore Escape during IME or handled events. No guessed coordinates, auto-save or auto-Floor. |

No migration expected. All application changes require correction branch from latest dev, targeted/full tests, Prisma validate, typecheck/build/browser, compatibility checks, PR Verify/merge/post-merge Verify, then exact corrected dev Windows deployment. Initial finding statuses are in 00. No AQUA-006/007, Paper renderer, Content/Placement or Production work.

Additional source detail before G3 correction: `toAdminSpotDetail` reads only photosJson, while public rendering/list count prefer managed ordered photos. After a managed-only revision, the panel can show a different set/count. G3 also aligns the admin effective-photo read model with the existing visitor/list contract, preserving legacy fallback; it does not modify stored photos or public rendering.

## Correction implementation / local gate

The complete initial matrix was committed as `36d7902` before any application correction. G1–G4/G6 corrections are confined to the existing controls/read models. No schema/migration, renderer redesign, or frozen product decision changed.

- Valid changed/no-op counts exclude invalid rows; atomic rejection remains. Regression covers a 3-row mixed batch and zero writes.
- Map-wide factual counts are independent of row filters; no-Category filter and effective thumbnail are present.
- Photos require explicit association after selection/upload, retain pending selection on failure, reload authoritative photos/version, and propagate upload/association busy to the panel. Admin effective managed photos now agree with visitor/list reads, with legacy fallback.
- Individual Save names its consequence; Category inputs lock during save; unset default fallback is labeled.
- Queue rejects repeat Save after stale/deleted/refresh conflict, retains candidate until deliberate discard, refreshes Spot and Floor facts, then reconstructs queue. New target receives focus; composing/handled Escape is ignored.

Local browser on isolated `digital_map_test_wu65`: selecting a library photo caused zero associations; a real concurrent source update caused photo PATCH conflict; panel retained selection and disabled blind retry; authoritative reload and explicit retry saved exactly one association; Escape returned to List. Queue browser: focused target, composing Escape did not discard, real stale-version Save stayed on the same Spot with candidate retained and explicit recovery; discard confirmation precedes refresh. Two extra synthetic Spots support failure testing; no canonical Aquarium/Arimatsu mutation.

Targeted tests: bulk/list/queue 18 PASS, effective-photo read 2 PASS, transactional rollback rehearsal 1 PASS. Full disposable-DB suite including restored before/after visual comparison: 670 PASS before adding rollback test; final count recorded below after rerun. Build, Prisma validate and typecheck PASS. Windows acceptance and CI remain pending; initial verdict is not yet promoted.

Limitations: browser-dispatched composition event checks shortcut handling, not native Windows IME candidate-window behavior. Native Excel first-use editing remains an explicit manual coverage gap. These must not be described as executed.
