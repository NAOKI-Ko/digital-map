# WU-60 finding disposition

| Finding | WU-60 implementation | Test / evidence | WU-60 disposition |
|---|---|---|---|
| UX-003 | Paper Edit is Preview-left / Inspector-right with bounded desktop sticky; Decoration remains Canvas-left / Controls-right without unnecessary sticky | `PAPER-LAYOUT-QA.md`, `DECORATION-DRAFT-QA.md`, `RESPONSIVE-QA.md`; 390/768/1024/1440 browser checks | **CLOSED** for the approved Phase-2 visual targets |
| UX-001, Decoration portion | Local geometry draft, explicit Save/Discard, dirty transition guard; add/delete/duplicate/layer remain immediate | Request log showed no PATCH on drag/keyboard, one PATCH on Save; failure/retry and command dialogs in `DECORATION-DRAFT-QA.md`; full tests | **CLOSED for Decoration**; broader finding remains **PARTIAL** across other phases |
| UX-005, Decoration portion | Busy, inline Save success/error, retained failure draft; immediate-command toast; no duplicate Save | Browser failed-Save/retry, `KEYBOARD-QA.md`, typecheck and tests | **CLOSED for Decoration**; broader finding remains **PARTIAL** across other phases |
| UX-009 | 768 px Paper Edit measured in A4 portrait three-page browser case, including page control position and overflow | `RESPONSIVE-QA.md`: 693 px preview, 44 px page nav, static flow, scrollWidth 768 | **CLOSED** on fresh browser evidence |

No P0/P1 regression was observed. Native touch hardware was not available in the browser harness; narrow-width pointer behavior and unchanged touch CSS were verified. The browser download event did not surface for blob PDF; the authenticated candidate Preview/PDF API round trip returned a valid PDF while preserving the saved config.
