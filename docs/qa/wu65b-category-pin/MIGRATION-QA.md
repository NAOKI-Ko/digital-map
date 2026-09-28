# Migration QA

PASS. Explicitly approved private Windows backup was restored to `digital_map_test_wu65_before`, cloned to `digital_map_test_wu65_after`, and migrated only on the latter before Windows deployment. Prisma migrations were used; no `db push`.

Legacy rows retain explicit tuples, coordinates, importance and eligibility. Source defaults are individual/null, Category defaults absent. Published objects are untouched. Windows later received verified DB/media/public backups before migration and passed its own pre/post comparison.

Rollback before adoption can keep additive columns while reverting code. After adoption, old code ignores inheritance: first materialize effective tuples or perform a coordinated, reviewed backup restore. Never silently drop source fields or overwrite subsequent operator work. [Detailed migration gate](../wu65-spot-operations-at-scale/65B-GATE.md).

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
