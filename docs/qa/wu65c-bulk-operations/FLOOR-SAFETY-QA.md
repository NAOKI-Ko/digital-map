# Floor safety QA

PASS. Floor assignment requires **all x/y/lat/lng null** and publication target off. Any coordinate, including zero or partial state, blocks the entire batch; even same-Floor requests do not bypass that rule.

Local mixed placed/unplaced batch returned 409. Two eligible coordinate-free rows assigned successfully and were deliberately restored to original Floors. All 37 coordinate tuples matched before/after. Windows 37 placed rows were rejected with 409. Mutation writes only Floor/version, never coordinates. Tests explicitly check zero, partial state and target-on prohibition.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
