# Finding disposition

All 12 canonical AS-IS findings are assigned. **FIX 10; DEFER 2; KEEP-AS-EXCEPTION 0; DOCUMENT-ONLY 0; NEEDS-PRODUCT-DECISION 0.** Intentional exceptions are screen-level decisions in the Visual and Navigation contracts; the findings themselves still receive action or evidence gates. “DEFER” does not waive a finding: it records a measured gate or later dependency.

| Finding ID | Decision | Contract affected | Implementation required? | Expected screen scope | Priority | Can batch with | Open product question |
|---|---|---|---|---|---|---|---|
| UX-001 | FIX | Persistence | Yes | PIN; Paper Edit; Decoration; Georeference; Settings | P2 / Phase 1–2 | 002,004,005 | None; action taxonomy frozen |
| UX-002 | FIX | Persistence + Visual | Yes | Georeference | P2 / Phase 1 | 004,008 | None; guard needed |
| UX-003 | FIX | Visual | Yes | Paper Edit; Decoration; PIN as reference | P2 / Phase 2 | 009 | None; Paper orientation decided |
| UX-004 | FIX | Persistence + Navigation | Yes | Settings; Organization; Fields; Spot translation; assigned Spot Editor | P2 / Phase 1 | 001,002,012 | None; per-section snapshots |
| UX-005 | FIX | Persistence feedback | Yes | PIN; Paper; Decoration; Georeference; Settings; Publish | P2 / Phase 1–2 | 001,004 | None; one primary channel |
| UX-006 | FIX | Navigation | Yes, focused labels/ownership; no route move mandated | Categories; Fields; Floors; Editors; Revisions | P2 / Phase 3 | 007,010 | None; primary parent frozen |
| UX-007 | FIX | Navigation | Yes | Georeference; Spot New/Detail; Paper New/Edit | P3 / Phase 3 | 006 | None; validate return context |
| UX-008 | FIX | Visual accessibility | Yes | Georeference | P2 / Phase 4 | 002 | None; keyboard method to validate in QA |
| UX-009 | DEFER | Visual responsive | Conditional on fresh browser measurements | Paper Edit | P3 / Phase 2 QA | 003 | No product choice; evidence gate at 390/768 |
| UX-010 | FIX | Publication vocabulary | Yes | Publish; Paper New/Edit; Spot; Map Home | P2 / Phase 3 | 006 | None; private retained release wording frozen |
| UX-011 | DEFER | Component implementation | Conditional after contract migrations | Paper; Decoration; Georeference; Settings; Categories | P3 / Phase 4 | 005 | No product choice; share only repeated semantics |
| UX-012 | FIX | Persistence | Yes | Categories English name | P2 / Phase 1 | 004 | None; separate local draft |
