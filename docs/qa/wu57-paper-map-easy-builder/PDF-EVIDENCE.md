# WU-57 PDF Evidence

The v1 renderer was exercised directly and through the authenticated browser endpoint.

## Automated matrix

- MAP_FOCUS / A4 landscape
- GUIDE / A4 portrait
- PHOTO_GUIDE / A3 portrait
- GUIDE / A3 landscape

Every output parsed with `pdf-lib`; each representative fixture exceeded 10 KB and had the expected page count. Overflow legend pages are generated rather than silently truncating selected spots.

## Representative artifact

`paper-map-a4-landscape.pdf`

`pdfinfo`:

- page size: `841.89 × 595.276 pt (A4)`
- pages: `1`
- encrypted: `no`
- JavaScript: `no`

The PDF was rendered at 120 DPI with Poppler to `rendered/paper-map.png` and visually inspected. Japanese title/subtitle, map frame, stable numbered pins, legend, QR code, QR label, footer and whitespace were readable and unclipped.

The fixture intentionally has no source bitmap so the missing-image fallback is also visible. Browser QA separately exercised the real seeded map image and ten live spots.

Verdict: PASS.
