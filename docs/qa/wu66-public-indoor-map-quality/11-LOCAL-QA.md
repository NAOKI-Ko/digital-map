# Implementation and local QA — 2026-09-29

Contract committed as 5810a9c before implementation. Base: d4e4df3a1acc4565e6fc1afee1218e4e6bb8ccf0. Existing Windows public release copied read-only to local Public Storage; no fixture reconstruction or publishing.

## Changes

VisitorMapExperience opts into a common viewport-aware contain overview. Initial load, different Floor, and explicit overview reset bearing/pitch to zero and stop old motion. Actual container/chrome rectangles determine padding; no crop-based mobile cover. Subsequent user pan/zoom remains owned by the user. Admin/Paper camera behavior, publication, auth, schema, coordinates, media, category OR semantics remain unchanged.

Floor/Info use Reka focus-trapped dialogs with Escape and visible-trigger focus restoration, including Desktop trigger remount. Category overflow has explicit 44px previous/next buttons, selected state and result count; reduced-motion preference respected. The single-language badge is removed; existing bilingual selector is preserved with separate floor-title space.

## Browser observations

Chrome through CUA, real rendered DOM/screenshot, local replay of the existing snapshot. Width overrides are browser viewport tests, not physical-device tests.

| Viewport | Stage | Initial N2 PIN rectangles inside viewport | Flow |
|---|---|---|---|
| 390×844 | 390×844 | 11/11 | all five Floors, category, PIN, detail, pan, zoom, overview PASS |
| 768×1024 | 768×968 | 11/11 | N2→S3→penguin detail→Escape→PIN focus PASS |
| 1024×768 | 1024×712 | 11/11 | same flow PASS |
| 1440×900 | 1440×844 | 11/11 | same flow PASS |
| 1440×700 | 1440×644 | 11/11 | same flow PASS |

390 all Floors: N2 11/11, N3 4/4, S1 6/6, S2 9/9, S3 7/7 PIN rectangles contained. AS-IS corresponding counts were 3/11, 1/4, 1/6, 2/9, 1/7. Whole square illustration is visible after initial load/switch; dense facility PINs still need filtering/zoom. No horizontal page overflow at the four larger sizes. Desktop uses full available stage; square artwork side margins are aspect-ratio constraints, not a max-width wrapper bug. At 1440×700 the contained illustration is approximately 472px square, with chrome above/below rather than obscuring its legend.

390: zoom and drag on South3, open penguin detail, Escape, unchanged marker transforms on close; next North2 restored 11/11 overview. Toilet category on North2 returned two PINs and “北館 2F · 2件を表示”; toilet camera transform unchanged by filtering. Correct toilet detail rendered. Category selection resets on new Floor. Six category identities exist across fixture, not all on each Floor.

Floor/Info dialogs: labelled dialog, focus enters close control, Shift+Tab wraps within dialog, Escape restores original control. Desktop remounted Floor trigger initially lost focus in QA; fixed and rechecked at all four larger sizes. Spot detail focuses heading and returns to selected marker. Native buttons, pressed states and 44px controls verified. Visible high-contrast text/selected colors inspected; no claim of comprehensive WCAG certification. No app error on final valid route; an early tester typo /m/... generated a 404 warning and was corrected.

## Gate evidence and limits

Full DB suite: 678 PASS / 1 SKIP, 103 files PASS / 1 SKIP. Disposable local database digital_map_test_wu65_wu66; canonical and Windows DB not used for destructive tests. Skip is optional WU65 private before/after audit input. Equivalent deployed-data audit runs separately on Windows. First disposable DB name failed WU65 test safety guard; corrected test DB name, did not weaken guard.

Final typecheck/build/Prisma validate/diff-check logs retained in task work directory; final gate outcomes recorded in FINAL-VERDICT. A build attempted beside dev hit ENOTEMPTY on generated output; dev stopped, output preserved outside repo, clean build retried.

Public and authenticated LIVE Preview both call VisitorMapExperience; shared renderer and existing preview authorization/analytics tests pass. Existing Aquarium login unavailable in this browser; requested user login while continuing. Do not count unauthenticated redirect as LIVE Preview visual acceptance. No new identity, credential reset or auth bypass.

Native multitouch/pinch and real screen-reader/physical device validation are not available through current CUA viewport controls. Pointer drag, zoom buttons, Floor, Category, focus and 44px targets tested; report touch-specific evidence as PARTIAL.

Final gate rerun on implementation: typecheck PASS, build PASS after stopping dev, Prisma validate PASS, diff-check PASS, full tests 678 PASS / 1 SKIP. Selected-category white/#c7401f contrast 5.02:1; selected-Floor #8c311f/#fdf5f3 7.59:1; All white/#1c1917 17.49:1 (sRGB calculation from configured colors). This checks these controls, not all image/PIN contrast combinations.
