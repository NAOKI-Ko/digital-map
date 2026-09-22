# Paper Map design v2 acceptance / 2026-09-22

Verdict: **RECOMMEND-PARTIAL-ADOPT**. This is an experimental Draft PR, not a release approval. Authoritative base: `abddcb4b8262a2b4cd3a52b8703dfb4b155ff697`. Prior experiment: `7218f755d9dc0d2cb9f1ae19ec17dc1bdd6b2da8`.

## Evidence boundary

有松はWindows QAの公開用途DTOをread-onlyで取得。20 Spots / 6 categories / 16 photo-bearing Spots / 13 referenced assets。元の写真は5種類が複数Spotへ割り当てられている。実際の店舗・寺社の現地写真として検証済みとは扱わない。PINも元のQA座標を保全しており、地理的正しさの保証ではない。LIVEと現在の公開snapshotは別物。QRは公開URLへのリンクであり、紙面と公開snapshotが同時点・同内容とは主張しない。QRの一時トンネルURLの寿命も配布運用上の制約。

レジャー・山岳は独立したsynthetic fixture。Spot名・本文・カテゴリー・図版にQA表示。実在施設やブランドは使わず、図版はローカルで作った中立的な幾何学画像。道路・ルート・ゲレンデ・リフトは加えていない。production seed/baselineに変更なし。

顧客像/JTBDは既存要件・実装・成果物からの仮説。新たな顧客インタビューや実顧客による評価を実施したとは主張しない。初回8項目の調査・設計と代替手段比較は前回の設計成果を継承し、今回のProduct ownerからの批評を新たな評価入力とした。

## Visual iterations

| Pass | Observed defect | Change / result |
|---|---|---|
| 1 | 有松A3が2頁で末尾4件が孤立。A4は5頁、写真が小さく余白が多い。レジャー3頁の末尾2枚が孤立。山岳は一般案内と違いが弱い | 文字階層とカード余白、写真比率を再設計 |
| 2 | 有松A3は20件1頁へ。A4は4頁になったが地図PINが接近。レジャー末尾問題が残る | A4地図高さを拡大、レジャー続き頁を4列へ |
| 3–4 | A4写真なしSpotの大きな箱と行内空白。最終頁の余白。レジャー初頁の写真領域が小さい | 短い列へ順に配置し文字カードを必要高だけに。A4最終頁の写真を4:3、レジャー初頁3:2 |
| 5–final | 山岳の右下が空く。有松写真の繰返しはSource起因で残る | 山岳は地図比率60%、ガイド下に同一Spotの写真2枚。Source由来の反復は隠蔽しない |

全4対象・全8頁を製品PDFからPoppler 150dpiでPNG化して確認。本文9.5pt、Spot名11pt、罫線0.75pt。写真/ロゴ/カテゴリーはSource、装飾モチーフは非意味的で地図外。文字の意図的な省略はellipsisとPreview警告で明示。有松A3で1か所省略、A4ではなし。A3は総覧、A4は読む紙面という差が出た。写真poor時は文字中心構成と適合性注意を表示する。

## Rubric (1–5; independent author review, not customer rating)

| Criterion | Arimatsu A3 | Arimatsu A4 | Leisure QA | Alpine QA |
|---|---:|---:|---:|---:|
| First impression | 4 | 4 | 3 | 3 |
| Hierarchy | 4 | 4 | 4 | 4 |
| Readability | 4 | 4 | 4 | 4 |
| Print suitability | 4 | 4 | 4 | 4 |
| Map readability | 4 | 3 | 4 | 4 |
| Spot scanability | 4 | 4 | 4 | 4 |
| Photo use | 4 | 3 | 3 | 3 |
| Category use | 4 | 4 | 3 | 3 |
| Template identity | 4 | 4 | 3 | 3 |
| Source traceability | 5 | 5 | 5 | 5 |
| Density balance | 4 | 4 | 4 | 3 |
| QR composition | 4 | 4 | 4 | 4 |

Hard gate passes for these concrete outputs: traceability5/readability>=4/print>=4/no observed P0/P1 visual overlap or unintended clipping. Leisure/Alpine QR scores evaluate intentional omission when no public URL exists, not scan success. A4 map readability is3 because dense source pins require close reading; use A3 for navigation. Synthetic artwork proves layout behavior only. Repeated low-resolution Source photographs and generic synthetic categories prevent a5 for visual quality. Mountain identity remains modest; it is not a proven resort template. Desktop PDF raster inspection is not a physical printer or on-site navigation test.

QR: CoreImage decoded all4 A4 PDF page PNGs at150dpi. A3 did not decode at150dpi; the same PDF rendered300dpi did decode to the exact source URL. This is a recorded resolution limitation, not a claim of universal phone-camera success.

## Automated verification

- 91 test files / **619 tests passed**, including DB integration tests on disposable database. Added17 v3 tests: 6 designs × A3/A4 × portrait/landscape, full pagination/no overlap, version contract, deterministic render, missing map refusal, optional asset fallback, same-Spot photo choice, stale fallback, original/override/source isolation, source geometry unchanged, Japanese punctuation, reactive Vue draft switching.
- `pnpm typecheck`, `pnpm build`, `pnpm prisma:validate`: passed.
- `pnpm audit --prod`: no known vulnerabilities.
- Paper Map, spatial migration, Tenant foundation, default Spot fields audits: passed. Full tests leave a publication fixture without default fields; the existing fixture preparation helper restored only that disposable DB's standard fields before the final field audit. The original failure log is retained locally; no production repair was run.
- Existing API regression suite: 23 checks, including OWNER/Map EDITOR success, member/Spot editor/foreign Tenant denial, LIVE refresh, immutable READY snapshot, stopped-map QR omission, stale PDF rejection, duplicate/delete.
- New API suite: 15 assertions including login setup, actual20 Spot source, explicit design version, same-Spot photo accept/foreign-photo reject, stale changed draft reject, source digest unchanged after create/edit/reset/PDF.
- No Prisma schema/migration/dependency changes. Existing template1 PDF is pixel-identical to exact authoritative base after Poppler150dpi rasterization using the same20 Spot input. Template2 document/renderer code is unchanged from prior Astra.

## Browser and accessibility

Chrome / built Nuxt server / isolated actual-data copy. 1440×900,1280×800,1024×768,390×844,430×932. Creation preview and six real-rendered thumbnails, picker change, create, Original text, summary override, reset, hide/show, same-Spot photo save/reload, ordering, keyboard viewport, LIVE/PUBLISHED source refresh, explicit new design switch, save/reload, PDF download, keyboard selection through accessible document text. All horizontal document widths stay at viewport width.

Browser testing found and fixed a real `structuredClone` failure on Vue reactive drafts. The test now asserts the destination design name and no browser console/network errors, rather than treating a click as success. An earlier dev run was interrupted by HMR (`ERR_CONTENT_LENGTH_MISMATCH`); final verification uses a stable built server. Axe stylesheet preloading was disabled to avoid audit-generated cross-origin CSP requests; DOM/contrast checks still ran.

Preview images have page/title labels; named Inspector controls, keyboard-focusable slots, page navigation text and a separate Spot/text document are provided. Axe WCAG2A/AA/2.1AA checks inside `main`: zero violations at all5 sizes. This is not full assistive-technology certification. PDF is untagged raster: text search/selection/screen-reader PDF output remains unsupported. Real iOS Safari, actual printers and physical QR scanning remain untested.

## Performance

Same host, same20 Spot DTO, same A3 landscape;3 fresh-render calls per version, median, PDF generation only. Base runs exact `abddcb4` renderer in separate checkout. No network time included; no benchmark claim about production concurrency.

| | Current dev | Previous Astra (v2) | Final Astra (v3) |
|---|---:|---:|---:|
| PDF MB, decimal | 3.164 | 20.561 | 3.316 |
| PDF generation median ms | 357 | 2053 | 755 |
| Server Preview median ms | N/A (client Preview) | 374 | 469 |
| Embedded image | 4961×3508 | 4961×3508 | 3969×2806 |
| Print encoding | legacy JPEG | lossless PNG | JPEG94,4:4:4,240dpi |

Final PDF size -83.9%, generation -63.2% versus prior Astra; +4.8% size and2.1× time versus Current dev. Physical body sizes were not reduced. Preview PNG stays150dpi; codec/resampling differences are explicitly expected. PDF/Preview share layout, source and SVG; pixels are not identical. `pdf-inspection.json` records per-page dimensions, MAE and PSNR, not a semantic-parity guarantee. Core geometry/version/determinism and visible pages are separately checked.

Process memory samples rose578MB(base)→800MB(v2)→1007MB(v3 in the same v2/v3 benchmark process). The latter is cumulative/cache-retaining, not a clean isolated v3 peak, so no cross-version memory-win claim. Server-side PNG Preview payload and six thumbnail renders are further performance costs. Caching/worker limits/vector text should be evaluated before a broad rollout; old outputs must remain versioned.

Final hardening adds an explicit warning when a saved selection/order/override/photo reference has disappeared from Source; it never fills the missing Spot. The added regression makes619 tests. It changes no document geometry/encoding or normal-data target output. The final offline proof helper was also executed on the synthetic leisure fixture (2 pages,1863793 bytes).
