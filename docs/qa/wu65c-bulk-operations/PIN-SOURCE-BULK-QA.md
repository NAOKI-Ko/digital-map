# PIN-source bulk QA

PASS. Explicit source adoption requires membership for every row; it never adds membership or guesses from order. Reviewed sole-Category command rejected the two-membership row; Apply was disabled. Explicit 展示 adoption succeeded for 36 changed + one no-op locally, then 37 changed on Windows.

STANDARD and freeze-current-to-individual are explicit commands. Detailed CUSTOM style edits stay per-item. Freeze and return-to-Category passed with all coordinates and importance preserved. Changed Spot/default revisions invalidate the review token (409). Invalid batches have zero mutations rather than implicit skips. Tests: `tests/bulk-spot-api.test.ts`.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).

Expanded §7.4 follow-up adds aggregate valid/conflict/zero-skip counts. Built browser review confirmed 36 valid / one conflict / zero skipped with Apply disabled and all 37 unapplied. This display correction does not alter transactional behavior.
