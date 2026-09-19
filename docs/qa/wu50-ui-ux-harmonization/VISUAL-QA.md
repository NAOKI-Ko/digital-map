# WU-50 visual QA

Browser: Codex in-app Chromium browser against the local Nuxt development server and an isolated PostgreSQL QA database. Screenshots were inspected inline during the supervised run; the browser integration did not expose a filesystem screenshot export, so this record contains the measured and observed evidence without embedding credentials or private data.

## Viewports and journeys

| Viewport / journey | Checks | Result |
| --- | --- | --- |
| 1280×800 admin login and workspace | no overlay collision or horizontal overflow; shell context and navigation legible | PASS |
| 390×844 admin login | no horizontal overflow; controls usable | PASS |
| 430×932 admin login | no horizontal overflow; controls usable | PASS |
| 1280×800 admin Map workspace | one workspace selector, no Map selector, current Map read-only, Illustration active, Real disabled/準備中 | PASS |
| 1280×800 PIN editor | canvas/inspector hierarchy, selected/idle/move states, stable Cancel→Save footer | PASS |
| 390×844 PIN editor | one-column workspace, no horizontal overflow, canvas and inspector remain reachable | PASS |
| Spot edit | latitude/longitude visible, helper copy distinguishes real coordinates from Illustration PIN placement, value persists after save/reload | PASS |
| 390×844 public Map | full-bleed map, category rail, info sheet, drag gesture, Spot detail sheet, focus restoration | PASS |
| 844×390 public Map | no overflow or control collision; Map remains visible | PASS |

## Public-map control evidence

- The coarse-pointer CSS rule hides only `.map-viewer-zoom-control`.
- Compass/geolocation controls are not targeted by that rule.
- Gesture instructions and drag interaction remained available.
- The desktop-pointer browser at mobile dimensions correctly retained `+` / `-`; focused automated coverage verifies their removal under `(pointer: coarse)`.

## Accessibility and console review

- Dialogs expose names and close controls.
- Spot detail moves focus to its heading and returns focus to the originating PIN on close.
- Inspector action order is Cancel then Save.
- Touch controls use the shared minimum target sizing.
- No horizontal page overflow was measured at tested widths.
- No application console warning/error appeared in the completed representative journeys.
- A first local publication attempt exposed invalid external dummy photo URLs from seed data; after isolating the QA fixture to repository-owned assets, publication and public viewing passed. This was not introduced by WU-50.

Open visual/a11y defects: none at P0, P1 or core P2.

