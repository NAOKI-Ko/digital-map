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
