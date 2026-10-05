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

## Independent QA round1 and repair candidate

Independent round1 on9d2 returned NO-GO with two P2 findings. These remain pending actual retest; source review does not waive them.

- WU77-BB-001: desktop Category palette covers60px targets at1024×768/cold and Overview. Commit14f85abb restores the existing52px bottom dock at desktop, preserving camera/fit inputs and44px Category operations.
- WU77-BB-002: closing a non-representative coincident Detail loses focus to canvas/featured representative. Deselect RAF hid the original PIN before the50ms restoration. Commit0d3b2b0 reveals only the closing PIN, focuses it in the same task, and hands off to existing focused protection. Camera/priority/geometry and pointer-close ordering remain unchanged. DOM regression covers both normal members against their featured representative and return to normal priority after blur.
- Commit94ca6d7 updates the existing accessibility source wiring checks to the new recovery helper. The preceding0d3 CI failure at its stale literal assertion is retained; the15 collision tests had passed in that run.

Repair candidate is `94ca6d75f30a6f5960d1e6df5d0dccab81547c0b`. Independent static reviews found no remaining P0/P1/P2 in the product changes. Verify37329284486/37329267707 succeeded in all steps:123 test files/828 tests passed, one existing restored-backup comparison skipped; frozen install, unchanged dated security gates, Prisma/migrate, four audits, typecheck and build. No schema/migration/auth/permission/publication contract change.

Windows reconstructed a new own root `C:\DigitalMap\incoming\wu77-fix-20261005` from the immutable9d2 archive and485018byte delta SHA256 `3a9d71daea89590e9f6907555461abd3eb966ce534989f387b5592325d945216`. All1364 sources matched before gates and after build. Frozen install reused972 packages/downloaded0. Prisma/typecheck/security/build passed. The first test invocation retained the disconnected installation DB URL and therefore failed at refused port1; root removed that variable and repeated the nonDB test/build stages. Final Windows result:115 test files/796 tests passed,9 files/33 DB-dependent tests skipped. Failure history is preserved, skipped tests remain unexecuted here, and CI separately executed the ordinary integration tests.

New runtime3016 started15:16:03UTC under owned PowerShell13208/listenerNode25328, with an up-to-four-hour foreground lease. At15:18:40 source/F1 hashes passed; at15:19:50 listener ownership,24+12 API counts and served52956byte PNG SHA256 `dd51f2177020810b69e2b5298c3cb4d3278013863fd50fbe6f869af8c058b2c9` passed. Canonical3011/PID19992/source9403d32/raw Public DTO SHA256 `8b4df738764bb4ddd2949c1403fd2f41e65f6c15c8d469714e511282404b2b35` and old9d2 QA root remain unchanged. [Serving attestations](replay/windows-fix-serving-attestation-94ca6d7.json) record the two independent read-only checks. Independent QA received explicit handoff to new Mac loopback58123. Actual BB001/BB002, same-condition scores and the outstanding persisted/AT/performance checks remain pending.
