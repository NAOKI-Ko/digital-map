# 2026-09-28 Admin UX audit closure

The original register had 0 P0, 0 P1, 9 P2, and 3 P3 findings. This record covers the twelve canonical IDs and the frozen four-contract remediation sequence. Status means the approved finding scope is resolved; it does not assert perfect visual uniformity or screen-reader certification.

| Finding | Original severity / scope | WU addressed | Final status | Residual limitation | Evidence |
|---|---|---|---|---|---|
| UX-001 persistence model drift | P2 / SYSTEMIC | 59, 60 | CLOSED | Immediate commands intentionally remain distinct | WU-59 persistence matrix; WU-60 Decoration draft QA; WU-62 dirty navigation |
| UX-002 Georeference draft loss | P2 / LOCAL | 59, 62 regression | CLOSED | Browser unload uses native prompt behavior | WU-59 dirty guard QA; WU-62 dirty navigation |
| UX-003 visual workspace orientation | P2 / PATTERN | 60 | CLOSED | Paper New and Georeference retain task-specific layouts | WU-60 Paper layout and responsive QA |
| UX-004 unsaved form protection | P2 / PATTERN | 59, 62 regression | CLOSED | Distinct section forms retain their own action placement | WU-59 dirty guard QA; WU-62 Settings browser case |
| UX-005 save feedback drift | P2 / PATTERN | 59, 60, 61 | CLOSED | Command feedback can remain toast versus draft feedback inline | WU-59 feedback QA; WU-60 Decoration QA; WU-61 publication QA |
| UX-006 navigation ownership | P2 / PATTERN | 61 | CLOSED | Contextual shortcuts remain intentionally visible | WU-61 navigation matrix; WU-62 regression |
| UX-007 Back and return context | P3 / PATTERN | 61, 62 regression | CLOSED | Direct deep links use canonical parent | WU-61 return-context QA; WU-62 history regression |
| UX-008 Georeference keyboard spatial input | P2 / LOCAL | 62 | CLOSED | Physical screen-reader and touch-device checks remain manual | WU-62 keyboard and accessibility QA; helper tests |
| UX-009 Paper responsive action placement | P3 / LOCAL | 60 | CLOSED | Native touch hardware was unavailable in browser harness | WU-60 fresh 390/768 browser evidence |
| UX-010 publication vocabulary | P2 / SYSTEMIC | 61 | CLOSED | Internal LIVE/PUBLISHED names intentionally remain | WU-61 vocabulary matrix and three-state browser QA |
| UX-011 component primitive drift | P3 / PATTERN | 62 | CLOSED | Local page layouts intentionally remain separate | WU-62 component decision and `UiButton` reuse |
| UX-012 Category English pre-save mutation | P2 / LOCAL | 59 | CLOSED | No remaining approved issue | WU-59 category draft and browser QA |

All nine P2 findings have an implemented contract or an explicit task-specific exception. No P0/P1 regression was observed in the cross-phase browser pass. The Admin UX remediation series may be closed after WU-62's required code gates and PR Verify pass; this branch is a reviewable PR and has not been merged. Remaining P3 work is fixture seed completeness and optional physical assistive-device verification, neither of which changes the frozen Admin UX contracts.

Next product direction: Paper Map Renderer / Template System.
