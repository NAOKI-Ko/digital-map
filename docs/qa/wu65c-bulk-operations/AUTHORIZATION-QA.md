# Bulk authorization QA

PASS. Server deduplicates/bounds submitted IDs and authorizes every Spot for the authenticated Map/workspace inside the transaction. Category/Floor/source references are scoped; client selection is not trusted. Any missing/foreign ID prevents mutation.

Review token binds exact IDs, versions, Category defaults and intended before/after state; apply revalidates instead of trusting preview. `tests/bulk-spot-api.test.ts` covers unauthorized IDs, bounded requests, missing review, stale Spot/default state and serialization conflicts. These are API tests; no claim of probing unrelated real customer records.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
