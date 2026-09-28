# Category PIN schema

Additive migration: `prisma/migrations/20260929010000_category_pin_defaults/migration.sql`. Category stores an optional complete appearance tuple (type/icon/image/asset/color/size) and revision. Spot temporarily stores `pinSourceMode` and nullable `pinSourceCategoryId`; default mode is `individual`.

Modes are `standard`, `category`, `individual`. Source membership and tenant/Map scope are enforced by write paths; FK/constraints protect referential and mode invariants. No Placement entity or coordinate fields were added. The appearance resolver boundary can move with future Placement metadata. Importance remains independent.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
