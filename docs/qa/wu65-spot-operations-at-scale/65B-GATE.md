# 65B gate — PASS

Base: `2b5178859e236e07965d6106dbfae22fa2984037`. Prerequisite 65A: `5fc8456`.

The user explicitly approved copying the 141,456-byte Windows QA pre-WU65 database dump to `/tmp/wu65-private/pre-wu65.dump` for local isolated migration tests. Transfer and restore succeeded. The private dump, row exports and credentials are not repository artifacts. Windows QA originals and Production were untouched.

## Migration / visual equivalence

Restored baseline: `digital_map_test_wu65_before`; cloned comparison: `digital_map_test_wu65_after`. Applied only the additive `20260929010000_category_pin_defaults` migration to the latter. All 90 original records retained exact explicit tuples, asset references, coordinates, importance and eligibility. All source modes are `individual`, all source Category IDs null.

- Aquarium: all 37 Spots.
- Arimatsu: all 52 Spots, including preset, custom and illustration styles.
- Other existing QA Map: 1 Spot.
- Compared-row SHA-256: `c8a2089ff6ce2ca7b4c6da5f59a4003214273861cb42a1aac3461387cc5d3935`.
- `tests/wu65-migration-equivalence.integration.test.ts` run against both guarded local DBs: PASS. Every existing Spot generates identical marker DOM in both visitor and editor modes before/after resolution. The marker renderer and CSS are unchanged. This is structural visual equivalence, not a screenshot pixel-diff claim.

## Functional and browser verification

Isolated synthetic facility: 5 Floors, 37 imported Spots, 6 Categories. No real Aquarium/Arimatsu rows were adopted into inheritance.

- Category default editor saved blue through the browser.
- A Spot with two memberships explicitly selected 展示; resolved blue.
- A stale source command returned 409.
- Removing the source membership was rejected (409), leaving it intact.
- Published a concrete blue release, then changed the Category default to green.
- Authenticated LIVE Preview returned green; public API response stayed byte-for-byte equivalent to the blue response. Latest test release: `cmulpauk20001d8u1ruba9wcp` (local synthetic data only).
- UI freeze-to-individual preserved green and retained an explicit reset Category.
- Mobile 390px source panel reviewed: [evidence](evidence/65b-source.png).
- Full suite: 642 passed, 17 conditional skips; actual-backup comparison separately passed. Typecheck passed.

A test fixture initially used a `/__qa__/` background URL, correctly rejected by release asset validation. The guarded fixture now copies that image to its isolated uploads directory and uses a valid `/uploads/` URL; the publication test then passed.

## Rollback

The migration changes no existing visual data or release objects. Before any new source adoption, old readers see the same explicit tuple. After adoption, do not roll back to an old reader without materializing effective appearance into explicit tuples first; otherwise LIVE may show the retained older individual tuple. Published releases remain concrete. Keep additive columns on application rollback; do not drop fields or restore a whole DB over newer operator work. A later Placement split can move source metadata and the explicit tuple together.

65B's blocking legacy-equivalence gate is satisfied; 65C may proceed. Whole-WU readiness, CI, merge and Windows deployment are not claimed here.
