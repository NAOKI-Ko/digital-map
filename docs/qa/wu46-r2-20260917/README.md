# WU-46 R2 QA evidence — 2026-09-17

## Local automated checks

- `vitest`: 73 files, 498 tests passed.
- `nuxt typecheck`: passed.
- `prisma validate`: passed.
- `nuxt build`: passed.
- IMAGE spatial migration audit: zero unresolved exceptions.
- `git diff --check`: passed.
- Production dependency audit: one pre-existing high advisory in the Prisma toolchain (`deepmerge-ts < 8`, GHSA-ggr8-5vv4-36mx); no dependency change was made in this UI-only work unit.

## Responsive browser checks

Chrome was driven through the DevTools Protocol with WebGL software rendering at 390×844 and 430×932. `browser-results.json` records measured DOM geometry and interaction outcomes.

- Map canvas matched the full viewport at both sizes, and screenshots show cover rendering with no gray bands.
- PIN opened the complete detail Dialog directly; no summary step or 「詳細を見る」 was present.
- Detail/expanded heights measured 60%/92% (rounded to integer CSS pixels).
- Header up-swipe expanded; one 100px down-swipe closed from expanded.
- Close/expand controls measured 44×44px, title measured 22px, and the body was the only vertical scroll region.
- Modal open hid app controls, blocked map pointer events, retained marker transforms, and focused the Dialog heading.
- Escape and background pointer dismissal both returned focus to the originating PIN. The background path blocked the same gesture's follow-on click from reaching the map.
- 767px used the mobile layout and 768px used the desktop layout.
- Browser warning/error collection was empty.

The PNG files capture map, detail, and expanded states for both target viewport sizes.

## Remaining physical-device check

Physical iPhone Safari confirmation is not available from this environment and remains pending after Windows QA deployment.
