# 65C gate — PASS

Prerequisite 65B: `8982369`. All mutations used the local disposable synthetic fixture.

One bounded review/apply contract now handles Category ADD/REMOVE, eligibility, coordinate-safe Floor assignment, explicit PIN source adoption/freeze, and existing deletion. Preview and apply share the validation planner. The review token binds exact IDs, Spot versions, source revisions and before/after values. Apply rechecks ownership and conditions inside a Serializable transaction; any error changes none. Results distinguish changed from unchanged. An audit records actor/action/IDs/counts without content.

## Verification

- Browser selected the filtered 37 rows, opened review and tested sole-Category adoption. The two-membership row was reported invalid and Apply disabled; no inference or automatic exclusion.
- Explicit 展示 adoption via UI: 36 changed, 1 already inherited. All 37 then inherited green.
- Mobile review at 390px: no horizontal overflow, selected count and before/after samples visible; scrollable dialog supports long review. [Evidence](evidence/65c-review.png).
- Authenticated API, two unplaced rows: Category ADD/REMOVE both changed 2; no other membership lost.
- Removing the PIN source from the 37-row batch returned 409.
- Mixed placed/unplaced Floor batch returned 409; eligible unplaced pair assigned successfully, then intentionally restored to original Floors.
- Target-on batch containing unplaced rows returned 409.
- Changed membership after review invalidated the old review token (409).
- Freeze-to-individual and explicit return-to-Category succeeded.
- All 37 coordinate tuples were byte-equivalent before/after; all effective colors remained expected green.
- Unit/API tests cover authorization for every ID, bounds, no-op counts, dependency removal, any single coordinate including zero, target-on precondition, no membership inference, freeze semantics, stale Spot/default revisions, and serialization conflict.
- Full suite: 646 passed, 17 conditional skips. Typecheck passed.

No partial-success mode: invalid rows are reported, the whole command is rejected, and the operator may revise the selection. Network-unknown results require reloading/reviewing server state. No generic Undo promise. Published output is unchanged until a separate Map publication.

65C gate is satisfied; placement throughput can proceed.
