# WU-42 Human UAT evidence

Date: 2026-09-15 (Asia/Tokyo)

Environment: isolated local PostgreSQL and Nuxt dev server at `127.0.0.1:3042`.
The reported Windows QA tunnel was inspected read-only, but its map API returned no usable map data, so all mutation checks were run locally.

## Browser observations

| Area | Result | Observed evidence |
| --- | --- | --- |
| Floor picker | PASS (existing media) | Floor usage was selected by default; switching to all showed reusable tenant media; selecting it replaced the empty uploader with a preview and no storage path. `WU42 Media Floor` was created and remained after reload. |
| Floor picker | BLOCKED (native chooser) | The browser host did not surface its file-chooser event, so a new local file could not be selected through the browser. The upload API and unified upload selected-state have automated coverage, but this mandatory browser sub-scenario remains incomplete. |
| Context filters | PASS | Browser values: settings `seo`, `logo`; Floor `floor`; Spot detail `photo`; Category custom-image view selected `category`; Decoration `decoration`; PIN selected asset preview remained visible outside the default filter. |
| Existing PIN | PASS | Clicking map markers selected the matching Spot panel. Switching between `有松天満社` and a duplicate-name fixture updated name/category/floor/actions without raw coordinates. |
| Placement mode | PASS | An idle map click produced no candidate. The unpositioned-only combobox filtered duplicate names and supported ArrowDown/Enter. `ピンを配置` enabled map placement and rendered a text-labelled `仮配置` marker. Cancel restored the original marker; Save persisted and survived reload. |
| PIN design | PASS | From the PIN workspace, an existing illustration asset preview was retained, size was changed to small and priority to featured, saved successfully, and remained `サイズ: 小 / 注目PIN` after reload. |
| Placement clear | PASS with split verification | Browser showed a destructive confirmation explaining that Spot/category remain. The dedicated local fixture was cleared through the same authenticated DELETE API; after reload the Spot remained and appeared in the unpositioned combobox. |
| RBAC | PASS | Map Editor: Spot list `200`; Spot Editor: map Spot list `404`; Spot Editor PIN-design PATCH `404`. |
| Spot detail | PASS | No PIN design or placement controls; only `PIN: 配置済み/未配置` and the read-only `PIN配置画面で編集` link remained. |
| Spot fields | PASS | A realistic URL field row was created and inspected at 1280×900 and 390×844. Labels, toggles, order and actions did not clip or overlap. |

## Screenshot status

The browser runner captured and displayed full-page screenshots for the existing-media Floor success state, PIN workspace/candidate/selected-Spot states, PIN design state, and Spot Fields at desktop and 390×844. Its screenshot API returned in-memory images but did not expose an approved filesystem export path. A retry of the documented file-chooser flow reset the browser runner. Therefore the required named PNG files are not present in this directory; this is recorded as the reason the overall verdict is `BLOCKED`, rather than claiming screenshot-complete Human UAT.

No Windows QA or production data was changed.
