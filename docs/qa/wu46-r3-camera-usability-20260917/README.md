# WU-46 R3 camera usability evidence — 2026-09-17

## Root cause confirmed

R2 registered `constrainMobileCamera()` from both `moveend` and `ResizeObserver` paths. The function set `minZoom` to the calculated cover zoom and, whenever the projected image polygon did not cover the viewport, repeatedly interpolated the current center toward the floor center and called `jumpTo()`. This produced both reported symptoms: almost no zoom-out and forced return after panning outside the image.

R3 removes that runtime camera constraint and its center interpolation helper. The projected-polygon cover calculation remains only for the initial mobile camera. Public-map minimum zoom is now calculated independently from the north-up 24px-padded whole-floor fit: `max(absoluteMin, zFit - 1.0)`. The editor continues using its existing zero zoom-out allowance.

## Browser verification

The `agent-browser` verification workflow was followed. The dedicated CLI was not available, so the Codex in-app Chromium browser control was used with explicit 390×844, 430×932, 844×390, and 1440×900 viewports. A temporary local-only fixture and read-only camera measurement hook were used and removed before commit.

See `browser-results.json` for exact camera values.

- Initial mobile rendering remained cover at 390 and 430 widths.
- Repeated minus-button input reached `zFit - 1.0`; the complete image was visible with additional surrounding space.
- Keyboard pans moved the center outside the image. The changed center remained identical after 60 seconds idle; forced camera correction count was zero.
- Spot detail open/close, Info open/close, and Category changes did not change camera values.
- Explicit floor switch applied the second floor's initial cover and independent minimum zoom once.
- Portrait-to-landscape resize preserved center, zoom, bearing, pitch, and maxZoom while recalculating minZoom; no recenter/refit occurred.
- R2 bottom sheet and long-description content remained present. Gesture thresholds remain covered by the unchanged bottom-sheet tests.
- Physical iPhone Safari was not available and was not claimed as tested.

## Automated verification

- Vitest: 73 files / 500 tests passed.
- Nuxt typecheck: passed.
- Prisma validate: passed.
- IMAGE spatial migration audit: zero unresolved exceptions.
- Production build: passed.
- `git diff --check`: passed.

