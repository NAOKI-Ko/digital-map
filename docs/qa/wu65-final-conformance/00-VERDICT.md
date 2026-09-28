# Final verdict — WU65-CONFORMANT-WITH-NONBLOCKING-GAPS

Corrected product dev and Windows QA: **`0d0d1d5d75b6009c34e4bc37f9a6c5231e5cb245`**. Initial reviewed dev was `a6f7f018dcecb7d1095bacf26293fa246464d6d0`; initial Windows was `d9d157fb6901bd56845319fc97c0618bfc598f6c`. The final evidence PR changes documentation only; the tested application tree is the correction merge above.

**D1–D10: 10 PASS / 0 PARTIAL / 0 MISSING.** All required product corrections are implemented. A–G product behavior passes; the native Windows IME candidate-window portion of A3/D6/F7 remains **PARTIAL coverage**, one shared nonblocking manual-test debt. Browser-dispatched composing Escape and focused Enter were tested; they are not described as native IME tests. No product decision is open. No P0/P1 was found.

[Correction PR #21](https://github.com/NAOKI-Ko/digital-map/pull/21) merged after [push Verify](https://github.com/NAOKI-Ko/digital-map/actions/runs/36491680256) and [PR Verify](https://github.com/NAOKI-Ko/digital-map/actions/runs/36491683769) PASS; [post-merge Verify](https://github.com/NAOKI-Ko/digital-map/actions/runs/36491975362) PASS. An initial CI-only test-database guard failure was corrected before merge. Application changes are listed in 05; no correction migration was needed.

Local: **671/671 tests PASS**, including actual 90-Spot before/after marker DOM and tuple comparison and transactional rollback rehearsal; typecheck/build/Prisma validate/diff check PASS. Windows: **670 PASS / 1 SKIP** (the private Mac-clone comparison); Windows typecheck/build/Prisma validation/migration status PASS. Separate Windows canonical before/after digest covers all 90 Spots, 20 Category icons, nine publication references and public-file hashes, unchanged after activation and after isolated replay. See 03.

Fresh Windows acceptance used `digital_map_test_wu65_final` and separate uploads/public storage. Native Excel opened 37 Japanese rows and saved UTF-8 CSV; the UI imported that saved file. Reviewed group Category add/remove, three-row safe Floor preparation, explicit multi-Category source, 37 inherited styles, three UI photo associations, five Floor sessions and exactly 37 canvas saves all passed. Placement did not set publication targets. A later reviewed command enabled 37 targets; Visitor Preview and blue release A / green LIVE / green release B passed. Additional retail fixture checks covered stale/deleted queue recovery, focus, composing Escape, default Save conflict/dirty retention, individual freeze/reset/standard, and neutral/configurable retail labels. Browser automation ran Chromium on Mac against the native Windows server through a localhost-only SSH tunnel; Excel itself ran natively on Windows.

**AQUA-005 CLOSED; AQUA-010 CLOSED; AQUA-013 CLOSED.** Shared style and administrative group decisions no longer require 37 individual Detail visits. 37 spatial judgments and selective per-item content/photo work remain. WU-65 may be CLOSED with the recorded nonblocking IME coverage debt; Nagoya Aquarium production-quality content/QA work may resume. This is not Production deployment approval. **Production/main untouched; real Aquarium/Arimatsu were not rebuilt or adopted.**

The initial read-only audit below is preserved; its matrix was committed as `36d7902` before corrections.

---

# WU-65 final conformance — initial read-only verdict

**CORRECTION-REQUIRED**. Reviewed dev `a6f7f018dcecb7d1095bacf26293fa246464d6d0`; Windows tested product `d9d157fb6901bd56845319fc97c0618bfc598f6c`. Trees match. Authority is all eleven approved design documents, especially plan slices A–G; truncated implementation prompts are not the acceptance boundary.

This complete initial matrix was written **before any correction**. PASS means inspected source plus cited tests/evidence support the requirement, not merely that an earlier document said PASS. Browser evidence has its actual scope; absent focused evidence is marked PARTIAL. Source paths are repository-relative. Final outcomes will be appended separately, preserving this initial audit.

D1–D10 initial totals: **6 PASS, 4 PARTIAL, 0 MISSING**. Slice A PASS; B PARTIAL; C PARTIAL (verification); D PARTIAL; E PASS; F PARTIAL; G PARTIAL. No new product decisions are required. Corrections are bounded presentation/state-recovery work plus missing verification; no schema/domain/renderer redesign.

Sources: [decisions](../../design/wu65-spot-operations-at-scale/00-EXECUTIVE-DECISIONS.md), [plan](../../design/wu65-spot-operations-at-scale/10-IMPLEMENTATION-PLAN.md), the source/test references in matrices, and [actual Windows evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md). Prior PR #20 records deployment of `d9d157fb6901bd56845319fc97c0618bfc598f6c` and unchanged 90-row digest. Fresh Windows acceptance/compatibility will follow corrections.

Initial finding disposition: AQUA-005 PARTIAL (source/appearance core works, presentation gaps); AQUA-010 CLOSED (neutral copy/configurable retail semantics); AQUA-013 PARTIAL (material throughput gain demonstrated, incomplete queue/photo failure state). WU-65 closure awaits corrections and focused acceptance. Production untouched.
