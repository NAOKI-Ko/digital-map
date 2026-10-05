# WU-77 implementation record

2026-10-05。正本はAsana WU-77とBenchmark Lock v1.0。採点/PASS/Acceptance/merge/Closeはまだ未確定。

## Provenance

- baseline dev/Windows: `9403d32fff4f5d0a84f3ba2c1212391ddf6c1f9d`
- benchmark/design lock: `52d8f8f0d270f42f0479a50c4d926a3b51820ebd`
- fixed synthetic harness: `f8615dea4a035df5f9fae7a17cbddbdcec9dd9cf`
- baseline harness render repair: `d35f39eaa17f8412684bf5c00e8444c0d1fdd2cb`
- fixed fixture JSON SHA256 remains `36e5ea87d9a3297a99821c6e4ad6d2860f9763b611070a0ff3f299090ccf3ffd`.
- same floor SVG rasterized by Sharp to PNG because MapLibre could not decode the SVG image source. 1200×800, SHA256 `dd51f2177020810b69e2b5298c3cb4d3278013863fd50fbe6f869af8c058b2c9`. No placement/content/artwork change. Only the fixture route substitutes the compatible image URL.
- `baseline/fixed-fixture` contains 5 overview sizes plus 390px facility-category/Detail/floor images from the old viewer. Source = f8615de archive plus d35f39e's two-file harness repair. No product feature code was applied to that baseline process.
- Benchmark Lock's original reference to `official-390x844-detail.jpg` is corrected to `baseline/official-390x844-selection-map.jpg`. It documents a selected map, not a verified official Detail sheet. This correction does not alter the evaluation task or reference product.

## Implementation

Explicit facility preset IDs add eight compact badges inside the existing appearance contract. They use fixed local Material Symbols SVGs; `public/icons/facilities/NOTICE.txt` pins the official source revision and license. Existing Material/kanji IDs retain destination grammar. No DB column/migration/API field/permission/publication change. Category defaults and individual appearance continue through the existing concrete public DTO.

Public and Authenticated LIVE share the same marker and VisitorMapExperience. Category OR selection/count/scroll/focus, floor context and equipment summary, small legend only on authored facility floors, tablet Detail width/context, overflow, motion preferences, and neutral background are integrated. Camera/selection/focus/collision priority contracts remain the regression targets.

## Independent source review

Reviewer was not an implementation author. One P2 found: the single Category trailing control claimed to return to the beginning but paged backward only once, then switched back to forward and bounced between the final positions. Fixed by returning directly to scrollLeft 0; `tests/category-scroll.test.ts` covers six forward positions and return/re-entry. Browser keyboard/reduced-motion behavior remains for QA. Review of the final SVG revision remains pending. Source review does not establish black-box PASS.

## Windows isolation

Dedicated candidate root `C:\DigitalMap\incoming\wu77-20261005`. Preflight: no collision/reparse ancestors, approximately69.5GiB free, port3013 unused. Existing Node24.21.0/pnpm11.9.0, frozen lock install completed in73.6seconds. Existing 3011 service SHA9403d32/PID19992 preserved.

Baseline fixture process bound only127.0.0.1:3013 through an owned SSH forward. Synthetic disconnected DB URL prevented canonical DB access. Browser initial empty response came from OpenSSH child lifetime plus PowerShell treating pnpm stderr as an exception; corrected with a foreground SSH process and explicit exit-code checks. The compatible PNG then rendered24/12 fixed placements. Earlier decode error is historical failure evidence, not a postrepair error. Tabs closed/viewport reset after capture. Own process tree only is stopped before candidate source update.

Pending: candidate Windows tests/typecheck/build/Prisma/security/audits, exact-SHA Verify, final code review, full visual/accessibility/geometry/parity/motion checks, independent black-box competitive QA, Finding repairs, acceptance, dev merge and exact merge SHA reflection. WU-77 is not Complete.
