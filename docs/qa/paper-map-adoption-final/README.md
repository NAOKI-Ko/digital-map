# Paper Map adoption gate

The adoption scope is the shared Preview/PDF plan and renderer, print-size text, complete pagination, LIVE/PUBLISHED source refresh and freshness checks, same-Spot managed photo choice, Preview-first editor, JPEG PDF output, and the two heritage designs **藍のまち案内** and **まちの小さな読本**.

The four other v3 designs and their experiment evidence remain in the repository. They are excluded from the normal creation picker, design switcher, recommendation, and create API. Preview, update, and PDF accept one of those designs only when the same design is already saved on that PaperMap in the same Map. v1/v2 configs are never migrated on read, save, or export; an explicit design switch is required. The shared admission check is used by the API routes. All access still passes Map/Tenant authorization.

## QR and final PDF check

- Source: read-only Windows QA `arimatsu-fon` public-purpose DTO, 20 eligible Spots, six categories, 16 Spots with photos. `PaperMapSource` SHA-256 `a93f9d5d3d7f2eebd35bea98dbee565d64c1a0e713a0b40414e813edefa06fcc`; 13 referenced assets match the earlier asset hashes. The raw export SHA changed on re-export, but semantic source and referenced asset hashes match. The raw DTO and asset copies were removed after the check.
- The QR payload is `https://examine-anime-bathroom-attraction.trycloudflare.com/arimatsu-fon`, derived from the configured public base URL and the existing source slug. Read-only HTTP HEAD returned **200** on 2026-09-23 JST. This temporary tunnel URL must be checked again before actual distribution.
- QR Code level M, 37 data modules, four-module internal quiet zone. A3 landscape uses 60 pt = **21.17 mm** square, with a 1.88 mm internal quiet zone. A4 portrait retains 50 pt = **17.64 mm** square, with a 1.57 mm internal quiet zone. The A3 QR frame has at least 5 pt external clearance at the right and bottom. The footer rule is separated from every Spot card by the document layout. The A3 enlargement is limited to the adopted heritage theme and A3 landscape; other saved v3 designs retain their rendering.
- Final A3 PDF: one page, all 20 Spots, 3,323,552 bytes. Final A4 PDF: four pages, all 20 Spots, 4,464,317 bytes. Both are rendered from the same semantic source SHA as prior acceptance. The final PDFs and their 150 dpi PNGs are retained in the `outputs/adoption-final` delivery folder; the PDFs are also here.
- CoreImage software QR detector decoded the **exact URL from every final PDF page rasterized at 150 dpi**: A3 page 1 and A4 pages 1–4. The previous A3 PDF needed 300 dpi. This result establishes automated image reading, not physical phone-camera success.
- Visually inspected the new A3 page after Poppler rendering. The QR, footer rule, map, 20 Spot cards and three existing photos have no observed overlap. A4 keeps the previously inspected four-page layout and unchanged QR size.

## UI and API policy check

- Disposable-DB API integration: **24 checks passed**. All four retained experimental designs return 422 for new creation and unsaved Preview. Both adopted designs create and preview successfully. A saved experimental design still loads, previews, edits and exports; switching into a different hidden design through PATCH or PDF is rejected. A saved v2 design loads, edits, previews and exports with templateVersion2 unchanged.
- Chrome Browser QA at 1440×900 and 390×844: the new picker and editor switcher each display exactly the two adopted designs; the non-offered names are absent from the new flow. The mobile editor has no document overflow and the final run has no browser console/page errors. Screenshots and JSON results are retained here.

## Manual QA still open

- [ ] Print the final A3 and A4 PDFs at 100% scale on the target printers. Check body text, fine rules, map PINs, photos, all page edges, and QR contrast.
- [ ] Scan each printed QR with representative iOS and Android phones under ordinary lighting. Verify the opened host, slug, public release, and page behavior.
- [ ] Test the new/edit/Preview/PDF flows in Safari on macOS and iOS, including small viewport and keyboard/assistive navigation.
- [ ] Before distribution, confirm the temporary QR hostname remains live and that the LIVE paper source and PUBLISHED Web map content are intentionally aligned.
- [ ] Confirm source photos and PIN locations with the customer before treating this QA map as a geographically verified distribution artifact.

No Windows write, publish, or deploy was performed. The local integration fixture uses only the disposable `digital_map_astra_paper_20260922` database.
