# Implementation sequence — documentation decision only

Source baseline `8980521550625e724fcc0b2bda9c46d93eeb0023`. No WU numbers or implementation branch are assigned. Each phase should produce its own reversible, tested scope and preserve existing RBAC, route and data contracts unless separately authorized.

## Phase 1 — Persistence and dirty-state consistency (first batch)

**Goal:** make explicit form/visual drafts safe and make Save outcomes predictable before changing workspace geometry. Implement section/target snapshots and guards for Georeference, Map Settings, Organization, Fields, Spot Detail translation, Category English name and assigned Spot Editor. Align save/error announcements in those screens and Paper Edit/PIN where the same feedback contract is already available.

**Findings:** UX-001, UX-002, UX-004, UX-005, UX-012. **Estimated screen scope:** **9 admin routes** (the seven named draft routes plus Paper Edit and PIN), with shared guard/feedback primitives as needed. Georeference's two-point model and Paper's PDF-from-draft behavior remain intact. Break into small implementation PRs if needed; do not change domain APIs for uniformity. Verify failed-save draft retention, route/tab/target exit, browser close, and mobile action feedback.

## Phase 2 — Visual Editor application

**Goal:** migrate Paper Edit desktop to Preview-left/Inspector-right with bounded sticky geometry, retain Paper New as a selection exception, and move Decoration geometry to `VISUAL_DRAFT_SAVE`. Keep Decoration discrete add/delete/duplicate/layer commands explicit. Make sticky Decoration conditional on measured inspector length rather than compulsory.

**Findings:** UX-003 and the Decoration part of UX-001/005; UX-009 is a browser evidence gate. **Expected scope:** Paper Edit and Decoration, with PIN as regression reference and Paper New/Georeference as exception checks. Test 390, 768, 1024, 1440 px, short laptop height, long Inspector, keyboard focus, preview readability, target switching and failure rollback. Implement a shared shell only if repeated semantics survive those tests.

## Phase 3 — Ownership and publication language

**Goal:** apply one parent/return model and the frozen Japanese publication terms without moving routes by default. Qualify Map visibility, current editing content, public release and retained release on Publish, Paper and Spot surfaces. Make context returns explicit and validated.

**Findings:** UX-006, UX-007, UX-010. **Expected scope:** Publish, Map Home, Spot list/detail, Paper New/Edit, Categories, Fields, Editors, Revisions, Floor child routes and navigation copy. Product contract is frozen; implementation must keep existing Map authorization and Paper source semantics.

## Phase 4 — Accessibility and component consolidation

**Goal:** provide keyboard-operable Georeference point selection and consolidate repeated buttons/actions/status markup only where behavior now matches. **Findings:** UX-008, UX-011, with UX-009 if Phase 2 measurement demonstrates an obstruction. **Expected scope:** Georeference plus shared primitives and a small set of migrated pages. Do not build an all-purpose editor component.

## Gates and dependencies

- Phase 1 precedes Decoration draft migration, since the draft/guard/feedback semantics are its prerequisite.
- Phase 2 requires fresh disposable-data browser verification, including 768 px absent from the AS-IS pass; historical WU-56/WU-58/Paper screenshots are baselines only.
- Phase 3 can prepare copy/navigation specimens in parallel with Phase 2, but apply after persistence labels are stable.
- Each WU confirms exact source/implementation SHA, route and authorization regression, no unintended API/schema change, and fresh interaction evidence. No Production or Windows deployment is implied here.
