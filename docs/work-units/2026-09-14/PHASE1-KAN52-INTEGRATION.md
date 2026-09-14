# Phase 1 + KAN-52 Integration

Date: 2026-09-14

## Sources and integration line

|Role|Branch|SHA / path|
|---|---|---|
|Phase 1 source|`feat/phase1-product-foundations-20260913`|`3d4ee73749c0ae23f5cacebd9c752d55b337adc3`|
|KAN-52 source|`feat/kan-52-organization-map-rbac-20260913`|`c26edbf1d58b1a7bb2b225c1d59b8cf771f1d893`|
|Integration|`integration/phase1-kan52-20260914`|`/Users/naoki/Documents/Codex/2026-09-13/wu-kan-52-organization-map-scoped/integration/phase1-kan52/work/digital-map`|

The source-branch merge-base is `af2444854deb6c7a79ac371fa73690871bda38e2`.
The integration branch was created at the exact Phase 1 source SHA. The tree at
KAN-52's parent (`e2438342ced625f956841d596e663513966cd19c`) is identical to the Phase 1
source tree; their distinct commit ancestry represents the separately applied Windows path fix.

KAN-52's single logical commit was cherry-picked onto the integration branch as
`1b1426a` (`Feat: OrganizationとMap単位の権限制御を追加`). This retained Phase 1
history and kept the RBAC change independently reviewable. The cherry-pick had no textual
conflicts and required no compatibility production-code changes. Focused cross-feature
contract tests were added in a separate commit.

## Conflicts and resolutions

No source, schema, migration, or product-contract conflict was found.

- Phase 1 and KAN-52 were both based on the same completed Phase 1 tree.
- Tenant-scoped Media Library behavior is explicitly compatible with KAN-52: an assigned
  Map Editor may list/search/upload same-Tenant assets and attach them only through an
  authorized Map operation; physical asset deletion remains Owner-only.
- No per-asset ACL was introduced.
- No historical Phase 1 or KAN-52 migration was renamed or rewritten.

## Final permission matrix

|Capability|Tenant OWNER|Tenant MEMBER + Map EDITOR|Unassigned Tenant MEMBER|
|---|---:|---:|---:|
|List/access Maps|All Maps in active Tenant|Assigned Maps only|No admin Maps|
|Create Map|Yes|No|No|
|Edit/delete Map|Edit and delete|Edit assigned Map; no physical delete|No|
|Publish Map|Yes|Assigned Map|No|
|Floor, Spot, Category, georeference, PIN, fields, CSV, Decoration|All own-Tenant Maps|Assigned Map|No|
|Tenant Media list/upload|Yes|Yes, when assigned within Tenant|No|
|Attach same-Tenant Media|Any own-Tenant Map|Assigned Map only|No|
|Physically delete Media|Yes, subject to zero-reference rule|No|No|
|Organization settings/members|Yes|No|No|
|Assign Map Editors|Yes|No|No|

Every role is denied across Tenant boundaries. Server authorization resolves the Map or
nested resource first and uses its stored Tenant relationship; client-provided Tenant or Map
identifiers are not treated as authority. Owners inherit access and do not require a MapMember.

## Phase 1 authorization audit

All 44 handlers under `server/api/maps` were checked and call a common server-side guard:
`requireOwnedMap`, `requireOwnedFloor`, `requireOwnedSpot`, `requireMapAccess`,
`requireTenantMember`, or `requireTenantOwner`.

|Area|Audited behavior|
|---|---|
|Map|List is active-Tenant scoped and Editor-filtered; create/delete are Owner-only; read/update/publish use resource-derived Map access.|
|Floor|List/create/update/delete/reorder and illustration replacement use Map/Floor access guards.|
|Spot|List/read/create/update, placement/unplacement, publication, photos, design/PIN, duplicate inspection, and bulk mutation use Map/Spot guards.|
|Category|List/create/update/delete, icon upload, usage checks, and bulk Spot category changes use Map-scoped guards.|
|Media|List/upload require eligible Tenant media access; lookup is Tenant scoped; attachment is performed only after Map access; physical deletion requires Owner and preserves usage-count/zero-reference rules.|
|Spot Fields|List/create/update/delete, enabled/required/public flags, ordering, and custom values are protected through Map/Spot guards.|
|CSV|Template, preview/validation, and execution require Map access.|
|Decoration|List/create/update/delete use Floor/Map access and Tenant-scoped asset resolution.|
|Georeference|Setup/update/removal use Floor/Map access; normalized image-side coordinates remain canonical.|
|Organization settings|Read/update and member lifecycle remain Tenant Owner-only; exact-email membership addition exposes no global directory search.|

The organization switch endpoint revalidates membership before rebuilding session state. Map
listing uses the active membership: Owners receive all active-Tenant Maps and Members receive
only Maps with their EDITOR assignment. Public routes are not in authenticated admin middleware.
Public map resolution still requires a published Map, published and positioned Spots, and
`publicVisible` field definitions.

## Prisma schema and migration ordering

The final schema preserves Phase 1's normalized IMAGE `Spot.x/y`, normalized Floor
georeference image points, Tenant MediaAsset references, Spot Field Definitions and values,
Floor Decorations, and PIN size/importance fields. It also contains TenantMember
(`OWNER`/`MEMBER`) and MapMember (`EDITOR`) with their uniqueness, indexes, and relations.

Relevant combined order:

1. `20260913010000_image_spatial_model`
2. `20260913020000_tenant_media_library`
3. `20260913030000_spot_field_definitions`
4. `20260913040000_floor_decorations`
5. `20260913050000_spot_pin_size`
6. `20260913060000_organization_map_rbac`

This order is semantically required because the RBAC migration adds a Tenant logo reference to
the MediaAsset table introduced earlier. Phase 1 does not alter the legacy User-to-Tenant owner
source used by KAN-52.

The RBAC migration remains transactional and fails closed if any legacy Tenant lacks an exact
legacy admin. It backfills each legacy `User.role = admin` into OWNER membership using that
User's stored `tenantId`; it does not infer ownership from Maps, ordering, or email. Unique
constraints prevent duplicate membership. User, Map, and Phase 1 content tables are retained.

## Validation

- Dependency integrity: lockfile resolution and supply-chain policy verification passed. A fully
  offline reinstall could not finish because the local pnpm store lacks
  `@nuxtjs/tailwindcss@6.14.0`; no network download was attempted. Validation used the already
  frozen dependency tree from the clean KAN-52 worktree.
- Prisma generate: PASS (`@prisma/client` 7.8.0).
- Prisma validate: PASS.
- Tests: PASS, 43 files / 308 tests (including 5 focused integration contracts).
- Typecheck: PASS.
- Production build: PASS. Existing sourcemap and large-chunk warnings remain non-fatal.

## Migration Verification

Migration-only verification passed on 2026-09-14 using PostgreSQL 17.10 in an isolated local
Docker container. Two separate disposable databases were used: `fresh_gate` and `legacy_gate`.
No QA, staging, production, Windows, or other shared database was contacted.

### Fresh database

`prisma migrate deploy` applied all 17 repository migrations, from
`20260720000000_init` through `20260913060000_organization_map_rbac`, to an empty database with
zero migration errors. `prisma migrate status` reported the database schema up to date, and
`_prisma_migrations` contained 17 completed migrations with no unfinished or rolled-back row.

Prisma validation passed, Prisma Client 7.8.0 generated successfully, and a read-only
`prisma migrate diff --exit-code` found no difference between the database and
`prisma/schema.prisma`. The expected Phase 1 tables and columns were asserted, including
`MediaAsset`, `SpotPhoto`, `SpotFieldDefinition`, `SpotFieldValue`, `FloorDecoration`, normalized
Spot/Floor spatial columns, media-asset references, and Spot `pinSize`. `TenantMember` and
`MapMember` were also present with the final RBAC schema.

### Legacy upgrade

The second database was built by applying the first 11 migration folders in their repository
order, ending at `20260825000000_add_category_icon`. The seed was then loaded into that actual
historical schema before the remaining six migrations were applied through integration HEAD by
the normal `prisma migrate deploy` path. All six migrations succeeded with zero errors and the
final migration history reported all 17 migrations complete.

The deterministic legacy seed contained:

- Tenant A: admins `user_a1` and `user_a2`, Maps `map_a1` and `map_a2`, two Floors, a Category,
  a georeferenced positioned Spot, an unpositioned Spot, and a positioned fallback-render Spot.
- Tenant B: admin `user_b1`, Map `map_b1`, one Floor, a Category, and a positioned
  fallback-render Spot.
- Distinct IDs, slugs, emails, descriptions, publication state, category relations, photo JSON,
  pin metadata, and other representative legacy fields were retained for survival checks.

The repository's read-only `audit:image-spatial-migration` logic reported no invalid Floor
dimensions, invalid references, partial coordinates, out-of-bounds Spots, or transform errors
before migration.

### Spatial and owner results

The IMAGE migration preserved all four Spots. The georeferenced Spot at reference A converted
from `(lat, lng) = (35, 139)` to normalized `(x, y) = (0.1, 0.2)`. The two valid fallback-render
positions converted to `(0.25, 0.75)` and `(0.5, 0.5)`. The unpositioned Spot remained
unpositioned with both coordinates null. All positioned results were within `[0,1]`, exact
against the deterministic expected values within `1e-12`, and required no clamping or manual
remediation. Floor reference pixels `(100,100)` and `(900,100)` on a `1000x500` image converted
to `(0.1,0.2)` and `(0.9,0.2)` while retaining their geographic reference values.

KAN-52 created exactly three OWNER memberships: `user_a1` and `user_a2` for `tenant_a`, and
`user_b1` for `tenant_b`. This matches the legacy model in which every supported legacy User had
`role = admin`. Assertions found no cross-Tenant assignment and no duplicate `(tenantId,userId)`
membership. A transactionally rolled-back fixture also proved that a `TenantMember` with
`MEMBER` and a `MapMember` with `EDITOR` can be created together with valid final-schema
relations.

### Before and after counts

|Entity|Before|After|Result|
|---|---:|---:|---|
|Tenant|2|2|Preserved|
|User|3|3|Preserved|
|Map|3|3|Preserved|
|MapFloor|3|3|Preserved|
|Spot|4|4|Preserved|
|Category|3|3|Preserved|

All seeded IDs in these six entity sets remained present. Map publication state, Spot publication
and importance, Category associations, image dimensions, geographic reference coordinates, and
representative content fields were retained. Storage changes were semantically preserved as
normalized IMAGE coordinates and OWNER memberships; there was no unexplained row loss.

### Migration risks and deferred validation

No unresolved migration risk was observed for the valid historical scenarios exercised here.
The migrations intentionally continue to fail closed for invalid image dimensions, incomplete
coordinates, out-of-bounds legacy positions, invalid georeferences, tenants without an owner
candidate, and unsupported legacy roles; real datasets must pass the existing preflight before
upgrade.

Browser smoke: DEFERRED. Human UAT is intentionally deferred until the feature-development batch
is complete.

## Remaining risks

- Browser and authenticated user-flow behavior is outside this migration-only task and remains
  deferred to the later Human UAT batch.
- A clean offline dependency reinstall requires priming the missing pnpm-store tarball (or an
  approved network-backed frozen install); this does not affect the passing tracked-source build.

No product ambiguity or unresolved integration conflict remains.
