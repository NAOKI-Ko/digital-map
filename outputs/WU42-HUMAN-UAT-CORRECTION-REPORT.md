# WU-42 Human UAT Correction Report

Date: 2026-09-15 (Asia/Tokyo)

## Verdict

`BLOCKED`

The implementation, automated validation, production build, and the browser scenarios that the local browser host could execute are successful. The verdict is blocked because the mandatory new-file browser chooser scenario and named PNG export could not be completed by the browser host. Human acceptance remains a separate gate.

## Git

- Source repository: `https://github.com/NAOKI-Ko/digital-map.git`
- Source HEAD / base SHA: `564ee750be65c6d27dc344f35c564366eb2cd4b3`
- Verified lineage: WU-41 Astra commits from `e75325a`, through `902cdb7`, to `564ee75`
- Branch: `feat/wu42-human-uat-correction-20260915`
- Worktree: `/Users/naoki/Documents/Codex/2026-09-15/wu42-human-uat-correction/work/digital-map`
- Final implementation HEAD: recorded in the supervisor response after the local commit
- Commit list: one WU-42 implementation/report commit on top of `564ee75`
- Source worktree safety: the pre-existing dirty WU-41 worktree and its untracked QA/storage artifacts were not modified

## Implementation

### Image/media selection and Floor creation

- Root cause: registered MediaAssets are served through optimized `.webp` variants, while Floor/PIN/photo validation only accepted legacy `.png`/`.jpg` URL shapes. The UI also kept separate uploader and library selected states.
- Changed: `MediaPicker.vue`, shared image/Floor schemas, Floor/settings consumers and regression tests.
- Behavior: upload and library selection converge on one preview; the empty dashed uploader disappears; a change action remains; raw storage paths are absent. Safe local upload names now accept PNG/JPEG/WebP, while paths outside `/uploads/` remain rejected.
- Floor identity: the selected `illustrationAssetId` continues to the existing Floor API; successful create clears it. No validation was suppressed.
- Contract: one tenant-scoped Media Library remains reusable across consumers; no new relation, table, or migration.

### Contextual Media Picker defaults

- The common picker initializes from its caller usage. Browser-verified defaults were Floor, logo, Spot photo, category icon, custom PIN, decoration, and the existing SEO/share usage metadata.
- `すべての用途` remains available. Changing filters affects candidates only; an already-selected asset preview is independent of the active filter. Each picker instance initializes independently.

### PIN drift

- Root cause: canonical image coordinates were interpolated linearly in latitude/longitude, but MapLibre renders in Web Mercator. The mismatch changed the apparent anchor under viewport transforms and zoom.
- Fix: image/floor interpolation now happens in projected Web Mercator space using all four image corners; inverse conversion uses a bounded Newton solve and retains out-of-range rejection. Dateline wrapping is handled without changing persisted canonical x/y.
- Contract: IMAGE x/y remains the only persisted position. Georeference and illustration replacement semantics are unchanged.

### Candidate and existing PIN interaction

- Added an explicit idle/placing/moving state. Idle map clicks do nothing.
- Candidate PIN uses the same coordinate pipeline as persisted PINs and has a visible ring plus a `仮配置` text badge/accessible name; raw x/y is not shown.
- Existing map markers are buttons. Direct marker selection drives the Spot/PIN inspector; only the selected marker is draggable in moving mode.
- Drag and map clicks update a candidate only. Explicit Save persists; Cancel rebuilds the marker from the original persisted position. Boundary constraint remains in the existing position helper.
- `配置を解除` uses a consequence-specific confirmation and clears x/y only; the Spot remains.

### PIN workspace responsibility

- Removed PIN design, image, size, importance and placement editing controls from Spot detail/form.
- Spot detail retains only a small read-only placement summary and a deep link preserving map/floor/Spot context.
- `/admin/maps/:mapId/editor` now contains current design preview/settings, preset/custom/illustration media, small/medium/large size, normal/featured importance, placement actions and an optional Spot detail link.
- No standalone PIN library or duplicated persistence was introduced. The existing design and position APIs remain authoritative.

### Existing PIN selector removal and selected-Spot panel

- Removed the old positioned-Spot list, `位置を再設定` entry point and coordinate text.
- The replacement inspector shows human identity, floor, categories, publish/placement state, size and importance. It exposes `移動` and `配置を解除` only for a positioned selection.
- Switching map markers changes selection by stable Spot ID.

### Searchable unpositioned Spot placement

- Added an unpositioned-only ARIA combobox with name/floor/category search, duplicate-name context, ArrowUp/ArrowDown, Enter and Escape.
- Selection uses stable Spot ID. `ピンを配置` is the explicit entry to placement mode; existing positioned PINs are manipulated from the map.

### Spot Fields

- Replaced giant card-like rows with flat separated rows, compact type/value metadata, clear primary/secondary actions, responsive label/order grids, and touch-sized controls.
- Domain/API semantics are unchanged. A populated URL field was inspected at desktop and 390×844.

### Helper text audit

- Removed repeated headings/explanations from Floor controls, Spot edit, PIN design, and Spot Fields.
- Localized operator labels such as category, Spot photo, PIN and decoration.
- Kept text for destructive placement clear, publication consequence, georeference/current-location limitations, recommended image constraints, and cross-purpose media reuse.

## Validation

- Focused regression coverage: Media selected-state normalization; contextual defaults/all/manual reuse; selected preview outside filter; WebP Floor/PIN acceptance and traversal rejection; Web Mercator coordinate round-trip; marker accessibility; direct PIN selection; old-selector/Spot-detail removal; combobox contract; PIN importance migration.
- Full Vitest: final count recorded after the last run in the supervisor response (all passing).
- Typecheck: PASS.
- Prisma validate: PASS; no schema or migration change.
- Production build: PASS. Existing bundle-size warning only.
- Whitespace/diff sanity: `git diff --check` PASS.
- Repository lint command: none defined.

### Browser scenarios

- Existing MediaAsset preview → Floor create → reload: PASS.
- New upload API and component state: PASS automated/API; browser native file selection BLOCKED by the host file-chooser event.
- Context filters and cross-consumer reset: PASS for available consumers.
- Direct selection, panel synchronization, idle click guard, explicit placement, candidate, Save/Cancel/reload: PASS.
- PIN design/media/size/importance save and reload: PASS.
- Spot detail responsibility boundary: PASS.
- Placement clear confirmation plus clear/Spot-retention end state: PASS through browser + authenticated local API split verification.
- Spot Fields desktop and 390×844: PASS.
- External map tiles produced network errors in the sandbox; the georeferenced illustration and markers still rendered locally.

### Accessibility

- Combobox keyboard flow and accessible name: verified.
- Marker accessible names distinguish selection from the sole draggable marker.
- Candidate state is not color-only (`仮配置` text and ARIA label).
- Confirmation dialog focus/labels observed.
- Mobile controls use minimum-height/touch-oriented styling.
- Existing reduced-motion behavior was not replaced with animation.
- This is not a WCAG certification.

### Screenshots/evidence

- Evidence notes: `docs/qa/wu42-human-uat-correction-20260915/README.md`
- Browser screenshots were captured and displayed during the session, but the runner did not provide an approved local export path. The required named PNG set is therefore incomplete and is the acceptance blocker.

## Severity

- P0: 0
- P1: 0 product defects found; 1 acceptance blocker (mandatory new-file browser chooser/evidence export incomplete)
- P2: 0 open core product issues found
- P3: 0

## Known limitations

- The new local-file chooser could not be driven because the browser host never emitted its documented filechooser event; retrying reset that runner. Upload processing and unified selected-state logic are covered by API/component tests, but this browser sub-scenario is not claimed complete.
- Required named PNG files could not be written from the runner's in-memory screenshots. The screenshots were visually inspected in-session only.
- Windows QA was not a viable mutation environment and its current map API returned no usable map; it was not changed or redeployed.
- External OpenStreetMap tile requests were unavailable in the sandbox. Illustration/PIN transform behavior was checked on the local image layer and backed by projected-coordinate regression tests.

## Delivery guardrails

- No GitHub push.
- No main merge.
- No Windows QA deploy.
- No Production deploy.
- No Jira update.
