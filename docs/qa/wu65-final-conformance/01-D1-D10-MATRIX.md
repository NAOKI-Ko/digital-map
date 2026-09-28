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
