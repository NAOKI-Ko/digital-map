# WU-72 implementation gate and inventory

2026-10-04. Status: implementation authorized. Category Phase 1 decision approved by the user: consumer Map 0..1; cross-Map sharing deferred. Workspace ownership and existing exclusive Map Editor canonical update rights remain. This fixes the inventory, authorization scope and migration sequence before implementation.

## Authority and verified base

- [WU-72](https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219129928251036), including its latest comment, read directly from Asana.
- [WU-71 Accepted Decision D](https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219129395718996), read directly from Asana.
- Exact base and origin/dev: `acbcba3378ef7bc3cdf76fef768195899b0ab370`.
- [Post-merge Verify 37175891872](https://github.com/NAOKI-Ko/digital-map/actions/runs/37175891872): push / dev / exact base SHA / completed / success / attempt 1. Job 111358293975 and every step succeeded, including frozen install, Prisma validate/generate/migrate deploy, audits, typecheck, tests and build.
- Fresh checkout at the verified base. After the approved Category decision, prior WIP implementation code was used as a starting point, reviewed and revised; the prior sharing prototype is not authority. Production and Windows deployment were not changed.

## Current source inventory

All paths below are relative to `work/` at the exact base.

| Boundary | Source and existing assumption | Required migration/compatibility behavior |
| --- | --- | --- |
| Map cardinality | `prisma/schema.prisma`: `Map.tenantId @unique`; `20260920020000_map_tenant_unique` explicitly rejects multi-Map tenants | Remove singleton index only at final unlock; retain TenantMember N:M and slug uniqueness |
| Creation | `server/utils/tenant-tourism-data.ts`: advisory transaction lock and existing-Map guard; `server/api/maps/index.post.ts`: Owner-only creation plus default field initialization; `index.get.ts`: creation permission requires zero Maps | Preserve Owner creation and zero-Map onboarding; retain transactional initialization; switch guard and permission only after regression |
| Dashboard/active Map | `app/pages/admin/dashboard/index.vue`: one Map redirect, >1 Map hard stop; `app/utils/admin-navigation.ts`: authorized route Map or sole Map, null on ambiguous choice; `app/pages/admin/maps/new.vue` | Explicit authorized Map picker, no arbitrary first-Map selection; stale/inaccessible route fails closed |
| Route/API ACL | `server/utils/map-access.ts`: active TenantMember plus MapMember EDITOR or Workspace Owner; Spot access derives Map from Floor | Map ACL stays first gate; canonical edit additionally requires sole consumer and matching steward; Owner retains canonical authority; no cross-Map transfer |
| Category | `prisma/schema.prisma`: tenant ownership, tenant/name uniqueness, required `mapId` with Cascade; `server/utils/category.ts` and category endpoints require Map+Tenant; creation/patch/pin defaults allow Map Editor | Preserve canonical ID, Workspace ownership, uniqueness and current single-Map Editor rights. Approved adoption cardinality is 0..1; cross-Map sharing is deferred, enforced by categoryId unique and provenance guards |
| Custom fields | `server/utils/spot-field.ts`: definitions per Map, custom submissions by definition ID; `SpotFieldValue`/translations refer to those IDs; revision and CSV also resolve Map schema | Keep definition/value IDs and types; never combine by label; retain schema provenance when consumer detaches; prohibit transfer and destructive schema deletion |
| CSV | `server/utils/spot-csv.ts:loadSpotCsvContext`, `server/api/maps/[mapId]/spots/import/index.post.ts`: Floor→Map lookup, canonical `__spotId`, row/schema versions, field IDs; update does not relocate | One row per canonical Spot; legacy Floor maps to primary-placement projection; preserve unchanged row hashes and conflict detection; additional placements must not duplicate content or silently change CSV semantics |
| Media | `server/utils/media.ts`, `media-gc.ts`, `server/api/media/[assetId].delete.ts`: Tenant-owned assets, usage reference counts, Owner physical delete | Keep Workspace ownership; add Usage PIN references to delete/GC protection; preserve canonical photos and revision photo references |
| Delete/archive | Map DELETE is physical cascade; Floor DELETE cascades Spot through required FK; `server/utils/spot-bulk.ts` includes delete/assignFloor; Map-owned definitions and Category cascade too | Floor removes occurrences only. Map removal/archive retains canonical content, fields, assignments, revisions and historical release identity. Map removal of Spot must not become canonical deletion. Publication/archive races require serialization |
| Audit | `AuditEvent` Tenant ownership, optional informational mapId, existing canonical IDs; deletion endpoints append audit | Keep past records and canonical targets; record Usage/Placement identity and independent versions for new actions |
| Seed/tests | `prisma/seed.ts` writes legacy Spot position directly and upserts Category by tenant/name while updating mapId; tenant foundation integration expects second Map failure; stageb fixtures search a second Map | Seed adapters must not transfer Category implicitly; update active policy fixtures/audit but preserve historical migration checks; disposable DB only for destructive integration |
| Audit policy | `scripts/audit-tenant-data-foundation.ts` reports multiMapTenants as anomaly and hard one-Map policy; spatial audit reads Spot.floorId/x/y | Replace active singleton assertion after regression; add consumer/steward/tenant/Floor checks and old/new projection comparison |
| PublicRelease | `server/utils/public-release.ts`: immutable manifests, repeatable-read build, enabledLocales initially read outside snapshot; pointer activation/rollback serialized by Map | Freeze Map/Floor/Usage/Placement/content/Category/assets/locales in one consistent read; preserve old manifests byte-for-byte; pointer-only rollback; no public LIVE fallback |
| Spot.floorId/x/y | required Floor FK Cascade; nullable normalized x/y; independent canonical lat/lng | Retain legacy columns as nullable compatibility projection; Placement owns floor/x/y and version; no text/photo/lat/lng copies; canonical survives Floor removal |
| Assignment | `SpotEditorAssignment.spotId` PK; invitation targets canonical Spot; `server/utils/spot-revision.ts` resolves assigned editor Map via Floor | Preserve assignment/invitation IDs; resolve consumer/steward; no-consumer/no-steward Spot becomes Owner-managed, with retained schema provenance |
| Revision | payload on canonical Spot; baseVersion compares liveVersion; Floor-derived Map authorization; approval changes fields/photos | Keep pending baseVersion through backfill; content version independent of Placement/Usage versions; validate retained field IDs and author/reviewer access; stale-write behavior needs explicit adapter tests |
| Analytics | `server/utils/analytics.ts`: event mapId+canonical spotId, validates Floor Map; daily unique spotId/date | Resolve sole Usage for authorization; aggregate canonical Spot; occurrence IDs must not replace event or URL Spot IDs |
| Visitor renderer | `app/composables/useMapViewer.ts`: selection, focus, density, collision/recovery keyed by Spot.id; LIVE serializer in `server/utils/public-map.ts` traverses Floor.spots | Occurrence identity uses Placement ID; old manifests get deterministic in-memory fallback only; detail/analytics retain canonical ID; test focus/selection/collision/spiderfy/camera/motion/Public-LIVE parity |
| Paper consumers | Paper/PDF utilities consume public/live shaped data | Compatibility-shaped reads only; no Paper redesign; do not collapse repeated placements by canonical ID |

## Approved Category decision

Category has at most one consumer Map in Phase 1, enforced by `MapCategoryUsage.categoryId @unique`. Cross-Map sharing and transfer are deferred. Existing Workspace ownership, canonical ID, Tenant/name uniqueness and exclusive Map Editor canonical update rights are retained. Workspace Owner remains authoritative. Legacy `Category.mapId` keeps immutable schema provenance; Map archive preserves categories and their adoption, and does not enable sharing.

This decision was approved by the user on 2026-10-04 before code changes. MapSpotUsage similarly has a unique Spot ID; steward must be null or its sole consumer Map. A null steward never grants Map Editors write access. No-consumer and archived content remains manageable through Workspace Owner endpoints, including pending revision approval and assignment lifecycle. Field IDs/types remain tied to the original schema Map and are never inferred by labels.

## Data/backup evidence and limitations

Fresh local canonical read-only transaction: 5 Tenants, 5 Maps, 58 Spots, 18 Categories, 0 field values, 0 pending revisions, 8 PublicReleases. No writes were made. This differs from the previous checkpoint's local 2/2/0 inventory; that historical count must not be reused as current proof.

Historical Windows read-only inventory from the prior checkpoint: deployed SHA `2d12122fdf016e77b477ed6296a4c44ae7b6cfd6`, 9 Workspaces, 9 Maps, 90 Spots, 20 Categories, 19 releases; 32 unpositioned and 32 unpublished Spots; 0 field values/pending revisions/assignments and 0 recorded cross-Map field/category/revision mismatches. These are historical evidence, not a fresh Windows verification in this task.

The local canonical DB was dumped read-only into a custom-format PostgreSQL backup and successfully restored into two disposable DBs. Fresh and upgrade migrations were applied only to disposable databases. Canonical DB, Media and Public files were not migrated or rewritten. Before any persistent migration, refresh inventory (including field translations, revision payload schema references, media and manifests) and verify DB/Media/Public backup and restore. No Production access or mutation was performed.

## Fixed implementation sequence

1. Refresh data/constraint inventory and backup proof. Fix Category policy and its authorization matrix. Fail before mutation on unresolved provenance or tenant/Map inconsistencies.
2. Add Usage and IllustrationPlacement with deterministic legacy backfill identity; one consumer per canonical Spot, matching non-null steward, tenant/Floor/Map consistency, independent versions. Keep all legacy fields and IDs. No uniqueness of Spot+Floor unless an actual requirement is accepted.
3. Backfill every Spot, including null coordinates and unpublished rows. Verify exact counts, canonical IDs, content, fields, translations, photos, assignments, pending revisions and release digests. No publication file rewrite.
4. Compatibility projection: primary Placement and Usage to existing DTOs/CSV; old manifests adapted in memory; maintain canonical URL/detail/assignment/revision/analytics identities.
5. Switch every mutation: create/edit/import/bulk/position/design/translation/revision/publication/delete/archive, plus Owner management for unconsumed content. Legacy requests retain explicit stale-write checks; additional occurrence endpoints never modify canonical content or other occurrences.
6. Regression in fresh disposable PostgreSQL: fresh and realistic upgrade, 0/1/multiple Map authorization, multiple Floor and duplicate same-Floor occurrences, delete/archive retention, custom schema/CSV/revision stale conflicts, media reference protection, immutable releases and rollback; WU-68–70 visitor UX and Public-LIVE parity.
7. Only then release multi-Map: remove tenant unique, change creation guard/permissions and dashboard/picker, reconcile seeds/tests/audits. Run tests/typecheck/build/Prisma/Verify/Codex review and create Draft PR. Candidate deploy to Windows requires those gates plus fresh verified backup and exact SHA QA. No merge or Production deployment.

Rollback keeps new schema and records, preserves immutable releases, disables incompatible mutation paths, and switches compatible application/pointers only. No reverse destructive migration or deletion of new placements. Verified pre-migration backup is recovery material, not authorization to erase later edits.

## Implementation and validation

Implemented the five ordered migrations: additive tables/nullable legacy projection, complete backfill, transactional legacy-write compatibility, ownership/resource guards, and final singleton-index removal. No columns or canonical records are dropped. Floor deletion removes occurrences; Spot removal detaches Usage; Map deletion archives and unpublishes while retaining schema/content/assignments/revisions/releases. New Placement writes use optimistic versions and Floor image versions. Content revisions use a separate canonical version, preserving existing pending revision bases at backfill.

Compatibility reads preserve canonical Spot IDs and CSV row identity. CSV remains one row per canonical content and projects the primary occurrence. Additional placements have independent IDs/coordinates. Visitor rendering uses occurrence IDs, while details and analytics retain canonical identity. Existing immutable PublicRelease manifests remain untouched; old manifests obtain an in-memory deterministic occurrence fallback. New manifests freeze locale/content/usage/placement data in one repeatable-read snapshot. Media delete/GC includes Usage PIN references.

The companion validation report records final tests, build, Prisma, audits, browser checks, review and CI evidence. Windows inventory above is historical; Windows candidate migration/deploy and human QA remain gated on a fresh inventory, DB/Media/Public backup restore verification and exact candidate SHA. Production is untouched.
