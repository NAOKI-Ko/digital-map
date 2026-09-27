# WU-61 scope and route inventory

Base `52ef4ce288913986c352c17f06471afd658bf172` (WU-60 PR #10 merge). Post-merge Verify `36358563414` passed. No route move, API/state-machine change, Prisma change, or public visual redesign is planned.

| Route / surface | Primary parent | Current wording / return at baseline | Target contract | Finding |
|---|---|---|---|---|
| `/admin/maps/:mapId` | Workspace Home | private badge `下書き`; settings/edit links | Map visibility `公開中`/`非公開`; direct publication destination | UX-010 |
| `/admin/maps/:mapId/publish` | Operations / Publish | `最新`, `リリース`, private `下書き`; Back to Settings | distinguish editing, visible/retained release, history; named Map Home return | UX-010, UX-007 |
| `/admin/maps/:mapId/paper` | Operations / Paper | list and create entry | canonical Paper parent; source qualifier where shown | UX-006, UX-010 |
| `/admin/maps/:mapId/paper/new` | Paper list | `現在の編集内容`; `← 紙マップ一覧` | `編集中の内容`; named list return | UX-010, UX-007 |
| `/admin/maps/:mapId/paper/:paperMapId` | Paper list | `現在の公開版` even when private; technical ID exposed; `← 紙マップ一覧` | state-aware source labels and availability; named list return | UX-010, UX-007 |
| `/admin/maps/:mapId/paper/request` | Paper item when valid, else list | `紙マップに戻る` always points to list | validated item context, named fallback | UX-007 |
| `/admin/maps/:mapId/spots` | Map / Spots | `公開`/`下書き` spot flag | `公開対象`/`公開対象外`; list retains filters | UX-010 |
| `/admin/maps/:mapId/spots/:spotId` | Spot list | prefix-only `returnTo` validation; named list Back | validated same-Map list query or canonical list | UX-007, UX-010 |
| `/admin/maps/:mapId/spots/new` | Spot list, PIN override | existing floor-checked camera context; PIN return | retain validated PIN context; list fallback | UX-007 |
| `/admin/maps/:mapId/categories` | Categories | Back to Settings | first-class Map destination; Map Home fallback | UX-006, UX-007 |
| `/admin/maps/:mapId/fields` | Illustration Map / Fields | Back to Settings | retain sibling Settings return; label as Fields owner | UX-006 |
| `/admin/maps/:mapId/floors` | Illustration Map / Floors | Back to Settings | sibling Settings return; Floors owns child tools | UX-006 |
| `/admin/maps/:mapId/floors/:floorId/decorations` | Floors | `フロア管理に戻る` | retain named canonical parent | UX-006, UX-007 |
| `/admin/maps/:mapId/floors/:floorId/georeference` | Floors, PIN override | `from=editor` alone selects PIN return | validate floor belongs to Map and PIN origin; Floors fallback | UX-007 |
| `/admin/maps/:mapId/editors` | Team / Map Editors | Back to Settings; Settings eyebrow | Team ownership; contextual Settings link retained | UX-006, UX-007 |
| `/admin/maps/:mapId/revisions` | Team / Revisions | Spot subnav and Back to Spots | Team primary; Spot shortcut clearly contextual | UX-006, UX-007 |
| Sidebar | cross-domain primary navigation | Categories/Editors/Revisions destinations already exist | preserve WU-51 structure and route active state | UX-006 |
| AdminSubnavigation | route-backed sibling navigation | Revisions appears as Spot sibling | make approval entry an explicitly contextual shortcut | UX-006 |
| Map Home and Settings links | contextual entry | publication, categories, editor links | name destination and preserve one owner | UX-006, UX-010 |

Additional contextual links inspected: PIN → Spot New, PIN → Georeference, Spot list → Spot detail, Paper Edit → design request. Direct entry falls back to the primary parent. Dirty guards from WU-59 take precedence over Back and contextual links.
