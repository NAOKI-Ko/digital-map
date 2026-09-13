# Phase 1 Feedback Contract

Date: 2026-09-13

## PIN priority, size, and presets

`importance = normal | featured` is display priority and not visual size. Size is a separate `small | medium | large` preset; existing Spots default to medium and arbitrary pixel sizes are forbidden.

Visibility priority is `selected > active category-filter match > featured > normal`. Selected is always visible. Active filter matches bypass ordinary zoom suppression as far as possible. Featured survives before normal. Far/mid/near density behavior uses clear visible/hidden decisions rather than opacity fading; same-priority culling is deterministic. Thresholds and collision constants are internal and not exposed to administrators. Category filter retains OR semantics.

Tourism presets expand the existing Material Symbols/preset architecture and preserve old IDs/normalization. Groups cover 観光, 寺社/歴史, 文化施設, 自然/公園, 写真スポット, 駅, バス, 駐車場, トイレ, 飲食, カフェ, 買い物, 宿泊, 案内所, 救護/医療, and suitable Wi-Fi/設備. Unsupported exact glyphs use the closest supported symbol without breaking rendering. Custom PIN is unaffected.

## Category operations

Category edit shows usage count and an inspect/filter action. Bulk Category UI is absent with no selection. With multiple selected Spots, one operation chooses exactly one Category and either Add or Remove, shows target count/category/operation, and requires confirmation. Both operations are idempotent and preserve other categories; zero categories is valid. Cross-Map categories are rejected. Multi-Spot replacement-all is not a normal flow.

## Spot list and duplicates

Large-list navigation provides real-time name search; Category, positioned/unpositioned, and published/unpublished filters; and updated-newest, name, or created-newest sort. Pagination versus virtualization is implementation-defined. Duplicate names remain legal and rows/results disambiguate with Category, Floor, and placement state. Selecting a map-linked Spot visually identifies its PIN without moving it. Search, filters, sort, and scroll survive edit round-trips, bulk operations, and saves.

Create/update warns non-blockingly for same-name Spots in the same Map, excluding the current record and unrelated Maps, and identifies matches with Floor/Category/placement context. Users may explicitly continue; records are never merged or renamed automatically. CSV duplicate handling is the same warning concept.

## Zoom stability

Use supported MapLibre configuration to keep double-click zoom only if deterministic at/near max zoom. If composition makes it unstable, disable double-click zoom and retain explicit controls. Never build a custom double-click engine. Document the chosen branch and evidence; touch behavior must not regress.

## Dirty-state protection and save feedback

Editable admin forms guard dirty internal navigation, cancel/back, and context switches with application dialogs offering stay/edit or discard/leave. Clean forms do not prompt; successful save clears dirty state. Native `beforeunload` is allowed for refresh/tab-close limitations, but native alert/confirm/prompt is not used for ordinary application actions.

Save feedback uses one application pattern with distinguishable saving, success, and failure states. Create and update success is visibly announced, failure never claims success, and double-submit is prevented. Apply to touched Spot, Floor, Category, Map settings, and field configuration flows with accessible live/status semantics where supported.

## Illustration selection and georeference feedback

Selected Floor images replace the chooser area with an actual preview, provide `画像を選び直す`, and reset after successful creation. Replacing georeferenced artwork warns that alignment should be reviewed. Georeference edit/reset/remove behavior follows the IMAGE spatial contract.

## Mobile regression boundary

The existing public mobile Map remains map-first. Bottom Sheet, bottom-oriented Category controls, right-side controls, gestures, Media/Field content, and selected-Spot accessibility must continue working. This is regression-only; no independent KAN-16 redesign or expansion is authorized.

## Explicit Phase 1 exclusions

Real/GEO Maps remain disabled and unimplemented. There is no automatic image-content alignment, custom-field select/multi-select/date/time, CSV update/upsert/delete/sync, GEO Decoration, seek-bar mandate, browser-alert-based save UX, free georeference transform, Map-private Custom PIN library, or user-facing numeric density tuning.
