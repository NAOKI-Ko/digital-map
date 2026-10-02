# PR27 P2 revision QA

Authorized base/head: 8522ddadbae5fd2a8388b7110b5bc55fb37adaf8. No rebase/squash, merge or Production change.

## Three review findings

1. Focus preservation: actively focused marker is density-visible and protected from collision suppression. Selected still always accepted. Protected candidates are considered before suppressible candidates; normal priority selected > active Category > featured > normal is retained. Protection ends on focusout. Tests cover enlarged lower-priority focus colliding with higher priority and simultaneous selected/focused candidates. Actual 390px keyboard focus21 remains visible; Enter opens its detail.
2. Coincident Spot reachability: selected Spot detail exposes same-coordinate, currently Category-visible alternate Spots in stable ID order. No coordinate change, count/cluster UI, new importance or database mutation. Switching links updates selected PIN and moves focus to new detail heading. Public and authenticated Preview share this same component. Three uncategorized same-coordinate Spots were all reached by click/Enter at all five viewport sizes. Recovery is before photos in the detail body.
3. Fallback consistency: no-content/invalid/extreme content now displays the whole-floor camera at pitch0, matching the level fit calculation. Valid content retains initial pitch20/bearing0 and +.55…+.65 bounds. Empty and invalid browser fixtures ×5 sizes have bearing0/pitch0 with all four Floor corners inside24px padding. Tests also cover extreme placement.

## Revalidation

692 tests PASS /1 optional private historical migration comparison SKIP. typecheck/build PASS. Initial/zoom-in/zoom-out visible counts across390×844,768×1024,1024×768,1440×1000,1440×700:4/9/4,9/36/9,9/36/9,22/36/22,9/34/9. Zero non-protected overlaps and hidden-focus eligibility violations. Evidence: evidence/p2-responsive.json, p2-coincident-390.jpg, p2-empty-390.jpg, p2-invalid-390.jpg.

Affected AC1–7,9–13,15–17: PASS on tested local implementation. AC8,14,20 retained. AC18 remains PARTIAL pending authenticated browser QA. AC19 remains FAIL pending mandatory audit/Verify; no exceptions.

## node-forge gate

Both configured registry and explicit https://registry.npmjs.org lookup of node-forge@1.4.1 return ERR_PNPM_PACKAGE_NOT_FOUND; latest tag1.4.0. Latest listhen1.10.1 still depends on ^1.4.0. No safe upstream version or resolvable minimal override is available from the official registry at this run. Do not commit a failing override or pretend1.4.0 is patched. No audit ignore or policy relaxation. Mandatory audit/Verify remains blocked until a published patched >=1.4.1 can be installed and verified.

Codex re-review is requested after pushing this fix. Thread resolution and returned findings must be checked before future merge. Merge is allowed only after Verify PASS, then post-merge Verify → Windows exactSHA → authenticated Preview → Final Acceptance. Production untouched.

## Second Codex review / additional P2 fixes

Codex review on ce23eec completed2026-10-02T02:20:43Z with three additional P2s. Original three threads were resolved; these new findings are also fixed:
- Unwrap content longitude relative to its first corner before taking bounds. Test and browser georeferenced Floor extend across180° with nearby valid reference points. Initial center≈179.999° at all five sizes, never Greenwich.
- Navigation home pitch now reads the camera policy dynamically. Empty/invalid/broad fallback begins without a reset compass; rotating then resetting restores bearing0/pitch0. Valid content restores bearing0/pitch20. Floor-specific policy follows recalculation.
- Content fit is never raised past its fitted zoom. When the fitted content zoom cannot reach the discovery minimum+.55, use the level whole-floor fallback. No forced crop of broadly distributed Spot edges; two featured edge Spots at x/y .1/.9 remain reachable and visible at all five sizes.

Second revision verification:694 tests PASS/1 optional SKIP, typecheck/build PASS. Twenty browser cases(empty/invalid/broad/dateline×five sizes)PASS; all reset bearings0, fallback reset pitches0, valid dateline reset pitches20, no initial compass, zero collision/hidden-focus violations. evidence/p2-round2-responsive.json.

node-forge official published versions end at1.4.0; no stable>=1.4.1 exists in returned registry metadata. Required audit remains unchanged and FAIL; no merge or downstream Windows activation.

## Third revision: second re-review additional findings

Review on58b25ce added2 P2s. Both fixed:
- Explicit overview establishes homePitch0. Compass resets after overview retain the level fitted camera; next Floor initial load establishes its own20° or fallback0° policy.
- Recovery now includes every actual measured screen-rectangle overlap with the selected PIN, not just exact coordinates. Geometry is measured once for all candidates including density-suppressed normals; recovery IDs are emitted only when changed. Detail links intersect the current published/Category-visible Floor Spots and remain stable by ID. This covers nearby Spots inseparable at finite maximum zoom. No new search/cluster UI or canonical mutation.

Five near-coordinate browser fixtures reach exact maxZoom, where only00 is visible;01 and02 are then reachable through Enter/click detail navigation at each size. Five overview→rotate→reset flows preserve0°/0° and have no immediate reset compass. evidence/p2-round3-near.json.696 tests PASS/1optional SKIP, typecheck/build PASS.

Final multi-Floor revalidation:25 cases PASS for initial policy, zoom discovery, overview recovery, Category selection and detail.390px/768px broad all-normal Floors use safe level fallback and initially suppress normal PINs; zoom+1 reveals11/4/6/9/7, or Category selection provides direct discovery at the fit.1024/1440 sizes use20° valid content framing. This mobile broad-normal initial discovery limitation is explicitly remaining Viewer debt, not a canonical data edit. evidence/p2-round3-multi-floor.json.

The mandatory audit still reports node-forge1.4.0 high, with official npm1.4.1 HTTP404 and no published stable>=1.4.1. No exception, no merge or Windows activation. Third Codex review requested on the new implementation head; final result must be recorded separately.

Final Codex re-review completed2026-10-02T02:53:29.694884Z on2e636a3, no new findings/threads. All8 threads resolved. Final primary390 filter/detail/close/passive-resize/overview also PASS (detail pan settled before comparison); evidence/p2-round3-dense.json.
