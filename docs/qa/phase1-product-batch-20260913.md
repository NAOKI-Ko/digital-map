# Phase 1 Product Batch — Human QA Handoff

Date: 2026-09-13  
Branch: `feat/phase1-product-foundations-20260913`

## Preconditions

Use a disposable QA database migrated through all `20260913*` migrations. Seed or create two Tenants, two Maps in Tenant A, and one Map in Tenant B. Keep a database backup. Run `pnpm audit:image-spatial-migration` before applying `20260913010000_image_spatial_model`; unresolved rows must be corrected or explicitly unpositioned, never silently clamped.

The migration/audit normalization epsilon is exactly `1e-12`. Values within that distance of 0 or 1 snap to the boundary. Values farther outside `[0,1]`, including `-1e-10` and `1.0000000001`, are unresolved and must make preflight fail.

## IMAGE positioning and georeference

1. Existing PIN migration: capture several PIN contact points before migration, run preflight/migration, reopen the same viewport and confirm drift is no more than one CSS pixel. Confirm migrated `x/y` are complete and within `[0,1]`.
2. Add georeference after PINs: place PINs on an ungeoreferenced Floor, save A/B, and confirm their illustration-relative positions do not change. Current-location eligibility should become available.
3. Modify georeference: change A/B and confirm the real-world overlay changes while stored Spot `x/y` and Decoration values remain identical.
4. Remove georeference: use the confirmation dialog and confirm fallback rendering still shows the illustration/PINs while current location disappears. Spot `x/y` must remain unchanged.
5. Replace illustration: select a different asset/aspect ratio and confirm Floor identity, Spot placement, publication, PIN settings, Decoration, and A/B values are preserved. Confirm the alignment-review warning; no content-based correction should occur.
6. Position editor: test new placement, reconfiguration, Cancel, Save, boundary click/drag, and unplace. Cancel must not persist; unplace must retain the Spot and set both coordinates to null.

## Media Library

1. Upload once: upload an image through a common picker and confirm it appears in the Tenant library with dimensions and filename.
2. Reuse in another function: reuse that asset as a Spot photo and Decoration or Custom PIN without uploading new bytes.
3. Reuse in another Map: in a second Map owned by the same Tenant, select the same asset from `すべて` and confirm it works.
4. Cross-Tenant denial: attempt to list or assign the asset from Tenant B using both UI and a modified request. Expect no listing and an API rejection.
5. Referenced delete denial: inspect usage, attempt asset deletion while referenced, and expect rejection with usage context. Detach one consumer and confirm other consumers remain. Delete only after usage reaches zero.
6. Legacy compatibility: open records backed only by retained URL fields and confirm their images still render.

## Spot fields

1. Enable/disable: disable a populated standard/custom field. Confirm the stored value remains, normal admin input hides it, and public output omits it. Re-enable and confirm the value returns.
2. Public/internal: mark a field internal and confirm admins can edit it but the public API/detail never exposes it.
3. Custom field: create and save each supported type: single-line text, multiline text, number, URL, and boolean. Confirm select/multiselect/date/time are unavailable.
4. Required: mark a field required. Confirm old records are not auto-unpublished, but new create, next edit save, and CSV import reject a blank value.
5. Rename standard label: rename `hours` to `開館時間`; confirm stored meaning/CSV key remains stable while admin/public labels change.
6. Used custom field: confirm its type cannot change and it cannot be deleted; disabling remains available.

## CSV import

1. Valid import: download the current UTF-8 BOM template, populate enabled standard/custom fields and existing Categories, preview, then import. Confirm every row is created once, unpositioned and unpublished.
2. Warning-only import: use existing and within-file duplicate names. Confirm warnings identify rows, do not block, and the explicit import succeeds.
3. Error blocking: test unknown Category, missing required field, incompatible number/URL/boolean, malformed structure, and duplicate stable headers. Confirm any error disables/blocks import.
4. Transaction rollback: create a database-side failure on a later row in a disposable DB and confirm zero rows persist.
5. Confirm import never updates, upserts, deletes, synchronizes, creates Categories, or imports photos/PIN/position/publication.

## Map creation

1. Illustration flow: select `イラストマップ`, enter name/slug, create, and confirm a visible success message on setup.
2. Confirm setup offers Illustration, optional Category templates/custom Category, generated default Spot fields, and Spot registration.
3. Disabled Real Map: confirm `リアルマップ` is visible, disabled, and labeled `今後対応予定`; no Real/GEO persistence/API/viewer is reachable.
4. Optional georeference: complete setup without A/B and confirm illustration display and PIN placement work while current location does not.

## Decoration

1. Place a Tenant library asset, drag it, resize it with aspect ratio preserved, rotate it, and save.
2. Change forward/back order, duplicate the instance, and delete only one instance. Confirm the MediaAsset remains.
3. Public rendering: confirm Decoration is noninteractive and always below every normal/featured/selected PIN and application control.
4. Change/remove georeference and replace illustration; confirm normalized Decoration values do not change.

## PIN visibility and presets

1. Set normal and featured Spots at the same Floor. At far/mid/near zoom confirm featured survives before normal with discrete visibility and no opacity fading.
2. Select a suppressed normal Spot and confirm it becomes visible and remains clickable.
3. Apply Category filters and confirm matching Spots bypass normal suppression; OR semantics remain intact.
4. Check small/medium/large presets independently of normal/featured and confirm the marker contact point stays fixed.
5. Browse tourism preset groups, old preset IDs, and a missing/unknown glyph. Confirm fallback works and Custom PIN remains unchanged.

## Category bulk operations

1. With no Spot selected, confirm bulk Category controls are absent.
2. Select multiple Spots and add exactly one Category after confirmation. Confirm existing unrelated Categories remain and repeated Add is idempotent.
3. Remove exactly one Category and confirm others remain; repeated Remove succeeds and zero-Category result is legal.
4. Modify a request to use another Map's Category or Spot and confirm the whole operation is rejected before transaction.

## Spot list and duplicates

1. Exercise debounced name search, Category/Floor/position/publication filters, and all three sorts. Confirm URL state updates.
2. Open a detail and return; confirm filters, sort, scroll and editor camera context survive.
3. Create two same-name Spots in one Map. Confirm a warning lists Floor, Category and placement state, Cancel returns to input, and explicit Continue legally saves the duplicate.
4. Edit a Spot without another duplicate and confirm it does not warn about itself. Same name in another Map must not warn.

## Dirty guard, save feedback, mobile regression

1. Modify Spot, PIN design, Map name and Map creation forms, then navigate away. Confirm application Stay/Discard dialog; clean or successfully saved forms must not prompt.
2. For Spot, Floor, Category, Map settings/branding and Spot field saves, observe distinct saving, success and error feedback. Confirm failure never leaves a success message and repeat submit is disabled while saving.
3. On a narrow mobile viewport, confirm the public Map remains map-first; Category controls stay at the safe-area-aware bottom; controls remain usable at the right.
4. Tap a PIN and expand/collapse the Bottom Sheet. Confirm map pan/pinch outside the sheet still works, photos and dynamic information fields render, and selected/filter-matched PINs remain accessible at far zoom.

## Expected exclusions

Real/GEO Map implementation, automatic image-content alignment, select/multiselect/date/time custom fields, CSV update/upsert/delete/sync, GEO Decoration, arbitrary PIN pixel sizes, and custom PIN crop editing are not part of this batch.
