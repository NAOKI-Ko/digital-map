# Component consolidation decision

Reviewed Paper Edit, Decoration, Georeference, Settings, Categories, and PIN against the strict semantic threshold.

Georeference and Decoration Save/Discard controls now use the existing `UiButton` primitive. This shares touch target, disabled/busy behavior, and focus styling across two actual visual editors. `UiButton` itself gained a visible focus ring. Georeference keeps its in-flow action placement; Decoration keeps its inspector action area. Both retain their existing draft guards and feedback components.

The remaining page-specific action layouts do not have identical responsive geometry or semantics: Paper has a mobile action bar; PIN uses inspector actions; Settings and Categories contain section or row-specific forms. Their duplication is local and intentional. No new universal editor/form/page component was created. `SaveFeedback`, `UnsavedChangesGuard`, and existing dialog primitives remain the shared behavior boundary.

**UX-011: CLOSED** for the audit's interaction-critical button drift. Remaining local Tailwind markup does not currently justify another abstraction. If future editors repeat an identical action row, revisit with browser evidence.
