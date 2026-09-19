# WU-50 pre-change UI contract inventory

Captured from `a762e254c5fdc7ea60d2e997b8a517b5897955f4` before implementation. This document freezes discoverable information, fields, actions, permissions, endpoint usage, and responsive behavior. Route paths are derived from the 34 Vue page files under `app/pages`.

## Global contracts

- Admin pages use authenticated layout/middleware except public, auth, verification, invitation, and password-reset entry points.
- Owner capabilities include workspace/map management, publishing, revisions, analytics, members, audit, fields, categories, floors, positioning, and configuration. Map Editor and Spot Editor restrictions remain enforced by server permissions and conditional controls.
- Public data is published Snapshot data only. Admin mutation endpoints and methods listed below are frozen.
- Dirty guards, focus management, explicit destructive confirmation, Save feedback, responsive drawers/sheets, i18n, current-location behavior, and one-overlay-at-a-time behavior are capabilities, not decoration.

## Public and legal routes

| Route | Information / fields | Persistent actions and API | Immediate controls / destructive actions | Responsive and access contract |
| --- | --- | --- | --- | --- |
| `/[mapSlug]` | Map name, organization/branding, floors, categories, published spots, full spot detail fields/media, website/SNS/legal links | Read `GET /api/public/:mapSlug` with locale | Floor, category filters, locale, info, PIN selection, detail close, map pan/zoom/rotate, geolocation | Public; mobile `100dvh`, sheets and bottom category rail; desktop overlay/card; one overlay at a time; focus returns after close |
| `/` | Product identity, value proposition, entry links | None | Navigate to login/signup | Public responsive landing page |
| `/terms` | Full terms content and revision/effective information | None | Legal navigation | Public readable layout |
| `/privacy` | Full privacy content and contact/handling information | None | Legal navigation | Public readable layout |

## Authentication and onboarding

| Route | Information / fields | Persistent actions and API | Controls / restrictions | Responsive contract |
| --- | --- | --- | --- | --- |
| `/admin/login` | Email, password, validation/error, legal links | Login through `POST /api/auth/login` | Submit, signup/reset links | Public centered auth task; accessible errors |
| `/signup` | Email, password, workspace/organization name, terms/privacy consent | `POST /api/signup` | Submit and verification status/link | Public centered task |
| `/signup/verify` | Verification state/token result | `POST /api/signup/verify` | Verify/continue | Public status task |
| `/admin/signup/complete` | Terms/privacy consent for authenticated completion | `POST /api/signup/complete-existing` | Submit | Authenticated; centered task |
| `/invite/accept` | Invitation token context and optional password | `POST /api/auth/invitations/accept` | Accept invitation | Public token-bound flow |
| `/reset-password` | Email request or new password according to token | `POST /api/auth/password/reset-request`; `POST /api/auth/password/reset` | Request/reset | Public centered task; generic request response avoids account discovery |
| `/admin/account/password` | Current password, new password, logout consequence | `POST /api/auth/password/change` | Change and logout | Authenticated; account owner only |

## Workspace, dashboard, and map lifecycle

| Route | Information / fields | Persistent actions and API | Controls / role restrictions | Responsive contract |
| --- | --- | --- | --- | --- |
| `/admin/dashboard` | Accessible maps, active organization/workspace, empty/error states | Reads `GET /api/maps`, `GET /api/organizations` | Select map, create map, retry (pre-WU-50 multi-map presentation) | Authenticated; role-filtered accessible data |
| `/admin/maps/new` | Pre-WU-50 illustration type choice; map name and public slug | `POST /api/maps` with compatible map type | Choose/back, create; dirty guard | Authenticated owner creation; WU-50 must remove type-choice UI without changing request semantics |
| `/admin/maps/[mapId]` | Home summary, readiness/status, recent analytics/operations and task links | `GET /api/maps/:mapId/home-summary` | Navigation to existing capabilities | Permission-filtered map home |
| `/admin/maps/[mapId]/setup` | Setup progress, floors, categories, suggested category templates | Reads map/floor/category endpoints; creates categories with `POST /api/maps/:mapId/categories` | Template/custom category selection, continue navigation | Authenticated authorized map users |
| `/admin/maps/[mapId]/settings` | Basic name/slug/description, branding, languages/translations, SEO, team link, danger zone | `GET/PATCH/DELETE /api/maps/:mapId`; `PATCH /branding`, `/translations`, `/languages`, `/seo` | Section navigation, media picker, language add/remove; destructive map delete with confirmation; team/delete permission-gated | Forms remain usable on narrow screens; every setting remains discoverable |

## Illustration map editing

| Route | Information / fields | Persistent actions and API | Controls / restrictions | Responsive contract |
| --- | --- | --- | --- | --- |
| `/admin/maps/[mapId]/editor` | Floor artwork, all spots, selected spot identity/state, candidate and saved PIN position, address helper, PIN design including icon/color/size/importance | Reads floors/spots; `PATCH/DELETE /api/maps/:mapId/spots/:spotId/position`; design component uses `PATCH .../design` | Floor/spot selection, position/design modes, Save/Cancel, unassign confirmation/navigation; editor permissions | Desktop canvas plus inspector; mobile retains all modes without horizontal overflow; dirty guard |
| `/admin/maps/[mapId]/floors` | Floor name, image, order, visibility/details | `GET/POST /floors`; `PATCH/DELETE /floors/:floorId`; `PATCH /floors/reorder` | Add/edit/reorder/delete, image upload; destructive confirmation | Authorized map management; list/forms responsive |
| `/admin/maps/[mapId]/floors/[floorId]/georeference` | Illustration and real-map reference A/B points, address search, validation and saved state | `PATCH/DELETE /floors/:floorId/georeference` | Place/reset reference points, Save, destructive remove | Authorized users; two-point model and camera/geolocation semantics frozen |
| `/admin/maps/[mapId]/floors/[floorId]/decorations` | Artwork canvas, all decoration assets, selected decoration size/rotation/order | `GET/POST /decorations`; `PATCH/DELETE /decorations/:id` | Drag, select, resize, rotate, layer, duplicate, delete; media picker | Direct manipulation remains available on desktop/mobile |

## Spots and shared data

| Route | Information / fields | Persistent actions and API | Controls / restrictions | Responsive contract |
| --- | --- | --- | --- | --- |
| `/admin/maps/[mapId]/spots` | Spot rows, publish/placement/category state, search/filter/sort/pagination, bulk selection | `GET /spots`; `PATCH /spots/bulk` | Filters, row navigation, bulk actions, create/import links | Map/owner access; filters are immediate |
| `/admin/maps/[mapId]/spots/new` | Name, required floor, categories, description, semantic fields (hours/holiday/phone/address/website), every custom field, duplicate candidates | `POST /spots`; duplicate check `POST /spots/duplicates` | Create/cancel, duplicate dialog | Authorized creator; dirty guard; all fields retained |
| `/admin/maps/[mapId]/spots/[spotId]` | Same full Spot field set and values, translations, photos/media, publish state, assignment link | `GET/PATCH /spots/:spotId`; translation/photo/publish endpoints | Save/cancel, duplicate resolution, photo management, publish actions | Permission-filtered controls; dirty guard |
| `/admin/maps/[mapId]/spots/[spotId]/assignee` | Current assignee, eligible user, invitation status/link | `PUT/DELETE /editor`; `POST /editor/invite` | Assign, remove, invite | Owner/authorized member management only |
| `/admin/maps/[mapId]/spots/import` | Floor selection, CSV text/file preview, per-row validation, import result | `POST /spots/import/preview`; `POST /spots/import` | Preview, correct, import | Existing CSV contract and floor requirement frozen |
| `/admin/spot-editor` | Assigned Spot list and status | `GET /api/spot-editor/spots` | Open assigned Spot | Spot Editor sees assigned data only |
| `/admin/spot-editor/[spotId]` | Editable-field allowlist, draft values, photo upload, revision status/comments | `GET/PUT /api/spot-editor/spots/:spotId/revision`; `POST .../photos` | Save/submit revision, upload photo | Spot Editor cannot reach forbidden fields or cross-tenant Spot |

`SpotForm` pre-change fields are name, floor, zero-or-more categories, description, semantic fields, and all active custom fields. WU-50 adds already-existing `lat`/`lng` to this UI without exposing illustration x/y; nullable-pair and range validation remain server-authoritative.

## Configuration and operations

| Route | Information / fields | Persistent actions and API | Controls / role restrictions | Responsive contract |
| --- | --- | --- | --- | --- |
| `/admin/maps/[mapId]/categories` | Category name, icon, order, Spot count, English name | `GET/POST /categories`; `PATCH/DELETE /categories/:id`; `PATCH /translations` | Add/edit/reorder/delete; delete blocked when in use | Workspace-shared language after WU-50; behavior unchanged |
| `/admin/maps/[mapId]/fields` | Every field definition: label, type, required/active/editable properties, order | `GET/POST /spot-fields`; `PATCH/DELETE /spot-fields/:id`; `PATCH /reorder` | Add/edit/reorder/delete/deactivate with safeguards | Owner/config permission; no definition loss |
| `/admin/maps/[mapId]/editors` | Assigned Map Editors and eligible members | `GET/POST /editors`; `DELETE /editors/:userId` | Add/remove editor | `canManageEditors` permission |
| `/admin/maps/[mapId]/publish` | Publication readiness, validation blockers, releases/current release, public URL | `POST /publish`; `GET /releases`; `POST /releases/:id/rollback` | Publish/republish/rollback with confirmation/status | Owner/authorized publish permission; release semantics frozen |
| `/admin/maps/[mapId]/revisions` | Spot Editor revisions, diffs/status/reason | `GET /revisions`; `POST /revisions/:id/approve`; `POST /reject` | Approve/reject, rejection reason | Reviewer permissions only |
| `/admin/maps/[mapId]/analytics` | Date range, timezone, totals, daily views, top Spots | `GET /analytics?start&end` | Immediate date query/refresh | Authorized read-only analytics; counting frozen |
| `/admin/organization` | Organization/workspace profile, members/roles, pending invitations | `GET/PATCH /api/organization`; member and invitation POST/PATCH/DELETE endpoints | Edit, invite, role change, revoke/remove with confirmation | Owner-only mutations; legal copy may retain organization |
| `/admin/organization/audit` | Audit event history, actors, targets, timestamps, cursor | `GET /api/organization/audit` | Load more | Owner/audit permission; append-only semantics |

## Global admin navigation contract

Pre-change navigation reads `/api/organizations`, `/api/maps`, and `/api/spot-editor/spots`, persists active context with `POST /api/organizations/active`, and exposes organization plus map selectors, desktop rail/sidebar, and mobile drawer. WU-50 may remove the one-value map selector and map-list navigation, but it must retain the workspace switcher, every destination, role filtering, dirty-state confirmation, keyboard/focus behavior, and hard navigation to `/admin/dashboard` after a workspace switch.

## Frozen endpoint and route assertions

- Route count before change: **34**. No route may be removed or renamed.
- Major UI endpoint/method semantics above must remain unchanged.
- Prisma, migrations, `server/**`, and `shared/schemas/**` are protected.
- Public Snapshot, RBAC, audit, analytics, CSV, revision, media, publication, camera/geolocation, illustration position, and lat/lng validation semantics are frozen.
