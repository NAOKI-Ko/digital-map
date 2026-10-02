# 68-09 Map-only collision recovery

Canonical requirements: [WU-68 parent](https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219092606900035) and [68-09](https://app.asana.com/1/1217082051589915/task/1219094898132878), including parent AC21–32 amendment. Authorized revision base: PR27 head66dadf0aa4dc31f478b6e2e116641f460df4fdf3. Historical detail-based recovery evidence is superseded by this amendment.

## Contract and implementation

- Shared Public/LIVE renderer: selected > active Category > featured > normal > screen-space viewport-center distance > stable Spot ID. The rendered target/artwork union and10px gap remain authoritative. Focused PINs are protected in addition to selected PINs.
- Equal-priority previous visible winners receive an8px distance retention band. Initial evaluation selects the closest screen-center PIN; a meaningful distance change can replace it, while5px pan retains the winner. No3D depth ordering.
- Screen-space connected collision groups are transient presentation data, including density-hidden candidates. Component grouping and decluttering are O(n²). Stable marker DOM is retained during collision/selection.
- Representative activation zooms smoothly(+1, bounded by current maxZoom) to the projected group center. Tiny groups predicted inseparable at maximum zoom go directly to maximum zoom, then actual screen-space geometry is re-evaluated before spreading. Exact coordinates spread immediately because zoom cannot separate them.
- Only groups still colliding at maximum zoom, or exactly coincident groups, spiderfy. The spread uses temporary Map DOM PINs and connectors; small groups use a radial arrangement, large groups use a bounded scrollable grid. Canonical coordinates, Floor, Category, importance, snapshot and public assets are never written.
- Spread clones are native buttons. Hidden originals are inert/tabindex-1/aria-hidden. Enter selects a single Spot and opens its ordinary Detail. Escape closes and focuses the Map canvas. Pan/zoom, Category, Floor, background tap, different-group activation and passive resize close the spread. Mouse/touch events inside the spread cannot start Map dragging; a large spread can scroll.
- Starting Map recovery closes an existing Detail so it cannot cover the recovered PINs. It clears transient selection without resetting the camera. No collision recovery/navigation remains in Spot Detail.
- Recovery animation duration is0 for prefers-reduced-motion. Existing marker reduced-motion CSS remains active.
- Initial and Floor camera remain content-aware0°/20° with whole-floor+.65 maximum allowance. Empty/invalid/extreme/broad fallback retains the existing level0° whole-floor policy so fit and displayed pitch agree. Explicit overview is0°/0° whole-floor. Filter/detail/passive resize do not reset user exploration.

## Responsive and interaction results

Chrome live QA:390×844,768×1024,1024×768,1440×900,1440×700.

| Case | Result |
|---|---|
| High-density36 Spot outdoor initial | PASS;4/9/10/18/9 visible; actual target/artwork union has zero overlaps at10px gap. |
| Representative tap | PASS; camera zoom increases1, Detail remains closed.390:4→9. |
| Additional zoom / zoom out | PASS;390:9→36→9; all sizes reveal additional PINs and suppress when zoom returns to lower density. |
| featured / normal | PASS; priority fixture's featured representative survives in all5 sizes. |
| Category / featured | PASS; same fixture's center normal00 becomes priority3 and replaces featured after active Category intent. Camera unchanged. |
| Equal-priority screen center | PASS; initial winner matches measured nearest featured in all5 sizes.390 selects01; Desktop selects02 because projected center geometry differs. |
| Stability | PASS; same-camera repeated renders and5px pan/return retain representative01; deterministic ID tie and8px retention tests pass. |
| Exact coordinate | PASS;3 Map PINs, native keyboard/Enter reaches each Spot, Escape restores Map focus at all5 sizes. |
| Near coordinate | PASS; one activation reaches maxZoom, actual collision remains, then3 Map PINs appear; all5 sizes. |
| Close lifecycle | PASS; Category, keyboard pan, background tap and Floor switch close spread at all5 sizes; zoom close also passes all5. |
| Different group | PASS;390 and1440 replace00/01/02 with03/04/05, exactly one overlay. |
| Focus / hidden targets | PASS; focused11 survives responsive resize; center/zoom unchanged; zero hidden-interactive violations. |
| Existing Detail → Map recovery | PASS;390/Desktop Detail closes, all3 PINs reachable, camera unchanged, Map PIN focus established. |
| Floor policy | PASS; two-Floor recovery fixture newFloor0°/20° all5 sizes. Historical five-Floor coverage remains in previous evidence. |
| Empty / invalid / broad / dateline | PASS;20 cases. Level fallback fit/display agree; dateline20° initial; all overview0°. |
| Public / Authenticated LIVE | PARTIAL; same renderer/composable confirmed, authenticated exact-SHA browser remains gated by Verify. No Preview patch. |

Evidence: `evidence/map-only-responsive.json` (50 scenario records), `map-only-collision-geometry.json`, `map-only-dense-390.jpg`, `map-only-spiderfy-390.jpg`. Unit/integration:699 PASS/1 optional historical comparison SKIP. typecheck/build/Prisma validate PASS. Mandatory prod audit FAIL:node-forge1.4.0 High GHSA-86w9-cpqp-85rv. Official npm1.4.1 HTTP404; latest node-forge1.4.0, listhen1.10.1 depends^1.4.0, Nuxt latest4.5.2. No audit exception/override/gate reduction.

## Windows QA tunnel URL following

The old start-tunnel runner returned early when a PID and public-url.txt existed, and its historical-log regex could select URLs from previous sessions/requests. QA now selects only URL announcements from the current cloudflared process start time. A named mutex serializes the run/start synchronization paths.

New QA-only runtime overlay sets declared and effective Nuxt Public/Admin origins plus the exact current trusted host and proxy/deployment settings. run-app loads it after the existing protected secrets file. Atomic file replacement preserves intact settings; secrets and release/publication data are never edited. A new URL restarts the same app SHA; idempotent synchronization does not restart.

Live rotation verified: wide-maybe-votes-neighbors → reaches-see-permissions-comparable. Both public-url.txt and Nuxt public HTML follow the new URL. Public arimatsu-fon HTTP200; response contains only the current Quick Tunnel origin. A second synchronization retains the app PID. Windows deployed SHA remains4a90be0186666a0e2007029da85e5a0846539e2a. Script backups:C:\DigitalMap\backups\wu68-qa-tunnel-origin-20261002. Production untouched.

Current QA URL:https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon
Existing copied URLs, historical emails and exported PDFs cannot update retroactively. Newly generated sharing links/QR use the current effective origin after page reload. Named Production origins are unchanged.

## Review / Verify completion

Reviewed head9ea58d879677c3d91b52b63671e5edfbdca55ebd (implementation3853307):Codex completed2026-10-02T05:18:42Z, no new findings. https://github.com/NAOKI-Ko/digital-map/pull/27#issuecomment-5946052767. The2 P1 threads on the old66dadf0, covering missing Map-only recovery and center ordering, were fixed and resolved with QA evidence; all10 historical threads resolved, unresolved0. Verify36968125956 FAIL solely at mandatory prod audit; subsequent CI gates skipped. Local699 tests/typecheck/build/Prisma PASS. Local advisory metadata says patched None, CI says>=1.4.1; required1.4.1 remains unavailable from official npm. Merge prohibited.
