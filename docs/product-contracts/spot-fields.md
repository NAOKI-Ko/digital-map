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

CSV creates new Spots only and targets exactly one Floor. It never updates, upserts, deletes, or synchronizes. Every imported Spot is unpositioned and unpublished.

The UTF-8 BOM template is generated from the current Map Field Definitions and includes Spot name, enabled standard fields, enabled custom fields, categories, and enabled Description. It excludes photos, PIN, PIN size, importance, position, and publication. Mapping is stable and unambiguous and never depends on duplicate user-facing labels.

Categories may reference multiple existing categories but are never created. Unknown categories are errors. Missing required values, incompatible custom types, and structurally invalid rows are errors; existing or within-file duplicate names are warnings and remain legal. All rows are previewed with totals and row messages. Any error rejects all writes; zero errors permits one transaction with no partial success.
