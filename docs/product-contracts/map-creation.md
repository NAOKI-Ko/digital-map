# Map Creation Contract

Date: 2026-09-13

## Type selection

New Map creation begins with type selection. `イラストマップ` is enabled. `リアルマップ` is visible but disabled and clearly marked `今後対応予定`.

Real/GEO Map schema, APIs, editor, viewer, placement, and publication are not implemented in Phase 1. Illustration and Real Map creation are conceptually separate flows. IMAGE Maps must not be modeled as switching backgrounds to GEO while sharing stored Spot geographic coordinates.

## Illustration creation and setup

Initial Illustration Map creation asks only for Map name and the public slug/URL setting according to the current product pattern. It creates the Map shell and enters setup.

Setup shows progress/actions for:

1. `イラストを登録`
2. `Categoryを設定`
3. `Spot情報項目を確認`
4. `Spotを登録`

Later optional settings are georeference, organization/logo, and Decoration. Illustration setup works without georeference. Spot Field defaults are generated automatically rather than designed during initial creation.

## Category templates

Do not create a large fixed category set automatically. Offer opt-in tourism candidates: 観光, 飲食, 買い物, 宿泊, 交通, トイレ, 駐車場, plus custom Category creation. Selected candidates become ordinary editable/deletable Categories subject to normal usage rules.

## Decoration

Decoration is a non-informational visual object on an IMAGE Floor, not a Spot. It uses Tenant Media Library assets and IMAGE-relative x/y, relative size, rotation, and layer order. It supports place, drag, aspect-preserving resize, rotate, forward/back within the Decoration layer, duplicate, and instance deletion.

Layering is base illustration, Decoration, Spot PIN, selected PIN/application UI. Decoration order cannot cover PINs. Public Decoration is non-interactive with no detail or click action. Georeference changes do not move it; illustration replacement preserves relative values without content correction.

GEO Decoration, text, animation, click actions, grouping, layer folders, and zoom-conditional visibility are excluded.
