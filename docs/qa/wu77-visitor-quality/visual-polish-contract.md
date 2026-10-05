# WU-77-06 visitor visual polish contract

Prepared 2026-10-05 after the owner's additional request to polish Digital Map and exceed the JERA benchmark. This is a separate implementation batch. It does not change the benchmark lock or establish Quality Acceptance.

## Observed gaps and intended improvements

Read-only visual and source audits compared the existing author captures with the locked official map. The author captures precede the later desktop Category and Detail-focus repairs, so those old defects are excluded from this design assessment.

- Floor currently presents available equipment as a small prose list. Show each explicitly authored facility kind once with its existing local pictogram and short label. Preserve first appearance order and count every placement separately.
- A facility's Detail currently switches from its map pictogram to text alone. Repeat the same controlled local glyph, including the separate AED text, beside the Detail title. Treat this glyph as decorative beside the existing spoken title.
- Use the existing selected-marker green for selected visitor UI and the existing amber for keyboard focus. Share the same surface, boundary, muted text and elevation across Category, Floor, Detail, Info and map controls. Keep the marker author's colors independent.
- Reduce only the Category chip's horizontal padding and gap slightly. Keep the check, label, count, OR semantics, order, scroll recovery, 44px control height and desktop 52px band.

The quiet background and compact tipless facility badges are retained. The fixture's simple artwork and whitespace do not justify changing camera or adding background decoration. Official Detail behavior remains unverified; repeating the glyph is an internal continuity hypothesis rather than a demonstrated competitive result.

## Preserved contracts

No schema, migration, ownership, role, permission or publication changes. No automatic facility inference from legacy material/kanji names, category, custom image or illustration. Spot/Placement and Public/LIVE use the same existing data and shared visitor components.

Do not change authored marker colors, marker dimensions, border widths, scale, transform, anchor or painted collision geometry; keep 60x60 interaction targets. Keep selected > active Category > featured > normal, count, staged zoom, maxZoom spiderfy, offscreen representative, selected/focused protection, initial camera, overview, pop-in and reduced motion. Keep existing Detail gestures and native focus restoration.

CSS tokens must be on the actual teleported dialog roots. Category focus is painted inside its scroll viewport, with white separation around amber so the amber is not directly against selected green. The computed solid-color contrast is 10.14:1 green/white, 6.35:1 muted/white and 5.02:1 amber/white; amber/green is only 2.02:1. Browser-rendered contrast and clipping require verification.

## Verification and acceptance

Run existing meaningful regression tests, typecheck, build, Prisma checks, audit and unchanged security gates, plus a small facility-summary test for explicit semantics, duplicate kinds, repeated placement counts and snapshot preservation. Independently review the source changes before proposing a new Windows candidate.

Repeat the unchanged 5-viewports / 9-tasks / 14-axis rubric with the same fixture and same-condition images, including long labels, all eight facility kinds, five floors and 200% text/zoom. Recheck Category selected focus, 52px band, dialogs, close controls, BB001/002 and reduced motion. Mark simulated viewport, physical device, AT, performance, strict cold first-five-seconds and authenticated publication evidence separately. Do not declare "JERA exceeded" from palette changes, author captures or an average score.

The currently served repair candidate remains fixed while its independent QA proceeds. This batch needs its own exact source SHA, CI result, Windows attestation and independent visual/interaction QA before integration. Required untested gates and visible competitive disadvantages keep WU-77 incomplete.
