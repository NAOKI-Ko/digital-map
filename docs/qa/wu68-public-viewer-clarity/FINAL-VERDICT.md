# Final verdict — PARTIAL / NOT ACCEPTED

WU-68 implementation and local acceptance are complete. Merge, post-merge Verify, Windows after QA and final closure are blocked by the required security gate. Do not mark the parent WU complete.

Base dev SHA: 34c8b901a8dfd11a871e7f83e1c65bdae9ecbbb8. Implementation SHA: 3c2ffb8abb1d5873cfdce91618fbc70f07037d12. Final branch SHA: see PR #27 head; no merged final SHA yet. Windows remains 4a90be0186666a0e2007029da85e5a0846539e2a. PR: https://github.com/NAOKI-Ko/digital-map/pull/27 (base dev). Production/main baseline: a58b4353bd108e6586f329080c772f69b8aaffda.

## All Acceptance Criteria

| # | Status | Criterion | Evidence / limitation |
|---|---|---|---|
| 1 | PASS | 390px high-density initial PINs do not overlap | Actual rendered rectangles + 10px gap; 4 of 36 visible. |
| 2 | PASS | Selected PIN remains visible | Selected 02 remains visible; engine test forces colliding selected candidates. |
| 3 | PASS | Active Category > featured/normal | Engine priority tests and filtered browser flow; filter remains collision-limited. |
| 4 | PASS | Featured > normal | Engine tests and dense initial visible featured set. |
| 5 | PASS | Stable equal-priority result | Stable Spot ID order, reverse-source tests; same-camera browser set stable. |
| 6 | PASS | Zoom in reveals hidden PINs | 390px zoom +1: 4 → 9; wide viewport 22 → 36. |
| 7 | PASS | Zoom out suppresses lower priority | All five responsive browser cases return to initial collision set. |
| 8 | PASS | Presentation-only; canonical data unchanged | Pure input-immutability tests; public JSON before/after identical; no schema/snapshot mutation. |
| 9 | PASS | Hidden PINs excluded from keyboard focus | All hidden DOMs inert/tabindex -1; focus handoff unit tests. |
| 10 | PASS | Initial pitch20/bearing0 | All responsive and 25 multi-floor initial cases. |
| 11 | PASS | Initial zoom closer and Map prominent | Dense 390 zoom14.6097076464 →15.2597076464; screenshot acceptance. |
| 12 | PASS | Safe zoom upper bound | Whole-floor +.65 cap; single/empty/invalid/extreme bounds tests. |
| 13 | PASS | Floor switch recalculates camera | 25 cases over five floors × five sizes; +.55–.65 for valid content. |
| 14 | PASS | Filter/detail/passive resize do not reset user camera | Native zoom preserved; detail only existing minimal panel avoidance pan; close/resize no reset. |
| 15 | PASS | Overview 0/0 whole-floor fit | All five responsive cases: projected Floor corners contained. |
| 16 | PASS | 390/768/1024/1440/1440x700 primary flows | Local public responsive matrix and multi-floor flows PASS. |
| 17 | PASS | Outdoor dense and multi-floor regressions | 36-Spot development-only fixture plus existing five-floor Aquarium; no canonical fixture write. |
| 18 | PARTIAL | Public Release / LIVE Preview parity | One shared implementation/source verified; authenticated browser parity pending credential authorization. |
| 19 | FAIL | Tests/typecheck/build/Prisma/Verify all PASS | Local tests 694 PASS, 1 optional SKIP; typecheck/build/Prisma PASS after same-major security refresh; Verify blocked by unpatched advisory. |
| 20 | PASS | Production untouched | No main/Production merge or deployment; production baseline a58b4353bd108e6586f329080c772f69b8aaffda. |

Totals: 18 PASS / 1 PARTIAL / 1 FAIL. PASS rows refer to the tested local implementation; they do not substitute for pending Windows exact-SHA acceptance.

## 390px evidence and camera

Before: evidence/390-before.jpg. 36 PINs rendered; original density hidden attribute was overridden by display:flex. Camera bearing0/pitch0, zoom14.609707646398311; center lng136.97123594617784, lat35.068358034016384.

After: evidence/390-after.jpg. Visible Spot IDs wu68-00, wu68-03, wu68-18, wu68-21. Zero pairwise overlaps including 10px safety gap. Camera bearing0/pitch20, zoom15.259707646398311; center lng136.97076018598818, lat35.06792808243404. Whole-floor difference +.65. Valid content camera lower bound +.55 avoids hiding all normal PINs at the legacy +.5 density boundary. Empty/invalid/extreme placement falls back to whole-floor fit displayed at pitch0.

Zoom +1 visible: wu68-00/03/05/12/15/17/24/27/29. Active shop Category at that zoom: wu68-00/02/04/12/14/16/24/26/28. Selected wu68-02 remains visible. Detail camera may make the pre-existing minimal pan to avoid the panel; it does not restore initial zoom. Closing detail and passive resize preserve the user camera.

Overview: bearing0/pitch0, zoom14.609707646398311; all four projected Floor corners fit within the padded viewport. Overview is independent of initial policy.

Algorithm: requestAnimationFrame-coalesced scale writes → actual button/artwork union rectangle reads → visibility writes; stable greedy O(n²), selected > active Category > featured > normal, stable Spot ID ties, 10px gap. Selected always accepted. Hidden PINs are inert, tabindex -1 and aria-hidden; focus moves to map region. Collision does not rebuild markers. Initial camera gets unfiltered Floor Spots through the shared Visitor renderer.

Responsive local initial visible counts for 390/768/1024/1440/1440×700: 4/9/9/22/9. Zero collision/focus violations in every case. Multi-floor: five floors × five sizes =25 cases PASS; 390px visible counts 10/4/6/9/7. Data and artwork differ from current Windows WU-67 snapshot, so Windows baseline/after must be compared on the unchanged Windows dataset.

## Security gate and pending acceptance

Verify initially found 18 advisories. Same-major refresh removes all except node-forge GHSA-86w9-cpqp-85rv; current latest npm version1.4.0 is affected and GitHub lists no patched version. Nuxt → listhen uses forge for certificate creation/import, and no vulnerable RSA signature verify call was found in app/listhen. No forge reference was found in the emitted server bundle. These observations support non-reachability, but do not justify silently altering the mandatory audit policy. No audit ignore, crypto patch or forced merge has been applied. A narrowly scoped security exception or an upstream fix requires resolution before Verify can pass.

Authenticated LIVE browser QA is awaiting explicit approval to read/use the previously established QA credential file. Automatic approval review rejected the action because authorization for that specific credential source was absent. Shared-renderer/source parity is verified.

Remaining Public Viewer debt: authenticated browser parity and exact merged-SHA Windows acceptance; upstream node-forge dependency disposition; current-location/georeference existing limitations remain unchanged; dense PIN discovery uses zoom and exact-coordinate detail navigation (no cluster/search by scope); legacy DOM candidate rebuild on Category changes remains, while collision itself preserves DOM; stale Windows public tunnel pointer needs reconciliation before external-link QA. No new importance, routing, Admin redesign, art, schema or Production work.

PR27 P2 follow-up: all three original findings have implemented fixes and local regression coverage; see07-P2-REVIEW-QA.md. Patched node-forge>=1.4.1 remains unpublished in official npm registry, so audit/Verify and downstream acceptance are blocked without exception.

Second review follow-up: content longitudes unwrapped across180°, dynamic Floor home pitch, and broad content fit fallback implemented.694 tests PASS/1 optional SKIP, typecheck/build PASS; additional20 responsive browser cases PASS. See07-P2-REVIEW-QA.md.
