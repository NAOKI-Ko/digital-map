# WU-49 Preflight Audit

Date: 2026-09-20 (Asia/Tokyo)

Baseline: `f22c04a3adefcd384053751c53394e9d35186029`

The data sample is the verified Windows QA backup `pre-wu48-r2-5d372a5-20260920-0245`, DB dump SHA-256 `eae5a2911842e45b68ed3da2e1ef909a0a8c42e66d2cc6a6532faee50c6d6b2a`. It was restored to a dedicated local PostgreSQL 17 database and queried read-only. No QA rows were changed.

## Tenant / Map inventory

| Tenant id | Slug | Map count | Maps (`id:slug:published`) |
| --- | --- | ---: | --- |
| `cmtygyjoe0000h8vadv3cau9l` | `qa` | 5 | `cmtygyjq60002h8va9z5ip0o6:test-yukaori-onsen:false`; `cmtygyjqf0003h8vabuxkmrke:test-satoyama-minori-resort:false`; `cmu0tex4v0000z4va0wzosjdh:wu40-owner-journey:false`; `cmu5jyx6x000ibovakqhgzqik:test-map:false`; `demo-arimatsu-map:team-demo-arimatsu:true` |
| `cmu0ykvov000324vaphaqaosc` | `wu40-signup-tenant-3fe9ceba4b` | 0 | — |
| `wu40-tenant-b` | `wu40-tenant-b` | 1 | `wu40-map-b1:wu40-map-b1:false` |

Summary: 3 Tenants, 6 Maps; one Tenant has 0 Maps, one has 1 Map, and one has more than 1 Map.

### One-Map conclusion

The `qa` Tenant violates the target invariant. Names indicate a mixture of seed/demo/test and QA journey data, but the audit cannot prove every row disposable or choose a canonical winner without product/operator input. Therefore:

- no Map is deleted, merged, or reassigned;
- WU-49 does not add `Map.tenantId UNIQUE`;
- application creation rejects a new second Map;
- the hard 1:1 migration remains a staged blocker.

## Spot inventory

- Total Spots: 20
- Orphan `floorId`: 0
- Broken Floor → Map: 0
- Ambiguous derived Tenant: 0
- Derivation used: `Spot.floorId → MapFloor.mapId → Map.tenantId`

## Category inventory

- Total Categories: 8
- Broken Map relation: 0
- `[tenantId, name]` collisions: 0
- Derivation used: `Category.mapId → Map.tenantId`

Tenant-scoped Category uniqueness is safe for the audited QA rows. Because multiple legacy Maps remain under one Tenant, changing uniqueness is still reviewed as a compatibility migration rather than evidence that Map 1:1 already holds.

## Relation inventory

| Relation | Row count | Ownership implication |
| --- | ---: | --- |
| SpotCategory | 15 | must reject Spot/Category tenant mismatch |
| SpotRevision | 6 | follows Spot canonical tenant |
| SpotEditorAssignment | 1 | follows Spot canonical tenant |
| OrganizationInvitation with targetSpot | 3 | invitation tenant must match Spot tenant |
| SpotPhoto | 1 | photo asset tenant must match Spot tenant on writes |
| SpotFieldValue | 11 | field definition remains Map-owned; Map tenant must match Spot tenant |
| SpotFieldValueTranslation | 4 | same transitional FieldDefinition invariant |
| SpotDailyAnalytics | 30 | existing tenant/map/spot identifiers must remain coherent |

## Map-ownership assumptions found

- Spot CRUD, duplicate search, bulk updates, position/design routes, CSV, revisions, invitations, and analytics resolve ownership through `floor.mapId`.
- Category CRUD and category validation resolve ownership through `mapId`.
- SpotCategory currently relies on handlers selecting Categories from the current Map; the join itself has no cross-tenant DB constraint.
- Public snapshot building traverses Map → Floors → Spots and Map-scoped Categories. Its payload contract must remain unchanged.
- `SpotFieldDefinition` and custom values remain Map-scoped by explicit WU-49 exception.
- The pre-WU-49 seed created three independent demo/verification Maps in the default Tenant. Standard WU-49 seed now creates only the Arimatsu Map; it does not delete or reassign existing rows. Stage-B fixtures still describe historical multi-Map RBAC data and are not part of standard seed.
- The only production Map creation handler is `POST /api/maps`; it currently permits a second Map.

## Preflight decision

Spot and Category backfills are unambiguous and Category tenant-name uniqueness has no audited collision, so additive ownership migration may proceed. Hard Map 1:1 uniqueness may not. The final WU-49 verdict remains BLOCKED until the existing multi-Map QA Tenant is explicitly resolved.
