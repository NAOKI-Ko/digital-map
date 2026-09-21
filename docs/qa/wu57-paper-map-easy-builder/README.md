# WU-57 Paper Map Easy Builder v1 — QA evidence

Date: 2026-09-21 JST  
Branch: `feature/wu57-paper-map-easy-builder-v1-20260921`  
Authoritative base: `origin/dev @ ef864a6144c6fd0eede4c188b6dd996a245029c0`

## Automated verification

- Prisma schema format/validate/generate: PASS
- Upgrade migration on the existing local development database: PASS
- Fresh migration of all 31 migrations on `digital_map_wu57_qa`: PASS
- Read-only paper-map schema/integrity audit: PASS
  - `PaperMap` and `PaperDesignRequest` present
  - all five request statuses present
  - orphan paper maps: 0
  - invalid cross-map design requests: 0
- Nuxt typecheck: PASS
- Vitest: PASS (`86` files passed, `3` skipped; `570` tests passed, `16` skipped)
- Nuxt production build: PASS

## Browser QA

In the authenticated local admin application:

1. Opened the new Paper Map landing page and verified the recommended entry point, saved-list empty state, and lightweight design-consultation link.
2. Opened `/paper/new`; verified the three purpose choices and created a `MAP_FOCUS` draft with one click.
3. Verified immediate live preview, warnings, A4/A3 and portrait/landscape controls, three layouts, map size, explicit spot selection, and progressive disclosure.
4. Changed the draft to A3, added a subtitle, expanded the optional controls, and saved. The save-success toast appeared and the save button returned to disabled/clean state.
5. Enabled ten public demo spots, reloaded, and verified numbered pins and all ten legend entries in the live preview.
6. Generated a PDF from the current editor draft without another save. The PDF-success toast appeared.

## PDF QA

`paper-map-a4-landscape.pdf` was generated through the v1 renderer and parsed with `pdf-lib`. The automated matrix covers:

- `MAP_FOCUS` / A4 landscape
- `GUIDE` / A4 portrait
- `PHOTO_GUIDE` / A3 portrait
- `GUIDE` / A3 landscape

The representative PDF was inspected with `pdfinfo` and rendered to PNG with Poppler. Results:

- one A4 landscape page (`841.89 × 595.276 pt`)
- title, subtitle, map frame, numbered spot pins, legend, QR and QR label visible
- Japanese text renders correctly
- map/source-image contain geometry and whitespace are stable
- no encryption and no embedded JavaScript

Artifacts:

- `paper-map-a4-landscape.pdf`
- `rendered/paper-map.png`

## Scope checks

- No arbitrary element placement, freeform canvas, font picker, raw CSS, or Canva API.
- Customization remains selection-based; custom viewport is numeric/cropped, not freeform composition.
- `LIVE` reads current public-visible data; `PUBLISHED` resolves the current immutable `READY` release even while public display is stopped.
- PDF generation accepts the validated current draft and does not implicitly persist it.
- Every map route uses the existing map-access guard; child records are constrained by both `mapId` and record ID.
- `main` and Production were not touched.
