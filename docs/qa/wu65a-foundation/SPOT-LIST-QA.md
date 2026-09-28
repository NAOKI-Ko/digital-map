# Spot List QA

PASS. List shows Floor/placed state, publication target, effective photo count and explicit PIN source after 65B. Missing photos are optional work, not a failure score. Task links resume existing screens; there is no Wizard or saved readiness state.

`tests/wu65-foundation.test.ts` checks managed versus legacy effective-photo counting and intersection of keyword/unplaced conditions. Browser list showed 37 imported Spots and later three with photos / 34 without. [Desktop Windows evidence](../wu65-spot-operations-at-scale/evidence/65d-windows-list.png), [390px local evidence](../wu65-spot-operations-at-scale/evidence/65a-list-mobile.png).

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
