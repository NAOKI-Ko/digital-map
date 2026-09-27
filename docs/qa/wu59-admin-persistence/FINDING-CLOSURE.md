# Finding closure

The status below is for the full canonical audit finding. A finding spanning later approved WUs stays PARTIAL here even when WU-59's portion passes.

| Audit finding | Contract | WU-59 implementation | Test / evidence | Status |
|---|---|---|---|---|
| UX-001 Save/command model drift | Persistence | PIN, Paper, Georeference, Settings boundaries clarified; command actions preserved | `PERSISTENCE-MATRIX.md`, browser interactions | PARTIAL — Decoration geometry is Phase 2 |
| UX-002 Georeference draft protection | Persistence + Visual | Saved snapshot, route guard, local clear versus discard, save states | Georeference browser dirty/restore check; spatial audit | CLOSED for Phase 1 |
| UX-003 Visual Editor layout | Visual | No layout change in WU-59 | Scope check | DEFERRED to Phase 2 |
| UX-004 Unsaved form protection | Persistence + Navigation | Settings, Organization, Fields, Spot English, assigned Editor, Categories drafts guarded | `DIRTY-GUARD-QA.md`; full tests | CLOSED for Phase 1 |
| UX-005 Save feedback inconsistency | Persistence feedback | Scoped SaveFeedback or existing action feedback across nine routes | Browser Save/error checks | PARTIAL — Decoration/Publish later scope |
| UX-006 Navigation ownership | Navigation | No IA changes | Scope check | DEFERRED to Phase 3 |
| UX-007 Return context | Navigation | No route redesign | Scope check | DEFERRED to Phase 3 |
| UX-008 Georeference accessibility | Visual accessibility | No wizard interaction redesign | Scope check | DEFERRED to Phase 4 |
| UX-009 Paper responsive layout | Visual responsive | Existing layout retained; 390/1024/1440 smoke check | `BROWSER-QA.md` | DEFERRED to Phase 2 layout QA |
| UX-010 Publication vocabulary | Vocabulary | No broad wording rewrite | Scope check | DEFERRED to Phase 3 |
| UX-011 Component consolidation | Components | Existing primitives reused; no universal shell | Code review | DEFERRED to Phase 4 evaluation |
| UX-012 Category English name pre-save mutation | Persistence | Local per-category English draft and saved snapshot | Code review, category browser checks | CLOSED for Phase 1 |

Next recommended WU: Phase-2 Visual Editor work, beginning with Decoration geometry's saved visual draft and the separately approved Paper Edit desktop orientation. Preserve this WU's persistence boundaries and API/coordinate semantics.
