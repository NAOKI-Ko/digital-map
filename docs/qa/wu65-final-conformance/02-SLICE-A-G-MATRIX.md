# Slice A–G and gate matrix

Initial read-only findings. Source basenames resolve to existing repository files; no PASS relies on a QA verdict alone. Schema/API/UI/migration/test/Windows/replay dimensions in plan 10 are covered below. Affected-area lists are implementation guidance, not a mandate to edit every named file.

| ID | Classification | Requirement/result | Source / verification basis |
| --- | --- | --- | --- |
| A1 | PASS | Neutral names/search/section/example/error fallback | SpotForm.vue, shared/schemas/spot.ts, spots/new.vue/index.vue |
| A2 | PASS | Configured hours/holiday labels and retail defaults; no schema/header relabel | SpotPublishPanel.vue; shared/constants/spot-fields.ts; CSV canonical headers |
| A3 | PARTIAL | Windows Japanese IME and all-width configured-label acceptance not fully recorded | Earlier 390px facility/retail screenshots; final focused acceptance needed, G5 |
| B1 | PASS | Zero-Spot starter, 37 rows, metadata, human Floor/Category | createSpotCsvStarter; starter.get.ts; wu65-foundation.test.ts; Windows import/export |
| B2 | PASS | v3/v2/v1 exact acceptance, typed/required/translation/conflicts/formula/no-delete | spot-csv.test.ts; transactional import; v1/v2 new without Floor context rejected, not universal compatibility |
| B3 | PASS | New standard, unplaced, target-off; legacy template unchanged | spots/index.post.ts; import/index.post.ts; starter distinct endpoint |
| B4 | PASS | Selection cap100, named scope, filter clearing, retained error selection, server review token | spots/index.vue; SpotBulkDialog.vue; bulk-spot-api.test.ts |
| B5 | PARTIAL | Truthful review counts with invalid rows | spot-bulk.ts counts invalid row changes, G1 |
| B6 | PARTIAL | Task counts / row thumbnail; missing-category task filter absent | List source inspected; G2 |
| B7 | PARTIAL | Excel UTF-8, keyboard at four widths, network/conflict browser coverage | Parser/BOM tests and original browser paths; no native Excel execution recorded, G5 |
| C1 | PASS | Additive tuple/revision/source FK, individual legacy default; new writers standard | 20260929010000_category_pin_defaults migration; source/create/import routes |
| C2 | PASS | One whole-tuple resolver, standard fallback, no category/importance inference | pin-appearance.ts; tests/pin-appearance.test.ts |
| C3 | PASS | All membership writers protected; old design client lacking version rejected | form/CSV/bulk guard; Category delete transaction; design.patch.ts expectedVersion |
| C4 | NOT-APPLICABLE | Assigned revision cannot replace categories/source | spotRevisionPayloadSchema and spot-revision.ts contain content/photo fields only; approval checks baseVersion in Serializable transaction |
| C5 | PASS | Source/default stale guards and fanout; consistent snapshot | pin-source/default PATCH transactions; default revision/dependent hash; RepeatableRead captures coherent historical view across locales, not mixed styles |
| C6 | PASS | Asset tenant scope, usage/GC/FK and immutable release copies | media.ts, media-gc.ts, public-release.ts; media-optimization.test.ts/public release integration |
| C7 | PASS | Actual 90 legacy marker DOM/tuple parity and release/coordinate protection | private-clone integration test executed; Windows digest; see 03 |
| C8 | PARTIAL | Old-reader rollback rehearsal not executed as required | Rollback prose is not execution; G5 disposable transaction rehearsal needed |
| C9 | PASS | Preview is private/authorized; public reads snapshot | visitor-preview.get.ts, public release lookup; existing access tests |
| D1 | PASS | Optional default editor, independent Category icon, preview/count/affected link | CategoryPinDefaultEditor.vue; Category APIs; explicit blue/green browser/API evidence |
| D2 | PASS | Explicit source modes, absent-default fallback, freeze/reset/member-only | PinSourceEditor.vue; pin-source API and resolver tests |
| D3 | PARTIAL | Individual Save consequence and missing-default badge; row effective thumbnail | Generic design Save label and source-only badge; G2/G4 |
| D4 | PASS | Membership/category removal blocks; affected category usage link exists | categories.vue usage link; delete disabled while member count; delete API source check |
| D5 | PARTIAL | Category default child remains editable while save in flight | CategoryPinDefaultEditor.vue saving only disables parent checkbox/button; G4 |
| D6 | PARTIAL | Stale/default/dirty/keyboard/width UI acceptance not all exercised | Prior source/default tests plus partial browser evidence; G5 |
| E1 | PASS | Only x=y=lat=lng=null AND target-off; same Map destination | spot-bulk.ts checks all four coordinates and target; no coordinate fields in planned writes |
| E2 | PASS | Same Floor no-op still validates, stale/deleted/cross-Map/atomic mixed batch | bulk planner and Serializable apply; bulk-spot-api.test.ts; local safe pair and Windows placed-batch rejection |
| E3 | PASS | Existing CSV row cannot move Floor; actual Aquarium placed protected | spot-csv.ts; existing 37 coordinate-bearing rows cannot satisfy planner |
| F1 | PASS | Floor unplaced stable name/id queue, count, effective preview | placement-queue.ts/tests; editor.vue; 37 real canvas saves/5 sessions |
| F2 | PASS | Save-and-next only after success, failure retains candidate, no auto-publish | savePosition/finishSuccessfulSave; network-abort browser evidence; position PATCH only x/y/version |
| F3 | PASS | Skip writes nothing; reload rebuilds; explicit Floor end; no automatic Floor switch | skipQueueSpot/reloadQueue and queue empty state; dirty requestTransition |
| F4 | PARTIAL | Concurrent placed/deleted item recovery and refreshed Floor version | 404/409 only generic retained-candidate error; reloadQueue refreshes Spots not Floors; G6 |
| F5 | PARTIAL | Focus moves to announced next-item control / IME-safe Escape | aria-live name exists but no focus transfer; global Escape ignores neither composing nor prevented event; G6 |
| F6 | PASS | Normal position/design modes, guarded stop/target/Floor changes, stale response isolation | operationGate/requestTransition and existing pin-editor-state/operation tests; design save does not advance |
| F7 | PARTIAL | All-width Windows queue/network/refresh/keyboard cases | Earlier local widths and Windows happy path; fresh focused cases needed, G5/G6 |
| G1 | PASS | Named list photo panel, effective count refresh/filter, optional photos | SpotPhotoDialog, list refresh, spotPhotoCount; original three-photo browser evidence |
| G2 | PARTIAL | Upload versus explicit association, pending image survives failure | Picker emits selection immediately; manager unmounts picker while saving; no retained retry selection or explicit add-to-Spot boundary, G3 |
| G3 | PARTIAL | Close/switch locked throughout upload and association | manager busy covers association only; uploader busy not propagated, G3 |
| G4 | PASS | Reuse MediaPicker, visible All uses, six/order/representative-first, detach retains Media | MediaPicker.vue, SpotPhotoManager.vue, photos.patch.ts, photo schema/tests; no mandatory photo |
| G5 | PARTIAL | Concurrency/failed association recovery and current authoritative list | API atomic/version safe; panel has no reload/review recovery after 409 and loses chosen candidate, G3 |
| G6 | PASS | Filtered/scroll return and no Wizard persisted state | Dialog is within mounted list; existing route return validator; guidance only derives tasks |
| EXIT1 | PASS | Unit/integration/typecheck/build on isolated data | Local+CI+Windows runs recorded; final correction gates will repeat |
| EXIT2 | PARTIAL | 37 replay includes baseline and hard compatibility; edge-state gaps unresolved | 09 model met happy path; G3/G6 block unconditional closure |
| EXIT3 | PASS | Authorized Windows deployment exact SHA/backups | PR20 acceptance and source-tree identity |
| EXIT4 | PASS | No real Aquarium/Arimatsu adoption/rebuild | 90-row/public hash baseline preserved |
| EXIT5 | PARTIAL | Finding closure needs complete implemented acceptance | This audit does not close through documentation alone |
| DEFER1 | INTENTIONAL-DEFER | Placement/Content split, Paper/visitor fit, presets, Wizard, generic score | Explicit design exclusions; no work here |
| DEFER2 | INTENTIONAL-DEFER | Category Replace, custom-field grid, bulk photo/coordinates, pagination, extra shortcuts | 03/04 explicitly defer; CSV and per-item work retained |

Slice rollup: A PASS with additional acceptance coverage pending; B PARTIAL; C PARTIAL (rollback evidence); D PARTIAL; E PASS; F PARTIAL; G PARTIAL. The final acceptance section will distinguish resolved implementation gaps from residual evidence limitations.
