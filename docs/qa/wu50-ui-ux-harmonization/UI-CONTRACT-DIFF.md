# WU-50 UI contract diff

Base: `a762e254c5fdc7ea60d2e997b8a517b5897955f4`

## Preserved product contract

- The repository still exposes one Map per Tenant and keeps the workspace switcher as the top-level Tenant context.
- All domain fields, routes, API handlers, RBAC checks, persistence flows, upload/media behavior, publication behavior, analytics, audit, revision, editor assignment, localization, PDF and public-map capabilities remain present.
- Spot `x`/`y` remains the Illustration Map PIN position. Existing `lat`/`lng` is now editable as a paired real-world coordinate in the Spot form.
- Illustration Map is the active workspace. Real Map is shown only as disabled `準備中`; no unsupported renderer or switch was introduced.
- Database schema, migrations, server code, shared schemas, dependency manifests and lockfile are unchanged.
- The page-route set and API route set are unchanged.
- No `WU49_UI_ALIGNMENT_EXCEPTION` was required.

## Approved presentation removals

| Removed control | Replacement | Contract effect |
| --- | --- | --- |
| Map-type choice during creation | Illustration Map is created directly; Real Map is described as forthcoming | Removes an obsolete choice only |
| Dashboard Map list for a one-Map workspace | Direct workspace landing; zero-Map onboarding remains | Removes duplicate navigation only |
| Sidebar Map selector | Read-only current Map context beneath the workspace selector | Removes duplicate context selection only |
| Mobile public-map `+` / `-` controls on coarse pointers | Pinch/gesture zoom remains | Removes redundant mobile controls only |

No capability, field, data, route, authorization rule or persistence flow was removed.

## WU-49 UI alignment proof

- `one Tenant : one Map`: the dashboard automatically opens the single accessible Map; it does not offer a second-Map CTA after creation.
- Workspace switcher: exactly one Tenant switcher is exposed by the admin shell.
- Map selector: removed from the shell; the current Map is read-only context.
- View navigation: Illustration is active; Real is disabled and labelled `準備中`.
- New Map: no Illustration/Real product-type decision is requested.
- Coordinates: latitude and longitude are both editable, require each other, enforce geographic ranges, and remain distinct from Illustration `x`/`y`.
- Terminology: user-facing core screens consistently use マップ、スポット、カテゴリー、装飾 and workspace language.
- Billing: no billing or plan behavior was added.

## Screen treatment

All 35 Vue page routes remain. The global tokens, input treatment, admin shell and shared primitives provide the common visual layer. Direct page changes were limited to screens whose hierarchy, workspace model, editor geometry, coordinate editing or terminology needed explicit correction; untouched screens inherit the normalized foundation without semantic changes.

