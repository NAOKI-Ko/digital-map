# WU-42 PIN workspace correction evidence

Date: 2026-09-15 (Asia/Tokyo)

## Source

- Baseline SHA: `aea358954bc22f70b60b613a4518dd49399d7685`
- Branch: `feat/wu42-pin-workspace-correction-20260915`
- Release source: the commit containing this evidence file (the exact deployed SHA is recorded in the external final report and Windows runtime metadata).
- No Prisma schema or migration change.

## Automated validation

- Focused tests: 3 files / 60 tests passed.
- Full suite: 67 files / 451 tests passed.
- `pnpm typecheck`: passed.
- `pnpm prisma:validate`: passed.
- `pnpm build`: passed.
- `git diff --check`: passed.
- The repository has no `lint` script; the attempted command failed only because that script is not defined.

## Local browser scenarios

Browser: Codex in-app Chromium, local Nuxt development server.

- Illustration-only workspace rendered without an OSM/real-world basemap or georeference CTA.
- Existing PIN direct selection showed the selected PIN at full strength with a halo and dimmed contextual PINs.
- Positioned Spot search matched by name and displayed floor/category context; selecting `有松天満社` focused the map and synchronized the Inspector without entering Move mode.
- Existing move mode exposed both accessible states: `有松天満社の元の位置` and `有松天満社の移動先PINをドラッグして位置調整`.
- Clicking a destination separated the full-strength destination candidate from the semi-transparent persisted ghost.
- Changing the pending design from illustration to preset updated the destination candidate immediately while the persisted ghost retained the saved illustration design.
- New placement for the unpositioned `重複スポット` rendered a full PIN using its pending preset design with the `仮配置` badge.
- Four zoom-in levels, pan after zoom, four zoom-out levels, and sidebar expand/collapse preserved the candidate's illustration landmark anchor.
- A 768 x 900 viewport rendered the map and Inspector as a usable stacked layout with the mobile admin header; the temporary viewport override was reset after verification.
- Existing move and new placement were both cancelled. No accepted QA PIN position/design was saved or mutated.
- Inspector kept Spot information, PIN design, position actions, Save, and Cancel in one persistent right-side surface.
- Screenshot frames were inspected inline. The browser controller did not provide a persistent PNG path, so no screenshot path is fabricated here.

## Technical severity

- P0: 0
- P1: 0
- Core P2: 0 in the locally verified scenarios

Human UAT remains separate and is not marked PASS by this evidence.
