# WU-49 Schema Diff

## Tenant

- Current: owns Maps and Media; Spot/Category ownership is derived.
- Target: also owns Spot and Category directly.
- Backfill: derived through existing mandatory relations.
- Compatibility: existing Map relations remain.
- Future cleanup: expose broader tenant tourism-data services as Web features arrive.

## Map

- Current: many Maps may reference one Tenant; no explicit view capabilities.
- WU-49: adds Illustration/Real enablement and default-view configuration, plus hard unique `tenantId` after the approved QA cleanup.
- Backfill: all existing Maps become Illustration enabled, Real disabled, default Illustration.
- Compatibility: Map/Floor/public URLs and immutable snapshots remain unchanged.
- Database invariant: each Tenant owns at most one standard Map; a Tenant may own zero Maps during onboarding.

## Spot

- Current owner: `Floor → Map → Tenant`; `x/y` are Illustration placement.
- WU-49: `tenantId` is the canonical owner; nullable `lat/lng` are real-world coordinates.
- Backfill: `Spot.tenantId = Spot.floor.map.tenantId`.
- Compatibility: `floorId/x/y` remain unchanged and independent of `lat/lng`.
- Future cleanup: Illustration placement may move to a dedicated entity in a later WU.

## Category

- Current owner: Map; uniqueness is `[mapId, name]`.
- WU-49: `tenantId` is canonical; `mapId` remains; uniqueness becomes `[tenantId, name]`.
- Backfill: `Category.tenantId = Category.map.tenantId`.
- Compatibility: existing Map routes and filters continue to use the same rows.
- Future cleanup: remove `mapId` only after all consumers support tenant-owned categories.

## SpotCategory

- Current: composite key only; handlers indirectly keep both sides in one Map.
- WU-49: same table, with transactional same-tenant validation and read-only audit.
- Future cleanup: a denormalized tenant key or database trigger may be considered only with measured need.

## Related Spot tables

Revisions, editor assignments, invitations, photos, field values/translations, and analytics keep their schemas. Their access paths follow Spot's canonical tenant. Write services validate target relations where WU-49 touches them.

## SpotFieldDefinition

- Current and WU-49: Map-owned.
- Reason: moving it is not required for safe Spot/Category ownership and would broaden compatibility risk.
- Future: define tenant-wide fields and per-view presentation semantics before migrating.
