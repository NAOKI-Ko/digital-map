# 65A regression

Original 65A gate: 636 tests passed, 16 conditional skips; typecheck and whitespace checks passed. This historical slice did not record a separate build/Prisma-validate result before 65B; do not infer one.

The complete product subsequently passed Prisma validate, typecheck, DB-backed tests and build locally, in CI, and on Windows (665 tests passed, one conditional private-backup test separately covered). Expanded-instruction reconciliation reruns the requested commands on current dev; see reconciliation for its exact outcome. No copy-only schema or configured-field backfill occurred.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
