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

### Initial one-Map conclusion

The `qa` Tenant initially violated the target invariant. Names indicated a mixture of seed/demo/test and QA journey data, and the original audit could not choose a canonical winner without product/operator input. Therefore the first WU-49 pass correctly made no destructive change.

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

## Approved Windows QA cleanup (2026-09-20)

The data owner subsequently approved the following fixed-ID decision for active Windows QA only:

- KEEP: `demo-arimatsu-map` / `team-demo-arimatsu`
- DELETE: `cmtygyjq60002h8va9z5ip0o6`
- DELETE: `cmtygyjqf0003h8vabuxkmrke`
- DELETE: `cmu0tex4v0000z4va0wzosjdh`
- DELETE: `cmu5jyx6x000ibovakqhgzqik`

Before deletion, Windows QA still ran `7c57e573e628e94d3858ab923a8d812a1bbbe2ff`. A new verified backup was created at `C:\DigitalMap\backups\pre-wu49-cleanup-7c57e57-20260920-053426`:

- DB dump: `db\digital-map-20260919T203428Z.dump`, 120,685 bytes, SHA-256 `944fb87aec92b8b547c3fcfd7b39f975a5a9b8ef056d388460d60698454ec6a2`
- Media archive: `media\20260919T203429Z\media.tar.gz`, 19,946,363 bytes, SHA-256 `0e62ee5604cfa8c5df5dbffd6528248d105fd5db3529ecdec427675c025de960`
- Media manifest: SHA-256 `68b4fad398d19ca1a46d1d010d2620fd767a96a9662333d2c68cf3a40023ccfa`
- Repository backup verification: PASS

Pre-delete dependent counts:

| Map ID | Floors | Spots | Categories | Field definitions | Members | Releases | Map/Spot analytics | Decorations | SpotCategory | Revisions | Assignments | Invitations | Photos | Field values/translations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `cmtygyjq60002h8va9z5ip0o6` | 1 | 0 | 0 | 6 | 0 | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 |
| `cmtygyjqf0003h8vabuxkmrke` | 1 | 0 | 0 | 6 | 0 | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 |
| `cmu0tex4v0000z4va0wzosjdh` | 1 | 2 | 1 | 6 | 0 | 0 | 0/0 | 0 | 1 | 0 | 0 | 0 | 0 | 0/0 |
| `cmu5jyx6x000ibovakqhgzqik` | 1 | 1 | 0 | 7 | 0 | 0 | 0/0 | 1 | 0 | 0 | 0 | 0 | 0 | 1/0 |

Three MediaAssets were referenced by the delete targets. `cmu0u3p2f0007z4vagxxax4wq` was also referenced by KEEP and was explicitly recorded as shared. No MediaAsset row or media file was deleted; all 11 MediaAssets remained after cleanup.

The first transaction attempt was fully rolled back because `SpotFieldValue_fieldDefinitionId_fkey` is `RESTRICT`. Read-only follow-up proved the single blocking row `cmu5k8jcb000ybova98b3n7wu` linked a Spot and FieldDefinition both owned by approved target `cmu5jyx6x000ibovakqhgzqik`. The successful transaction deleted that exact dependent row first, then exactly the four approved Map IDs, and committed only after KEEP and Map-count postconditions passed.

Post-cleanup:

- `qa` Tenant Map count: 1
- retained Map: `demo-arimatsu-map` / `team-demo-arimatsu`, still published
- all four fixed delete IDs and their normal dependents: absent
- KEEP counts unchanged: 7 Floors, 16 Spots, 7 Categories, 11 FieldDefinitions, 1 Member, 5 Releases, 6/36 Map/Spot analytics, 1 Decoration, 14 SpotCategory rows, 6 Revisions, 1 Assignment, 3 targeted Invitations, 1 SpotPhoto, 10/4 field values/translations
- other Tenant Map counts unchanged: `1`, `1`, and onboarding `0`

## Updated preflight decision

Spot and Category backfills remain unambiguous, Category tenant-name uniqueness has no collision, and no Tenant now has more than one Map. The cleanup blocker is resolved. Migration `20260920020000_map_tenant_unique` may enforce the hard maximum-one-Map invariant.

## Windows QA completion evidence

The hard migration remains active on Windows QA, now running exact implementation SHA `cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`. The active post-migration inventory is 4 Tenants, 3 Maps, 8 Floors, 17 Spots, and 7 Categories. The tenant-data audit reports zero ownership, coordinate, capability, or multi-Map anomalies; the IMAGE spatial audit reports zero anomalies. PostgreSQL reports all 30 migrations current.

Only the four approved fixed Map IDs were removed. `demo-arimatsu-map` remains the sole `qa` Map and is published through original READY release `cmu15w386000u4sva3mh5wty7`. Other Tenant Map counts did not change, all 11 MediaAssets remained, and all pre-existing release and backup folders were retained.

The final verified backup is `C:\DigitalMap\backups\post-wu49-unblock-cfdaa7d-20260920-072846`:

- DB dump: `db\digital-map-20260919T222847Z.dump`, 122,052 bytes, SHA-256 `1113b5e4ad33f6cafeea64ed7ca45233df80891d95a33949fde34cc94b1236a3`
- DB metadata: SHA-256 `8afe749cd80a24dedff54d9978d8aa3e2f3f3e7f0787ea2cc8e5496ac229a200`
- Media archive: `media\20260919T222848Z\media.tar.gz`, 19,946,363 bytes, SHA-256 `81c6436a20267c6a4ef5bc90dad1a7b8cd5ec7dc011b92dd4107fc74ac2afce1`
- Media manifest: SHA-256 `8d9503ee508f5821f95ad66375ef6c78b29ce8ad5d92ca628130ae80717b10e6`

That backup was restored to disposable database `digital_map_wu49_republish_restore_20260920` and an empty disposable media directory. Media manifest verification, migration deploy/status, both audits, retained counts `4/3/8/17/7`, expected published Map/current release count `1`, and `/api/ready` HTTP 200 all passed. Only the disposable database, disposable media, and disposable logs were deleted afterward; the backup was preserved.
