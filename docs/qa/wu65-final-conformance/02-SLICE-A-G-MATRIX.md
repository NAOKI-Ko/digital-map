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

## Final requirement reconciliation

Every initial requirement has a final status below. The three PARTIAL rows refer to the same native IME manual coverage gap, not three missing features.

| ID | Final classification | Evidence / remaining boundary |
| --- | --- | --- |
| A1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| A2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| A3 | PARTIAL | native Windows IME candidate-window testing remains unexecuted; neutral/configured retail UI and four-width checks pass. |
| B1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| B2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| B3 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| B4 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| B5 | PASS | valid change/no-op counts exclude errors; Windows 37 conflicts shows 0 changes/0 no-ops/0 auto-skips. |
| B6 | PASS | Map-wide factual counts, compact effective PIN preview and no-Category filter implemented/tested. |
| B7 | PASS | native Excel UTF-8 open/save plus UI import; keyboard List review and applied-filter reset; four-width checks and conflict recovery. |
| C1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C3 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C4 | NOT-APPLICABLE | assigned revisions cannot write categories/source; original scoped approval contract unchanged. |
| C5 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C6 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C7 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| C8 | PASS | pin-rollback.integration.test.ts creates inherited appearance, freezes to legacy tuple, verifies old-reader output/coordinates/target/membership, then rolls back all fixture writes. |
| C9 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| D1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| D2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| D3 | PASS | explicit outer individual-save label, effective thumbnail and absent-default label. |
| D4 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| D5 | PASS | Category child controls are inside disabled fieldset during save; source inspection plus successful/failed Save browser paths. |
| D6 | PARTIAL | default conflict retains draft; Stay/Discard, preview at four widths and keyboard source freeze/reset/standard pass. Only native Windows IME candidate-window coverage remains. |
| E1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| E2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| E3 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| F1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| F2 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| F3 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| F4 | PASS | real Windows stale then deleted target; candidate held until discard; refreshed Floor/Spot state reports deletion and focuses next item. |
| F5 | PASS | focus follows target; composing/default-prevented Escape ignored; keyboard Save requires focused button, no global Enter binding. |
| F6 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| F7 | PARTIAL | Windows-backed five sessions/37 focused Enter saves, skip/reload, stale/deleted recovery and four widths pass. Native Windows IME candidate-window coverage remains. |
| G1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| G2 | PASS | three real uploads remain library-only until explicit association; local real 409 retains pending selection. |
| G3 | PASS | MutationObserver observed disabled return during real Windows uploads; Escape attempted then retained panel in all three cases; unlocked after completion. |
| G4 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| G5 | PASS | stale association retained pending selection; explicit authoritative read/version refresh then retry; managed-photo DTO follows effective visitor contract with legacy fallback. |
| G6 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| EXIT1 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| EXIT2 | PASS | fresh Windows 37 replay and final canonical compatibility digest; failure-state corrections verified. |
| EXIT3 | PASS | exact corrected merge SHA, verified DB/media/public backup, staged Windows gates, post-merge Verify before activation; final digest unchanged. |
| EXIT4 | PASS | original source basis remains valid; correction tests and focused final Windows replay introduce no regression. |
| EXIT5 | PASS | findings closed on implemented/replayed behavior; native IME coverage exception remains explicitly recorded. |
| DEFER1 | INTENTIONAL-DEFER | approved exclusions unchanged. |
| DEFER2 | INTENTIONAL-DEFER | approved bulk/CSV exclusions unchanged. |

Final slice rollup: **A PARTIAL (IME coverage only); B PASS; C PASS; D PARTIAL (IME coverage only); E PASS; F PARTIAL (IME coverage only); G PASS.** Functional implementation is complete for all seven slices. No MISSING product requirement remains. No schema/Paper/Content–Placement expansion was added. Browser tests use Chromium against Windows Node/PostgreSQL, not a claim of native Windows browser/IME operation.
