# WU-52 visual and accessibility QA

Date: 2026-09-20 JST. Browser: clean Codex in-app Chromium against the local Nuxt server and isolated PostgreSQL fixture.

## Viewports

- 1280×800: Decoration canvas, direct-manipulation handles, command inspector, Media Picker UiSelect, Toast, and delete confirmation rendered without overlap.
- 390×844: Decoration canvas remained usable; resize/rotate controls remained touch-sized and the inspector followed the canvas in document flow.
- 430×932: CSV export/import cards were readable without a Floor selector or template action. Revision diff cards stacked current/requested values cleanly.

## Exercised behavior

- Selected a decoration; outline, move body, resize handle, rotate handle, and four inspector commands appeared.
- Dragged the body; the object moved and one completion Toast appeared.
- Used keyboard Arrow on resize and rotate handles.
- Duplicated; the created object became selected and `装飾を複製しました` appeared without a Toast stack.
- Opened delete confirmation; title, irreversible explanation, and MediaAsset preservation text were correct. Final deletion was not submitted during browser QA.
- Opened UiSelect and selected with Home/Enter; selection changed successfully.
- Viewed map-wide CSV UI and stale Revision card. Stale approval was disabled. Reject Dialog opened with labelled required textarea.

Browser console errors: 0. Framework overlay: absent. Focusable direct-manipulation controls have operation-specific accessible names. Public Map native locale controls are the documented non-Admin exception.
