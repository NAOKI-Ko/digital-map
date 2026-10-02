# WU-68 + 68-09 Final Verdict — PARTIAL / NOT ACCEPTED

PR27 updated for Map-only recovery. Mandatory audit/Verify remains FAIL; merge, post-merge Verify, Windows exact-SHA activation and Authenticated LIVE Final Acceptance are prohibited/pending. Production untouched. Historical Detail recovery is superseded and removed.

- Authorized PR revision base:66dadf0aa4dc31f478b6e2e116641f460df4fdf3
- WU base/dev:34c8b901a8dfd11a871e7f83e1c65bdae9ecbbb8
- Implementation:38533079622c2d3c10eabebee20ea8f9d944b1fd
- Merged SHA:none
- Windows app:4a90be0186666a0e2007029da85e5a0846539e2a (same SHA; only QA tunnel origin lifecycle repaired)
- Production/main:a58b4353bd108e6586f329080c772f69b8aaffda
- PR:https://github.com/NAOKI-Ko/digital-map/pull/27
- Codex review:9ea58d879677c3d91b52b63671e5edfbdca55ebd completed2026-10-02T05:18:42Z with no new findings. https://github.com/NAOKI-Ko/digital-map/pull/27#issuecomment-5946052767. Prior8 P2s and2 amendment P1s are resolved; unresolved threads0. Later evidence-only commits do not change implementation3853307.

## All32 Acceptance Criteria

PASS below denotes tested local implementation. Exact-SHA Windows acceptance remains pending behind Verify.

| AC | Status | Criterion / evidence |
|---|---|---|
| 1 | PASS | 390px high density:4 visible, zero actual target/artwork overlaps including10px gap. |
| 2 | PASS | selected protected; normal selected via spiderfy remains visible in ordinary Detail. |
| 3 | PASS | active Category priority3 replaces featured with center normal00 in5-size priority fixture. |
| 4 | PASS | featured priority2 survives normal; unit and5-size browser evidence. |
| 5 | PASS | distance→ID deterministic order;8px retention, same-camera stability and5px pan/return. |
| 6 | PASS |390 zoom4→9→36; natural screen-space separation. |
| 7 | PASS |390 zoom36→9, lower-zoom suppression preserved. |
| 8 | PASS | no Spot/snapshot writes; immutable inputs, development-only cloned fixtures. |
| 9 | PASS | hidden originals inert/tabindex-1/aria-hidden; focus protected; zero hidden-interactive violations. |
| 10 | PASS | valid initial0°/20°; original safe empty/invalid/broad fallback0° fit/display aligned. |
| 11 | PASS |390 content-aware initial whole-floor+.65; larger viewports respect actual content fit. |
| 12 | PASS |+.65 upper allowance, relative maxZoom retained; no forced past-fit zoom. |
| 13 | PASS | two-Floor recovery fixture applies0°/20° on switch in5 sizes; prior broad fallback evidence retained. |
| 14 | PASS | filter preserves center/zoom; responsive focus resize preserves exact center/zoom; recovery from existing Detail also preserves camera for exact coordinates. Explicit group zoom remains user initiated. |
| 15 | PASS |5-size explicit overview0°/0° whole-floor; fallback/date-line recovery20 cases. |
| 16 | PASS |390×844 /768×1024 /1024×768 /1440×900 /1440×700 major flows. |
| 17 | PASS | high-density outdoor and multi-Floor recovery fixture; historical Aquarium5-Floor evidence retained. |
| 18 | PARTIAL | same Public/Authenticated LIVE renderer confirmed in source; authenticated exact-SHA browser gated. |
| 19 | FAIL |699 tests PASS/1 optional SKIP, typecheck/build/Prisma PASS; prod audit/Verify FAIL on node-forge High. |
| 20 | PASS | Production/main unchanged; no merge to dev, no app SHA activation on Windows. |
| 21 | PASS | Detail collision UI/helper/emitted recovery ID navigation removed. |
| 22 | PASS | featured wins normal collision in5-size browser priority fixture. |
| 23 | PASS | active Category wins featured; same fixture normal00 becomes priority3 representative. |
| 24 | PASS | initial same-priority winner matches measured nearest viewport center in all5 sizes; no3D depth. |
| 25 | PASS | stable same-camera representative, stable ID ties and8px previous-winner retention. |
| 26 | PASS | group separates with zoom;390 four→nine→all36. |
| 27 | PASS | representative activation centers group and smooth zooms+1 before Detail selection. |
| 28 | PASS | exact3 and near3 at actual maxZoom all reachable via Map spiderfy in5 sizes. |
| 29 | PASS | spread consists solely of temporary DOM PINs/connectors; canonical fields and snapshots unchanged. |
| 30 | PASS |5-size open/close/Enter/Escape/zoom/pan/Category/Floor/background; different groups390/Desktop; focus resize; reduced-motion duration0 unit check. |
| 31 | PARTIAL | shared UX/code confirmed; Authenticated LIVE exact-SHA visual QA remains gated by Verify. |
| 32 | PASS | valid initial/Floor0°/20°, explicit overview0°/0°, content-aware cap and no passive reset retained. |

Totals:29 PASS /2 PARTIAL(18,31) /1 FAIL(19). Final Acceptance is not complete.

## 390px before/after

Before:`evidence/390-before.jpg`:36 overlapping PINs; bearing0°, pitch0°, zoom14.609707646398311, center lng136.97123594617784/lat35.068358034016384.

After:`evidence/map-only-dense-390.jpg`:displayed set{wu68-00,wu68-03,wu68-18,wu68-21}. Actual target/artwork union+10px gap has no overlap. Initial bearing0°, pitch20°, zoom15.259707646398311, center lng136.97076018598818/lat35.06792808243404. Whole-floor+.65 cap. Representative tap→zoom16.25970764639831 with9 PINs and no Detail; another zoom→36. Zoom out→9. Overview returns0°/0°, zoom14.609707646398313 and contains whole Floor.

Collision order:selected > active Category > featured > normal > screen-space center distance > ID. Focus is additionally protected. Equal-priority previous winners have8px retention, permitting deliberate pan to change representatives while avoiding micro-pan flicker. Group processing and decluttering O(n²), rAF coalesced writes→geometry reads→visibility writes. No marker destruction for ordinary collision/selection.

Exact coordinates spread immediately. Near coordinates predicted inseparable go to maxZoom, then actual rectangles are rechecked before spreading. Otherwise group tap zooms one step at its center. Transient Map PINs are keyboard reachable; Escape focuses Map; pan/zoom/Category/Floor/background/different group close. Spot Detail contains exactly one Spot's information. Starting recovery dismisses an existing Detail without camera reset, ensuring it cannot cover recovered PINs.

Responsive initial/tap-zoom/additional-zoom PIN counts:390 4/9/36;768 9/36/36;1024 10/36/36;1440×900 18/36/36;1440×700 9/34/36. Zero initial actual overlaps and hidden-interactive violations.50 browser scenario records plus5 actual-geometry cases. See08-MAP-ONLY-RECOVERY-QA.md and evidence/map-only-responsive.json.

## Audit, Windows URL and remaining debt

Official npm node-forge latest1.4.0;1.4.1 HTTP404. listhen latest1.10.1 still^1.4.0; Nuxt latest4.5.2. Required pnpm audit --prod --audit-level high fails with one High GHSA-86w9-cpqp-85rv (patched:None). No audit exception, failing override, dependency reclassification or Verify reduction. Merge is forbidden until a resolvable patched dependency/upstream release and all Verify gates PASS.

QA-only URL following is implemented and live verified. Current-process announcement selection excludes historic logs; serialized, atomic QA origin updates feed run-app after protected secrets. Real tunnel rotation changed wide-maybe-votes-neighbors to reaches-see-permissions-comparable; public-url.txt, effective Nuxt origin and public response all follow. Idempotent repeat preserves PID26100. App SHA remains4a90be0; DB/media/publication and Production were not modified. Scripts backed up atC:\DigitalMap\backups\wu68-qa-tunnel-origin-20261002.

Current QA public MAP:https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon
This Windows baseline does not yet contain the new Map-only PR code. Previously copied URLs/emails/PDFs cannot change retroactively; newly generated links/QR use the new origin after reload.

Remaining debt:mobile broad all-normal Floor fallback can initially suppress normal PINs under the existing density rule; zoom/Category discovery remains available. Authenticated LIVE and Windows exact-SHA visual acceptance are pending. Historical external link/exported-QR tunnel URLs require regeneration. No Search/full cluster engine/new importance/Placement schema/Production deployment added.

Codex clean review completed. Verify run36968125956 on9ea58d8 FAIL at mandatory prod audit; later CI gates were skipped, not passed. Local tests/typecheck/build/Prisma PASS. Local audit reports patched None; CI advisory metadata lists>=1.4.1, but official registry1.4.1 is404.

Next authorized order:resolvable patched node-forge/upstream → audit/Verify PASS → merge dev → post-merge Verify → Windows exact SHA deploy → Authenticated LIVE → Final Acceptance. Current unavailable patched release blocks this chain.
