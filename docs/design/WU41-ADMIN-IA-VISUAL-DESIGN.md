# WU-41 Admin IA / Visual Design

Date: 2026-09-15  
Base: `e75325a11f66b226962307ed41e2584452b55fcc`

## Product intent

The admin shell must make the active Organization and, on Map routes, the current Map obvious. It should put frequent operational destinations close at hand without turning the sidebar or Home into a catalogue of every implementation feature. Existing URLs, server authorization, Spot Editor isolation, and edit-flow state remain authoritative.

## Current route map

| Scope | Routes | Current purpose |
| --- | --- | --- |
| Organization | `/admin/dashboard` | Authorized Map list and Map creation entry |
| Organization | `/admin/organization`, `/admin/organization/audit` | OWNER-only settings, members, invitations, and audit |
| Account | `/admin/account/password` | Authenticated user's password change |
| Map | `/admin/maps/:mapId/settings` | Map name, locale, SEO, branding, links to related domains |
| Map | `/admin/maps/:mapId/floors` | Floor and illustration management |
| Floor | `/admin/maps/:mapId/floors/:floorId/georeference` | Two-point georeference flow |
| Floor | `/admin/maps/:mapId/floors/:floorId/decorations` | Decoration editor |
| Map | `/admin/maps/:mapId/editor` | PIN placement editor |
| Map | `/admin/maps/:mapId/fields` | Spot field definitions |
| Map | `/admin/maps/:mapId/categories` | Category management |
| Map | `/admin/maps/:mapId/spots` | Searchable/filterable Spot list |
| Map | `/admin/maps/:mapId/spots/import` | CSV preview/import/export |
| Spot | `/admin/maps/:mapId/spots/new`, `/admin/maps/:mapId/spots/:spotId` | Normal Map-admin Spot create/edit |
| Spot | `/admin/maps/:mapId/spots/:spotId/assignee` | Assignment management |
| Map | `/admin/maps/:mapId/revisions` | OWNER/Map EDITOR review queue |
| Map | `/admin/maps/:mapId/publish` | Publish, releases, share, and PDF |
| Map | `/admin/maps/:mapId/analytics` | Aggregate public analytics |
| Map | `/admin/maps/:mapId/editors` | OWNER-only Map Editor assignment |
| Restricted Spot | `/admin/spot-editor`, `/admin/spot-editor/:spotId` | Assigned Spot submission flow |
| Public | `/:mapSlug`, `/terms`, `/privacy` | Public Map and legal content |

WU-41 adds `/admin/maps/:mapId` as Map Home. No existing route is removed or redirected.

## Final navigation IA

Organization-level destinations:

- Maps: `/admin/dashboard`
- Assigned Spots: `/admin/spot-editor`, shown only when assignments exist
- Organization members/settings and audit: OWNER only
- Account/password: all authenticated users

Map-level destinations, available only when `:mapId` is present in the authorized `/api/maps` response:

- Home: `/admin/maps/:mapId`
- MAP: Map edit, Spot, Category
- Publish and operations: Publish, Analytics
- Team: pending revisions; Map Editors for OWNER only

Map edit route navigation:

- Basic settings: `/settings`
- Floors and illustrations: `/floors`
- PIN placement: `/editor`
- Spot fields: `/fields`

Spot route navigation:

- List: `/spots`
- CSV import: `/spots/import`
- Pending revisions: `/revisions`

Media remains contextual through `MediaPicker`. PDF remains within Publish. Decoration and georeference remain Floor-scoped. Spot assignee remains Spot-scoped.

## Role menu matrix

| Destination | OWNER | assigned Map EDITOR | Spot Editor only |
| --- | --- | --- | --- |
| Organization dashboard | yes | yes | yes |
| Map Home/admin | all active-Tenant Maps | assigned Maps only | no |
| Publish/Analytics/review | yes | assigned Maps only | no |
| Map Editor assignment | yes | no | no |
| Organization members/settings/audit | yes | no | no |
| Assigned Spots | when assigned | when assigned | when assigned |
| Account/password | yes | yes | yes |

Permissions are additive. Navigation is discoverability only; server guards remain authoritative.

## Desktop navigation shell

### Collapsed rail

- Default width: 72px.
- Shows brand/Home, context control, frequent destinations, account, and expand toggle.
- Every icon link/button has an accessible name and hover/focus tooltip.
- Active links use a visible accent indicator and `aria-current="page"`.
- Context tooltip contains both Organization and current Map names.
- Activating context opens an accessible switcher panel; it never authorizes a Map.

### Expanded sidebar

- Width: 256px.
- Pushes/reflows content at large desktop widths.
- Shows Organization selector, authorized Map selector, group names, all permitted items, account, and collapse toggle.
- Presentation preference alone is stored under `adminSidebarExpanded`.

At widths below `lg`, there is no permanent rail. A modal drawer uses the same model and full labels.

## Map Home wireframe

```text
Map name                         [MAPを編集] [公開MAPを見る]
公開中 / 下書き · 最終公開日時

[Spot数] [未配置] [承認待ち] [30日views]

[次にすること: maximum 4]       [最近の重要な操作: maximum 5]
```

The public CTA is rendered only when both published state and a current READY release exist. Home never claims complete audit history and never displays a false unpublished-change state.

## Organization dashboard wireframe

```text
Organization name                         [新しいMap]
アクセスできるMap

[Map name        公開中] [Map name          下書き]
 slug · floors · updated    slug · floors · updated
 [開く]                     [開く]
```

Zero Maps uses a concise onboarding panel. The dashboard does not load Map-specific operational summaries.

## Visual system

- Canvas: `stone-50`; principal surfaces: white.
- Text: `stone-950` primary, `stone-600` secondary.
- Accent: existing terracotta tokens, principally `terracotta-600/700`.
- Success/warning/error colors are semantic and limited to status or feedback.
- Panel radius: mostly `rounded-xl`; controls: `rounded-lg`.
- Border: `stone-200`; shadow: `shadow-sm` only for primary elevated surfaces.
- Main page rhythm uses 4/6/8 spacing increments and compact 14–16px body type.
- Page titles remain 24–30px, never hero-sized.
- Buttons use one primary action per region; secondary, ghost, and destructive variants stay visually subordinate.
- Motion is 150–200ms and disabled under `prefers-reduced-motion`.

## Responsive behavior

- `lg` and above: 72px rail or 256px expanded sidebar, content reflows.
- Below `lg`: sticky top bar and modal left drawer.
- Drawer blocks background interaction, closes on Escape/navigation/backdrop, traps focus, and returns focus to its trigger.
- Controls target at least 44px where practical.
- Content widths remain page-specific; editor surfaces receive the remaining viewport width.

## MapLibre resize behavior

The shell dispatches a presentation-only `admin-sidebar-resize` event during and after desktop width transitions and on resize. `useMapViewer` and the georeference map listen and call `map.resize()`. A `ResizeObserver` on the Map container provides the authoritative fallback. This preserves canvas size, controls, markers, and pointer coordinate conversion for persisted and interactive sidebar states.

## Accessibility behavior

- Labeled navigation landmarks and controls.
- `aria-expanded` and `aria-controls` on sidebar/drawer/context controls.
- `aria-current="page"` on route-backed current links.
- Tooltips available on hover and keyboard focus but never required to operate controls.
- Visible focus using the existing global focus treatment.
- Mobile dialog semantics, Escape, focus trap, background inertness, and focus return.
- Route-backed subnavigation uses ordinary links, not fake ARIA tabs.
- Status meaning is present in text, not color alone.

## Home data and security

`GET /api/maps/:mapId/home-summary?days=30` begins with `requireMapAccess`. It performs fixed-count parallel aggregate queries for Map/release state, Spot counts, pending revisions, views, and five allowlisted Map events. It returns no Audit metadata or Organization-level events and uses `private, no-store` caching.

Recent activity is intentionally a small list of security-safe operational events, not a complete audit record. Actor fallback does not expose email addresses. OWNER-only Audit authorization is unchanged.

## Known constraints and decisions

- URL `:mapId` is the only Map-context authority.
- Organization switching returns to `/admin/dashboard`; stale Map context is discarded.
- No schema migration is required.
- Accurate unpublished-change tracking remains future work.
- Current Audit coverage does not include every routine edit; Home copy must not imply otherwise.
- `/admin/dashboard` remains the Organization-level entry even with one accessible Map.
- Existing deep links, Spot filter query strings, Back/Forward behavior, and dirty-state guards are preserved.

