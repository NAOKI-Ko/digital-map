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

Reviewer was not an implementation author. One P2 found: the single Category trailing control claimed to return to the beginning but paged backward only once, then switched back to forward and bounced between the final positions. Fixed by returning directly to scrollLeft 0; `tests/category-scroll.test.ts` covers six forward positions and return/re-entry. Final SVG/geometry/source review of f27a16a returned no unresolved P0/P1/P2. Verify found one existing source assertion applying legacy label-free presets to the new named facility choices. 9d2a1ec scopes that assertion to kanji/Material sections, with section-content assertions; independent review returned no findings. Browser keyboard/reduced-motion behavior remains for QA. Source review does not establish black-box PASS.

## Exact candidate Verify

- candidate code: `9d2a1ec196a9bec33d78aaaf1e418b786cb7b21c`
- draft PR: https://github.com/NAOKI-Ko/digital-map/pull/33 (target dev)
- Verify: https://github.com/NAOKI-Ko/digital-map/actions/runs/37308503847 — all steps success.
- 123 test files /825 tests passed; one pre-existing WU65 restored-backup comparison test skipped because its two dedicated restored DB URLs are absent. Skipped test is not counted as passed. No WU77 migration was added.
- frozen install, existing dated security gate, Prisma validate/generate/migrate, domain/tenant/image/paper audits, typecheck and build passed on disposable CI PostgreSQL.
- f27a16a's earlier Verify failed at the legacy preset assertion and skipped build; retained as failure history, superseded by the above run.

## Windows isolation

Dedicated candidate root `C:\DigitalMap\incoming\wu77-20261005`. Preflight: no collision/reparse ancestors, approximately69.5GiB free, port3013 unused. Existing Node24.21.0/pnpm11.9.0, frozen lock install completed in73.6seconds. Existing 3011 service SHA9403d32/PID19992 preserved.

Baseline fixture process bound only127.0.0.1:3013 through an owned SSH forward. Synthetic disconnected DB URL prevented canonical DB access. Browser initial empty response came from OpenSSH child lifetime plus PowerShell treating pnpm stderr as an exception; corrected with a foreground SSH process and explicit exit-code checks. The compatible PNG then rendered24/12 fixed placements. Earlier decode error is historical failure evidence, not a postrepair error. Tabs closed/viewport reset after capture. Own process tree only is stopped before candidate source update.

Windows candidate archive SHA256 `e5344ea7c12607e33ce39ee1e8cd110b1284e5b94916694bfdc552788a7abb0e`; all1346 source files matched their manifest before gates. OS ExecutionPolicy rejected running a saved PS1; no policy change/Bypass was used. Existing ordinary shell commands were executed in short sections. Windows non-DB test result:115 files/793 tests passed,9 files/33 tests skipped with DATABASE_URL intentionally absent. The32 ordinary integration tests execute in CI; the remaining one is the restored-backup test above. Windows security/Prisma/typecheck/test/build all exited0. pnpm audit wrote its existing ignore list to the candidate workspace file; that generated work copy was restored from the archive after gates, and all1346 source files again matched. Existing security exceptions remain unchanged and expire2026-11-02UTC; no new exception.

Candidate runtime uses the owned127.0.0.1:3013 synthetic dev server and disconnected DB. `candidate/` contains11 captures with a SHA256 manifest: five resized overview viewports, mobile facility Category/Detail/Floor/OR, cold390 overview and explicit overview-control result. DOM confirmed each viewport and no horizontal page overflow; all14 images loaded,24 markers in unfiltered2F,12 in unfiltered3F,6 with equipment filter,16 with dining+equipment OR. Facility Detail close restored focus to its60×60 marker. No console error/warning was captured. The default-size-to390 resize and an actual390 cold reload produce different preserved cameras; both are labeled, and these author captures cannot establish the complete same-condition benchmark scores. A fresh independent cold/resize sequence remains required. Mac browser tab closed and viewport reset before12:35UTC.

Pending: Windows data audits/authenticated parity/publication using a safe isolated-data candidate, full visual/accessibility/geometry/motion checks, independent black-box competitive QA, Finding repairs, acceptance, dev merge and exact merge SHA reflection. WU-77 is not Complete.
