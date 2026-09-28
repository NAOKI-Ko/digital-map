# D1–D10 conformance

Initial audit at `a6f7f018dcecb7d1095bacf26293fa246464d6d0`. Component basenames refer to `app/components/admin/`; API names to corresponding Map/Spot routes.

| ID | Classification | Finding | Source / evidence |
| --- | --- | --- | --- |
| D1 | PASS | Optional Category tuple, independent icon | prisma/schema.prisma; CategoryPinDefaultEditor.vue; tests/pin-appearance.test.ts |
| D2 | PASS | Dynamic LIVE and concrete immutable release | shared/utils/pin-appearance.ts; server/utils/public-map.ts/public-release.ts RepeatableRead; Windows blue A / green LIVE / green B |
| D3 | PASS | Explicit member source; no array-order precedence | pin-source.patch.ts; spot-bulk.ts sole-category is an explicit reviewed command; bulk-spot-api.test.ts |
| D4 | PARTIAL | Placement-owned metadata on Spot; reset/freeze works, but individual design Save does not name its mode-changing consequence | PinSourceEditor.vue; design.patch.ts; PinDesignEditor.vue; editor.vue — gap G4 |
| D5 | PARTIAL | Safe atomic commands implemented; invalid rows are counted as proposed changes/no-ops in summary | spot-bulk.ts changed/unchanged counts include errors; gap G1 |
| D6 | PARTIAL | Spatial/content/custom decisions stay per-item; photo command failure/busy handling incomplete | SpotPhotoManager.vue/MediaPicker.vue/ImageUploader.vue — gap G3 |
| D7 | PASS | CSV v3/starter and structured-only responsibility preserved | spot-csv.ts; import.vue; spot-csv.test.ts/wu65-foundation.test.ts |
| D8 | PASS | Resumable existing-screen guidance, no Wizard state | spots/index.vue/import.vue; editor.vue; no new setup schema |
| D9 | PARTIAL | Saved facts/filtering work, but promised Map-wide task counts and effective row thumbnail absent | spots/index.vue and spots/index.get.ts — gap G2 |
| D10 | PASS | Neutral fixed copy, configurable retail labels retained | SpotForm.vue; SpotPublishPanel.vue; shared/schemas/spot.ts; fields help; original facility/retail browser evidence |

PASS 6 / PARTIAL 4 / MISSING 0 / INTENTIONAL-DEFER 0 / NOT-APPLICABLE 0. Final reconciliation follows corrections without erasing initial findings.

## Final reconciliation at `0d0d1d5d75b6009c34e4bc37f9a6c5231e5cb245`

| Decision | Final | Basis beyond initial audit |
| --- | --- | --- |
| D1 | PASS | Optional default retained; Windows default UI preview/conflict tested. |
| D2 | PASS | Fresh 37-Spot blue release A stays blue after green LIVE; green release B. |
| D3 | PASS | Explicit source used for all 37, including two memberships; ambiguous sole-category review has one conflict, never selects by order. |
| D4 | PASS | Temporary Spot metadata/resolver boundary retained. Outer PIN Editor Save now explicitly says individual. Clarification: the embedded PinDesignEditor already named this consequence; the missing label was the outer editor button. Windows UI freeze/reset/standard keeps coordinates/target unchanged. |
| D5 | PASS | Invalid rows excluded from changed/no-op totals; mixed invalid batch unit regression writes nothing; Windows group commands and 37 source-removal conflicts. |
| D6 | PASS | Three explicit photo associations, real upload busy/close protection; stale association keeps selection and reloads version; 37 per-item canvas saves. |
| D7 | PASS | Native Excel UTF-8 starter-derived file imported through UI; 37-row export/preview round trip; structured-only contract unchanged. |
| D8 | PASS | Saved-fact task links and existing screens, no persisted Wizard. |
| D9 | PASS | Map-wide counts, source thumbnail/fallback, no-Category filter, optional photo facts; no score. |
| D10 | PASS | Windows-backed retail form has neutral Spot name and configured 営業時間; no presets/schema/canonical label changes. |

Final: **10 PASS / 0 PARTIAL / 0 MISSING / 0 INTENTIONAL-DEFER / 0 NOT-APPLICABLE**. Native IME manual coverage is tracked in slice acceptance, not concealed in a product-decision PASS.
