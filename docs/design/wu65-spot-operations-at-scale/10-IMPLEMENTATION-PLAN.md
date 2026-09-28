# Implementation plan derived from D1–D10

**Design only. No slice was implemented.** Decisions are complete in [00](00-EXECUTIVE-DECISIONS.md), semantics in [02](02-CATEGORY-PIN-MODEL.md), safety in [03](03-BULK-OPERATIONS.md), migration in [08](08-COMPATIBILITY-MIGRATION.md). Do not combine all work into one PR. Rebase the evidence review against current dev when implementation is actually authorized; record base/implementation/evidence/deployed SHAs under repository governance.

## Dependencies and release discipline

A and B can ship independently before schema work. C is a compatible foundation with inheritance activation gated; D depends on C and exposes source/default behavior. E depends on B's scoped command/conflict contract. F can ship after B, but its default-style acceptance requires D. G depends on B's photo read model and completes contextual enrichment/guidance. Each slice is independently testable; source writer safety and reader compatibility in C cannot be postponed until after D activation.

No slice creates Content/Placement separation, a separate PIN entity, Paper templates, visitor layout fixes, a Map preset system or a new publication-intent state. Windows QA items below are **future acceptance plans**, not instructions executed by this design pass. Use disposable data for mutations; read-only baseline checks for Aquarium/Arimatsu unless a later task explicitly authorizes changes. Deployment is never implied by design readiness.

## Slice A — Neutral Spot copy and configured-label fidelity

- **Goal:** address AQUA-010 without retail regression; exact approved copy in [07](07-VOCABULARY.md).
- **Affected files/areas:** `app/components/admin/SpotForm.vue`, `SpotPublishPanel.vue`; `app/pages/admin/maps/[mapId]/spots/new.vue`, `spots/index.vue`; `shared/schemas/spot.ts`; relevant Spot/Fields help. Inspect shared callers before changing validation fallback.
- **Schema impact:** none; field definitions, seed defaults, semantic keys and values unchanged.
- **API impact:** error copy only; local preview may consume already available configured labels. No new mutation semantics.
- **UI impact:** generic name/section/search/help wording and local preview labels; existing hours/holiday defaults preserved.
- **Migration:** none. Do not bulk rename existing Map fields or change canonical CSV headers.
- **Tests:** targeted rendered/copy review for exhibit, utility and shop; meaningful configured-label/error fallback test if wiring changes. Existing form hydration and field tests; no tests mirroring every string.
- **Windows QA:** later check Japanese IME input/validation and desktop/mobile form labels on a disposable retail/facility Map; no QA edits now.
- **Aquarium replay:** read-only confirm Spot labels fit exhibits; Arimatsu still shows configured retail hours. No changes to fixture values.

## Slice B — Structured setup entry and trustworthy factual list

- **Goal:** make current CSV/bulk capability usable from zero Spots, expose missing work without a Wizard, and guarantee selection/filter scope.
- **Affected files/areas:** `app/pages/admin/maps/[mapId]/spots/import.vue`, `spots/index.vue`; `server/utils/spot-csv.ts`; `server/api/maps/[mapId]/spots/import/` (new starter operation alongside existing endpoints); list API; `shared/types/spot.ts`, CSV types; existing bulk API/schema for version checks and truthful result counts.
- **Schema impact:** none; use current versions and photo/field relations. No readiness flag.
- **API impact:** v3 starter output, list effective-photo count and concurrency tokens, optional task counts/filters; existing bulk explicit IDs plus expected versions, server-side transactional revalidation, changed/no-op counts. Preserve bulk cap100. Correct keyword+unpositioned OR composition as scoped list safety work.
- **UI impact:** starter/export distinction, human-name lookup help, post-import summary, factual statuses/task filters, explicit scoped selection/review. No PIN-source controls until D. Filter changes clear selection; failed commands retain it.
- **Migration:** none; export/parser business-column contract remains v3. Legacy endpoint unchanged. Current CSV compatibility preserved under same field/Floor configuration.
- **Tests:** empty Map with configured Floors → starter → 37 filled new rows → preview/apply/export; metadata generated automatically; existing export/update round-trip, v2 existing/v1 rejection, duplicate/unknown Floors/categories, typed/required custom fields, schema/row conflicts, formula escaping, no-delete-by-omission, new unplaced/target-off state. Filter intersection, 100/101 selection scope, stale versions/map isolation, atomic invalid target-on and no-op counts; legacy photo fallback count.
- **Windows QA:** later Excel/UTF-8 Japanese round-trip, duplicate labels and unchanged headers; selection and dialog keyboard at 390/768/1024/1440 px; network failure/conflict feedback on disposable Map.
- **Aquarium replay:** disposable five-Floor/37-row/six-category import, no Detail needed for textual policy; read-only ensure existing Aquarium/Arimatsu exports and statuses unchanged.

## Slice C — Additive appearance semantics and compatible resolver

- **Goal:** implement the [02](02-CATEGORY-PIN-MODEL.md) source/override contract safely before exposing inheritance.
- **Affected files/areas:** future `prisma/schema.prisma` and additive migration (only in implementation task); `shared/schemas/category.ts`, `pin-design.ts`, Spot types/constants; shared/server effective-style resolver; `server/utils/spot.ts`, `public-map.ts`, `public-release.ts`; all Spot create/form/design/bulk/CSV writers, Category delete/update, membership changes and revision approval; MediaAsset usage/deletion checks.
- **Schema impact:** Category nullable full default + revision + asset relation; Spot source mode and nullable source FK with individual compatibility default. No new Placement table. Existing tuple remains available.
- **API impact:** source-aware resolved style and provenance for admin DTOs; atomic source/override mutation; version/dependency checks; block source-invalidating membership/category removal. Public resolved PIN shape remains compatible; release assets materialized from effective source. Old field-only design requests must never silently turn inherited PINs into individual: require explicit source transition or reject with refresh guidance.
- **UI impact:** none activated initially; admin/client readers can render effective style once supplied, while legacy paths remain identical.
- **Migration:** expand-only, existing PINs individual; no inferred sources/defaults. New updated writers explicitly use standard. Keep activation off until all writer entry points enforce invariants. Backup, legacy-output comparisons and rollback rehearsal in disposable DB per [08](08-COMPATIBILITY-MIGRATION.md).
- **Tests:** legacy presets/null fallback/custom/illustration parity; all resolver branches; no-category and multiple-category independence; importance independence; full tuple override; same-Map membership/asset validation; removal/delete conflict; CSV replacing chosen membership; pending revision approval conflict; stale default/source draft; default version fanout; publish-consistent styles under concurrent default change; release image copying and immutable historical output; private preview/public access separation. Migration and compatible/old-reader rollback rehearsal on disposable DB.
- **Windows QA:** later migration/read compatibility against backed-up environment only under authorized deployment task; public released output and authenticated Preview comparison; custom asset availability. No actual migration/QA/deployment in WU-65.
- **Aquarium replay:** 37 before/after stored tuples/coordinates/targets match; existing public release pointer/assets unchanged. Arimatsu custom designs remain individual. Do not adopt live fixture sources to prove migration.

## Slice D — Category defaults and explicit source controls

- **Goal:** remove repeated visual-style setup and maintenance, with understandable adoption/reset.
- **Affected files/areas:** Categories page and shared PIN editor reuse; `app/components/admin/PinDesignEditor.vue`; PIN Editor/list source display; Category APIs and bulk source action/schema; affected-count/preview computation; dependencies from C.
- **Schema impact:** use C only; no new taxonomy/Map-default layer.
- **API impact:** Category default draft save with expected revision/affected-set revalidation; source group preview/apply and explicit freeze; no changed geometry/target/importance. No implicit membership addition.
- **UI impact:** two distinct Category icon/default sections, before/after scope preview; list source modes/thumbnail; sole-category and chosen-category commands; individual edit and reset; links to resolve blocked source references. Whole-style overwrite consequence clearly stated. No generic Undo.
- **Migration:** legacy opt-in adoption only, never automatic. Changing Category icon remains independent. First activation only after C gates pass.
- **Tests:** Restaurant 飲食+休憩 uses explicit 飲食 under reorder/add/remove; zero/one/multiple-category bulk eligibility; mixed-source preview; full-tuple freeze/reset and absent-default fallback; changed affected-set conflict; cancel/failure dirty-state retention; stale default/current source version; custom/default assets still in usage counts; no effect on importance or current release.
- **Windows QA:** later keyboard/focus/IME, category default preview at supported widths, deliberate override reset and failed Save on disposable fixture. Check existing custom PINs are not converted merely by editing Categories.
- **Aquarium replay:** disposable 37 Spots adopt six or fewer meaningful defaults in groups (sole-category batch where valid), confirm expected inherited changes and individual exceptions; 37 placement tasks still remain. Existing Aquarium legacy output read-only.

## Slice E — Safe intended-Floor bulk assignment

- **Goal:** fix structured setup Floor mistakes without 37 detail visits or coordinate loss.
- **Affected files/areas:** list bulk review, `shared/schemas/spot-bulk.ts`, bulk handler and tests; Floor option/read helpers.
- **Schema impact:** none; reuse Spot.floorId. No intendedFloorId or transfer entity.
- **API impact:** new assign-Floor command with exact IDs/versions, same-Map destination and in-transaction x/y/lat/lng-all-null plus target-off checks. No position reset or transform fields accepted.
- **UI impact:** labeled `未配置スポットの配置先フロアを変更`; mixed invalid records listed; explicit user narrowing required. A same-destination row is a no-op; invalid preconditions still cannot be used to bypass validation.
- **Migration:** none; existing placed records never affected by this command. CSV existing-row Floor prohibition remains.
- **Tests:** all-null accepted, any coordinate or target flag rejected, malformed pair rejected, cross-Map Floor denied, stale/deleted Floor/Spot conflict, atomic mixed batch and coordinates byte-preserved. No mass clear/move behavior.
- **Windows QA:** later correct three unplaced records in a disposable Map; mixed placed/unplaced selection must change none; explain reason without losing selection.
- **Aquarium replay:** initial synthetic Floor correction works by group; existing 37 positioned Aquarium Spots are ineligible for this operation, confirming protection.

## Slice F — Continuous visual placement queue

- **Goal:** retain 37 human spatial decisions while removing repeated search/start and preventing candidate loss.
- **Affected files/areas:** `app/pages/admin/maps/[mapId]/editor.vue`, `SpotCombobox.vue`, `app/utils/pin-editor-state.ts`, `pin-editor-operation.ts`, camera return utilities; placement API only if additional version preconditions are required.
- **Schema impact:** none; queue is session UI state, saved position remains authoritative.
- **API impact:** same x/y save semantics; add expected Spot/Floor version checks for stale queue writes if not supplied by foundation. No auto-publication, no bulk coordinates.
- **UI impact:** opt-in floor queue, stable ordering/count, effective-style preview, Save-and-next, skip and explicit Floor-end transition; normal positioning/design modes retained. Source badge from D integrated when enabled.
- **Migration:** none. Normal editor behavior retained outside queue.
- **Tests:** save success advances, failure retains candidate/selection, skip not completed, reload reconstructs unplaced items, last item/empty Floor, concurrent placed/deleted item, stale response for old context, Floor/camera retention, dirty switch/escape, design save not advancing; keyboard Enter restricted to named button and no IME/global save collision.
- **Windows QA:** later five Floor sessions with mouse/keyboard and 390/768/1024/1440 layouts; browser refresh/route return and network interruption on disposable fixture.
- **Aquarium replay:** exactly 37 successful spatial saves, five deliberate Floor sessions, zero automatic public changes and zero unexpected Floor resets. Counts per Floor may mirror documented 11/4/6/9/7, without hardcoding the product.

## Slice G — Contextual photos and resumable guidance

- **Goal:** complete the import → shared policy → enrich → place → review flow on existing screens; reduce photo-related Detail visits without bulk photography.
- **Affected files/areas:** list contextual panel, `SpotPhotoManager.vue`, `MediaPicker.vue`, list count refresh, CSV result/Map setup contextual links. Existing navigation return validators and photo endpoint/version contract.
- **Schema impact:** none. No Wizard stage state, mandatory-photo flag or Map presets.
- **API impact:** reuse association endpoint; reconcile authoritative photo asset IDs/counts, version check replacement lists against concurrent edits. Uploaded asset lifecycle unchanged.
- **UI impact:** named Spot photo panel, optional missing-photo filter, visible All uses for unused assets, clear “add to this Spot” command consequence, preserved filtered return; lightweight task strip with optional content steps, never forced completion.
- **Migration:** none; existing photosJson/SpotPhoto fallback preserved. No data/image cleanup.
- **Tests:** P distinct associations, unused upload discoverability, legacy photo count, six-photo maximum/order/representative image, removal leaves Media asset, failed/concurrent association preserves panel and authoritative list state, close/switch while busy, validated return path, optional zero-photo/zero-category readiness.
- **Windows QA:** later assign three available synthetic photos, keyboard panel close/return, upload versus association feedback, no required-photo warning for the other 34 fixture Spots.
- **Aquarium replay:** assuming one useful photo on each of three exhibits, three deliberate association operations and no unnecessary Detail visits; real photo mapping remains operator judgment. Existing Aquarium data unchanged in this task.

## Acceptance and exit gates

1. Repository's relevant unit/integration checks, typecheck and build in implementation tasks; use disposable DBs for destructive integration. Do not run migrations/tests against Aquarium or canonical data for convenience.
2. End-to-end synthetic 37-Spot replay measures [09](09-AQUARIUM-BEFORE-AFTER.md), including existing CSV/bulk baseline. Legacy custom PIN/render parity and release immutability are hard gates, not optional screenshots.
3. Windows acceptance happens only under separate authorized work, with exact SHA/backup/environment evidence. This document neither changes Windows QA nor claims a pass.
4. No default adoption/CSV import changes live Aquarium/Arimatsu without explicit task authorization. Read-only comparison is sufficient for migration noninterference; synthetic data covers mutation workflows.
5. Ship the smallest completed slice, keep unready controls gated, and do not label AQUA-005/010/013 closed merely because this design exists. Closure requires implementation and recorded acceptance.

## Major risks / unresolved matters

Major risks are silent legacy repaint, stale source/default writes, Category membership deletion, snapshot consistency and asset lifetime, Floor coordinate loss, misleading completeness/publication labels and over-crediting existing CSV benefits. Each has a concrete rule and gate above. **Unresolved product decisions: none.** Raw UAT timing and exact photo/category distribution remain evidence limitations, not reasons to invent behavior. Additional performance tuning or precise migration SQL are implementation verification, not a pending choice of product model.

**Implementation may begin after a new implementation instruction. WU-65 itself ends with these documents.**
