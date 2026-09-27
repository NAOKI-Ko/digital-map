# Paper Map Edit layout and interaction QA

Authenticated browser: isolated `digital_map_wu60_qa` database, Nuxt local server, map `demo-arimatsu-map`, Paper Map `cmukd367d0001w5u1bvg3jqao`. The fixture used A3 landscape and A4 portrait. Ten already positioned disposable demo spots were made available to exercise the three-page editorial design. All values below are browser `getBoundingClientRect` measurements, not CSS inference.

| Viewport | Paper | Preview / inspector | Sticky result | Overflow and controls |
|---|---|---|---|---|
| 390 × 844 | A4 portrait, 3 pages | Preview first, inspector below | Normal flow | Document width 390; page nav 44 px high and above the 69 px bottom action bar; PDF reachable |
| 768 × 900 | A4 portrait, 3 pages | Preview 693 px wide, inspector below | Normal flow | Document width 768; page nav at y797–841 before scroll, visible and operable |
| 1024 × 900 | A3 landscape | Preview 544 px left, inspector 320 px right | Sticky, top 112 px | Document width 1024; no nested inspector scroll |
| 1440 × 900 | A3 landscape | Preview 928 px left, inspector 352 px right | Sticky, top 112 px | Header 108 px; preview 744 px high; at page end its top remained 112 px, clearing header |
| 1440 × 900 | A4 portrait, 3 pages | Preview left, inspector right | Sticky and bounded | Page controls worked from page 1 to 2; three warnings remained below preview; after final CSS adjustment image maximum is viewport height minus 32rem |
| 1440 × 700 | A3 landscape | Preview left, inspector right | Normal flow for short viewport | Preview and warnings scroll with document; no clipped page or zoom controls |

The preview is first in DOM order. The desktop grid gives the inspector 20rem at `lg` and 22rem at `xl`; 768 px remains one column. The sticky top is 112 px, clearing the measured 108 px page header. The paper image shrinks within the preview at normal desktop heights, with a smaller cap when page navigation exists. The preview returns to normal flow for viewport heights up to 850 px or when zoom is active. Sticky containment is the workspace grid; no fixed positioning or nested full-height inspector scroll was added.

Browser interactions: clicking a preview spot region selected the Spot text inspector; editing that inspector made the preview busy and rendered a new candidate; Save/Discard remained functional. A4 editorial showed `全3ページ` and the Next button moved to page 2. The PDF button became enabled after preview rendering. A separate authenticated API check submitted an unsaved title through Preview, received a preview token and image (HTTP 200), then submitted the same config/token to PDF (HTTP 200, `application/pdf`, 1,002,713 bytes, `%PDF` header). A follow-up GET showed the saved config unchanged. The browser's blob download did not emit a file event in the test harness, so the API response is the PDF output evidence.

The disposable fixture displayed a warning for an older unregistered image reference. It did not prevent the A4/A3 layout or candidate PDF check and is unrelated to this WU.
