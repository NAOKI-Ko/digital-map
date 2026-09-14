# Spot Field Contract

Date: 2026-09-13

## Structure

Spot name is always required, cannot be removed, and is not a custom field. Photos are a dedicated Media section, not Field Definitions. Category, PIN/design/size/importance, placement, and publication are separate controls and never Field Definitions.

Description is a standard configurable field rendered in a dedicated introduction area rather than a generic key/value row. It may be enabled/disabled, public/internal, and included in CSV.

Standard semantic keys are exactly `description`, `address`, `phone`, `website`, `hours`, and `holiday`. Semantic keys never change, although a Map may customize labels such as `hours` to `開館時間`. Common standard values remain ordinary Spot columns where appropriate; they are not all converted to EAV. Missing columns such as address and website are added.

Phase 1 custom types are exactly `single_line_text`, `multiline_text`, `number`, `url`, and `boolean`. Select, multi-select, date, and time are excluded. Custom values use a dedicated relation/table.

## Map-scoped definitions

Each FieldDefinition supports kind (standard/custom), immutable standard semantic key, label, type, enabled, publicVisible, required, and order. Map A configuration is independent of Map B.

- Disabled definitions retain existing values, disappear from normal admin input, and are never public.
- `enabled = false && publicVisible = true` is invalid.
- Internal values remain available to administrators but never appear publicly.
- Blank values do not render publicly.
- A used Custom Field cannot change type or be physically deleted; it may be disabled.
- Setting `required = true` later does not auto-unpublish existing Spots. Required validation applies to new Spot creation, the next save of an edited Spot, and CSV import.

New Maps automatically receive enabled defaults for description, address, hours, holiday, and website; phone is initially disabled.

## Admin and public presentation

The Field Definition is the single source of truth. Admin form sections are: Spot name; Media; Description; ordered Spot information; Category; PIN/map-display controls; publication controls. Enabled standard/custom fields render dynamically.

Public detail order is: name and Category; media area when images exist; enabled/public/nonblank Description; enabled/public/nonblank standard and custom rows in field order; appropriate actions such as website. Disabled, internal, blank, or unlabeled rows are not emitted.

## CSV

Legacy v1 CSV targets exactly one Floor and remains create-only. Every v1-created Spot is unpositioned and unpublished. v2 exports every positioned/unpositioned and published/unpublished Spot on one selected Floor, independent of list filters. A v2 row with `__spotId` updates that exact Spot; a blank ID creates a Spot. Missing rows never delete or synchronize Spots.

The UTF-8 BOM template is generated from the current Map Field Definitions and includes Spot name, enabled standard fields, enabled custom fields, categories, and enabled Description. It excludes photos, PIN, PIN size, importance, position, and publication. Mapping is stable and unambiguous and never depends on duplicate user-facing labels.

The reserved v2 columns are `__csvVersion`, `__schemaVersion`, `__spotId`, and `__rowVersion`. Users must not edit them. Schema tokens cover stable Field Definition identity/type/enabled/required and locale configuration without conflicting on label-only changes. Row tokens cover all enabled CSV-editable standard/custom values, ja/en translations, and Category membership. Tokens are recomputed in the final serializable transaction.

Categories may reference multiple existing categories but are never created. On update, the CSV value is the desired final set and blank removes all memberships. Unknown categories are errors. Missing required values, incompatible custom types, duplicate/unknown/wrong-Floor IDs, and structurally invalid rows are errors; duplicate names are warnings and remain legal. A conflict or error rejects all writes. UTF-8 BOM/RFC4180 output protects formula-like cells with a reversible apostrophe convention (`=`, `+`, `-`, `@`; an original leading apostrophe is doubled).

UPDATE may change name, enabled standard/custom fields, ja/en translations, and Categories only. Position/Floor/georeference, publication, PIN appearance, importance/size, Media/photos, and Decoration remain unchanged. Increasing `Spot.liveVersion` preserves pending revisions and makes their later approval hit the existing stale-revision conflict. Immutable public releases remain unchanged until the next publish.
