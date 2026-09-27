# Responsive browser QA

Tested in the authenticated local browser with explicit viewport overrides. Desktop header and workspace measurements were taken after the preview rendered. No document-level horizontal overflow was observed at any listed width.

| Width / height | Paper Edit | Decoration |
|---|---|---|
| 390 × 844 | Preview first, inspector second; document width 390; fixed action bar y775–844 and 96 px page bottom padding; PDF button reachable | Canvas 358 × 268 before controls; 44 px resize/rotate handles visible; Save/Discard reachable after normal page scroll; document width 390 |
| 768 × 900 | One column; A4 portrait multi-page preview 693 px wide; page nav y797–841 and not obscured; document width 768 | One column; canvas about 664 × 498, controls beneath; document width 768 |
| 1024 × 900 | Two usable columns, 544 px Preview and 320 px inspector | Canvas left 544 × 408, controls right 320 × 700 |
| 1440 × 900 | Preview left, inspector right; sticky clears 108 px header | Canvas left 808 × 606, controls right 320 × 700 |
| 1440 × 700 | Preview left, natural scroll because full sticky contents would not fit | Canvas and controls remain in normal document flow |

UX-009 fresh 768 px evidence: A4 portrait, 3 pages, preview width 693 px and total height about 1048 px, sticky `position: static`, page navigation 44 px high and visible, no obscured controls, `scrollWidth = innerWidth = 768`. A3 landscape at 768 was also observed in one-column flow with no overflow. UX-009 is closed on browser evidence.

The narrow-width pointer drag changed Decoration's local draft and did not persist. The browser viewport override does not emulate a native touch device; native touch hardware remains an unverified manual check. The existing `touch-none` pointer handling was retained.
