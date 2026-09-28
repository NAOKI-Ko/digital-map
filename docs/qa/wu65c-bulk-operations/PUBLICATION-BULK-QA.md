# Publication eligibility bulk QA

PASS. Reviewed target-on/off is a Spot eligibility command, not Map publication. Selection/count/consequence and busy/result states are explicit. Target-on requires complete placement; a batch containing unplaced rows returned 409 and changed none.

All 37 Windows synthetic Spots stayed target-off during placement, then a reviewed command enabled the complete set. Only the later explicit Publish created a release. Existing public content does not change when eligibility alone changes.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
