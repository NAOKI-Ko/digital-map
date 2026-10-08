# BB005: visible map controls receive their own pointer input

A visible map control must receive pointer input at its painted centre even when a nearby destination or facility has an overlapping transparent marker target. This applies to the shared Public/LIVE visitor renderer, including normal browser zoom and native Chrome200%. Marker targets remain60×60 CSS pixels; the existing Whole control remains60×44 CSS pixels at the reported mobile sizes.

## Reported failure and evidence

The independently observed source was `0e494b753cf452595f3112fe5f248104d00223f8`. At native Chrome200%, physical390×844 produced CSS195×422 and physical430×932 produced CSS215×466, with DPR2, scale1 and no page CSS zoom. Each condition reproduced in two fresh sessions using DOM hover calibration and actual mouse down/up, not a scripted button click.

- CSS195×422: Whole rect `(122,182,60,44)`, centre `(152,204)`. The centre fell within Info's transparent60px target `(115.488,176.296,60,60)` and hit Info. Actual pointer input opened案内所 Detail instead of Overview; the camera did not change.
- CSS215×466: Whole rect `(142,226,60,44)`, centre `(172,248)`. The centre fell within WC2's transparent60px target `(140.403,189.143,60,60)` and hit its count4 control. Actual pointer input zoomed14.5194→15.5194 instead of fitting Overview.
- Tab→Whole→Enter invoked the correct recovery in both conditions. This supports an input stacking failure rather than a failed Overview action.

Source inspection shows active-category markers receive inline z-index3, selected markers4, featured2 and normal1. The installed MapLibre6.9.0 stylesheet gives positioned control corners z-index2 and supplies no canvas-container stacking context. Without an independent canvas stacking context, a marker's positive stacking level can compete with the controls outside that container. Transparent target areas still receive input even when the control below them remains visually readable.

The centre-hit/real-pointer records are observed DOM evidence. Marker priorities and the MapLibre stylesheet are source evidence. The complete live computed ancestor stacking chain has not been rechecked. This distinction remains open for independent browser verification; this document does not claim browser PASS or finding closure.

## Narrow implementation scope

Only `.visitor-map-viewer .maplibregl-canvas-container { isolation: isolate; }` is added. The canvas and its marker children form a local stacking context, keeping their existing internal priorities below the native control layer. The rule applies to the shared visitor Public/LIVE renderer; editor behavior is outside its scope.

No position, transform, overflow, width, height, padding, camera calculation, fit reserve,60px marker target, collision priority, pointer forwarding or overlay rule changes. The separate frame-level spiderfy overlay retains its existing behavior and therefore needs explicit open/closed regression coverage. DOM focus and keyboard behavior must remain unchanged.

## Independent browser regression contract

Use the fixed synthetic F1 and fresh documents. Exercise physical390×844 and430×932 at ordinary100% zoom, then native Chrome200% producing the CSS sizes above. Confirm native zoom/DPR/scale and page CSS zoom; use CSS pointer coordinates directly, without multiplying them by DPR. Repeat each native condition twice and record before/after camera, Whole/marker rectangles, DOM centre hits, calibrated hover and actual pointer down/up.

1. At normal100%, select the equipment category with its existing public controls, invoke Whole, activate a facility/count, open Detail and close it with Escape. Pointer on Whole must invoke Overview, without opening a foreign Detail or expanding a foreign group. Repeat with pointer Detail close.
2. Native390 repro: clear categories if needed; Tab設備→Enter; Tab地図全体を表示→Enter; エレベーター2 count12→案内所 count5→北側トイレ Detail→Escape. Re-find Whole's actual rect and point at its centre. The centre must hit Whole, hover must identify Whole, and real pointer input must call the current floor's Overview.
3. Native430 repro: fresh document; equipment→Whole; NorthWC Detail→Escape; clear→設備→Whole; 階段2 count12→エレベーター Detail→Escape. Re-find Whole's centre and repeat DOM hit, hover and real pointer checks. The count4 WC2 action must not receive the Whole input.
4. At both zooms, test every visible navigation/geolocation control against nearby normal, active-category, selected and focused markers. Marker target dimensions and internal visibility/priority order must remain unchanged. Confirm Whole, plus/minus and heading recovery by keyboard as well as pointer.
5. Open an exact-coordinate/max-zoom spiderfy group and test visible controls while it is open; then select a nonrepresentative member, open Detail and close it by Escape and pointer. Check controls after the spread closes, every member remains reachable, and Detail returns focus to the chosen member rather than a different representative. The frame-level overlay has not been restyled by this fix.
6. Repeat representative recovery at normal and reduced motion, mobile/tablet/desktop, and resize. Compare control/marker rectangles, floor corners, initial camera, restored Detail camera and fit padding with the prior source. No camera movement may occur merely from this CSS change; only the existing explicit map actions may move it.

If open spiderfy still obscures a visible control or any centre hit is wrong, record the condition as an unresolved finding rather than inferring success from keyboard recovery. Public fixture checks alone do not establish authenticated LIVE or production data parity; the shared LIVE visitor flow needs its ordinary authorised regression separately.
