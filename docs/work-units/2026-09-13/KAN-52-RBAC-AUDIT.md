# KAN-52 Current-state RBAC Audit

Date: 2026-09-13

## Git and baseline

- Phase 1 batch end: `af2444854deb6c7a79ac371fa73690871bda38e2`
- Windows path fix: `684800f94810b81e12820f8674334f960a544c3c`
- The commits diverged from `a58b435`; no integration commit existed locally.
- Safe integration base: Phase 1 end plus a clean cherry-pick of the Windows fix (`e243834`).
- The dirty `/Users/naoki/digital-map` checkout was read only and was not used as a worktree.
- Before KAN-52 changes: Prisma validate passed; 40 files / 290 tests passed; typecheck and build passed.

## Existing state

The legacy schema modeled `Tenant 1--N User` using required `User.tenantId`. `User.role` defaulted to `admin`, login rejected every other role, and every authenticated admin received tenant-wide access. `Map`, `MediaAsset`, and all nested map resources were already tenant-derived. There was no organization membership join model, map membership, organization switcher, member-management API, or map deletion API.

`nuxt-auth-utils` stores `user.id`, `user.tenantId`, `user.email`, and the legacy admin role in an encrypted session. Client middleware only checked login state. Server middleware protected `/api/maps`, `/api/uploads`, `/api/geocode`, and `/api/media`; handlers used `requireAdminSession`, `requireOwnedMap`, `requireOwnedFloor`, or `requireOwnedSpot`. The client role was not sufficient for the new model and had to be replaced by database membership checks.

Existing ownership can be migrated deterministically: a legacy User had full admin access to exactly `User.tenantId`, so every legacy User becomes an OWNER of that Tenant. The migration aborts if any Tenant has no User or any unsupported legacy role is present. Map creators, email ordering, or arbitrary first users are not used.

## Endpoint classification and KAN-52 policy

### Auth

- `POST /api/auth/login`: authenticate a User, load every TenantMember, select one active organization.
- `POST /api/auth/logout`: unchanged session clearing.
- `POST /api/organizations/active`: membership-validated active organization switch.

### Tenant-level

- `GET /api/organizations`: only organizations belonging to the current User.
- `GET/PATCH /api/organization`: active organization OWNER only.
- `GET/POST /api/organization/members`: active organization OWNER only; POST is exact registered-email lookup only.
- `PATCH/DELETE /api/organization/members/:userId`: OWNER only; last-owner invariant; deletion removes membership and same-tenant MapMember rows, never User.
- `POST /api/maps`: OWNER only.
- `GET /api/maps`: OWNER sees all active-organization maps; MEMBER sees assigned maps only.

### Map-level

All routes below derive Tenant from the Map/resource and require active-organization membership. OWNER inherits access without a MapMember; MEMBER additionally requires MapMember EDITOR.

- `GET/PATCH/DELETE /api/maps/:mapId` (DELETE is OWNER only)
- `POST /api/maps/:mapId/publish`
- `PATCH /api/maps/:mapId/branding`
- `GET/POST /api/maps/:mapId/floors`
- `PATCH /api/maps/:mapId/floors/reorder`
- `PATCH/DELETE /api/maps/:mapId/floors/:floorId`
- `PATCH/DELETE /api/maps/:mapId/floors/:floorId/georeference`
- `GET/POST/PATCH/DELETE /api/maps/:mapId/floors/:floorId/decorations/**`
- `GET/POST/PATCH/DELETE /api/maps/:mapId/categories/**`
- `POST /api/maps/:mapId/category-icons`
- `GET/POST/PATCH/DELETE /api/maps/:mapId/spot-fields/**`
- `GET/POST/PATCH /api/maps/:mapId/spots/**`, including duplicates, bulk, position/PIN, photos, publish, and CSV preview/import/template.
- `GET/POST/DELETE /api/maps/:mapId/editors/**`: OWNER only; assignee must be a TenantMember of the Map's Tenant.

### Media

- `GET /api/media`: OWNER or a MEMBER assigned to at least one map in the active organization; always Tenant-scoped.
- `POST /api/uploads/image`: same policy; uploaded MediaAsset receives server-derived active tenantId.
- `DELETE /api/media/:assetId`: OWNER only, Tenant-scoped, and existing zero-reference physical-delete guard remains authoritative.
- Map attachment paths first authorize the Map and then resolve the MediaAsset in that Map's Tenant. Cross-tenant asset IDs are rejected.

### Public

- `GET /api/public/:mapSlug` and `GET /uploads/:filename` retain their public contract.
- Public map serialization still requires published Map and Spot records, positioned Spots, and `publicVisible` field definitions. KAN-52 does not broaden public data.

### Supporting service

- `GET /api/geocode`: authenticated; no tenant data is returned or mutated.

## UI audit

The existing admin navigation contained only Dashboard. Dashboard listed every Map for `session.user.tenantId` and always showed Map creation. Map settings exposed all edits equally. KAN-52 adds a compact organization switcher only for multi-organization Users, owner-only organization settings/members navigation, role-aware map creation/empty state, owner-only editor assignment, and owner-only map deletion. Server authorization remains the source of truth.

## Security notes

- Active tenantId in the session is only a selection hint; every sensitive handler revalidates TenantMember in the database.
- Map/resource tenantId is resolved from the resource, not accepted from request bodies.
- Unauthorized map/resource lookups return the existing not-found response to avoid disclosing IDs.
- There is no global user directory, partial email search, autocomplete API, invitation, email delivery, or account creation.

