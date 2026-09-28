# Resolver QA

PASS. `shared/utils/pin-appearance.ts` owns semantic source selection, with server include/helper integration in `server/utils/pin-appearance.ts`. Editor, LIVE Preview and release building resolve the same tuple; snapshots receive concrete results.

`tests/pin-appearance.test.ts` covers individual legacy preservation, whole-tuple standard, dynamic Category values, immutable previously resolved output, absent-default fallback to standard, invalid missing source and no inherited importance. Missing Category references are invariant failures, not implicit fallback to another membership.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
