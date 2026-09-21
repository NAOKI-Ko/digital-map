# WU-56 visual QA

Browser: Codex in-app Chromium against local Nuxt and an isolated PostgreSQL QA database seeded with the repository's Arimatsu fixture plus the WU-45 PIN editor fixture. Screenshots were inspected inline during the supervised run. The browser integration did not expose a repository screenshot export, so this record preserves measured geometry and observations without credentials or private data.

## Viewports

| Viewport | Measured result | Verdict |
| --- | --- | --- |
| 1280×800 | After page scroll, Map section resolved to `position: sticky`, `top: 24px`, `y: 24`, height `544px`; toolbar was offscreen; no horizontal overflow | PASS |
| 1440×900 | After page scroll, Map section remained at `y: 24`, height `612px`; workspace remained the containing block | PASS |
| 1024×768 | `lg` behavior active; after PageDown, Map section remained at `y: 24`, height about `522px`; no horizontal overflow | PASS |
| 390×844 | Map section resolved to `position: static`, `top: auto`; Map preceded Inspector in normal flow; Inspector began below Map; no horizontal overflow | PASS |
| 430×932 | Map section remained `position: static`; controls and Inspector remained sequential and usable; no horizontal overflow | PASS |

## Desktop sticky journey

1. Opened the PIN editor and selected `WU45 既存PIN fixture`.
2. Entered `デザインを編集`; Inspector height exceeded Map height.
3. Before the threshold, Map scrolled normally.
4. After the threshold, Map stayed at the `1.5rem` offset while lower Inspector controls remained reachable.
5. At the document bottom, the Map bottom remained inside the workspace bottom; no overlap with later content occurred.
6. Scrolling back returned the Map naturally; no fixed-position behavior was observed.

The page has no substantive content after the workspace, so the browser cannot scroll far enough to visibly push the shorter Map above the viewport at the workspace end. Containment was verified from live geometry: at 1280×800 and maximum scroll, Map bottom was `568px` and workspace bottom was `768px`. The sticky element therefore remained bounded with 200px clearance and did not overlap outside the workspace.

## Live PIN design

- Changed PIN color to `#047857`, size to `大`, and importance to `注目` while scrolled to lower Inspector controls.
- The selected Map marker updated immediately and gained the featured marker state while Map stayed visible.
- No independent preview box was introduced.
- Cancel triggered the existing dirty confirmation and restored the saved design.

## Sidebar and MapLibre

- Sidebar collapse changed Map width from `564px` to `748px` without horizontal overflow.
- Selected PIN center stayed at exactly 50% of Map width before and after resize.
- No canvas clipping, flicker, or console error was observed.
- Vertical scrolling introduced no repeated resize loop.

## Position editing and accessibility

- Entered `位置を移動`, created a candidate on the Map, and observed both original and candidate markers.
- Cancel + discard restored the selected marker to the exact original browser rectangle (`x=448`, `y=436`, `60×60`).
- Map region, keyboard-reachable controls, Inspector order, dirty guard, and dialogs remained available.
- Console error count: 0.

Open visual/accessibility defects: none at P0, P1, or core P2.

