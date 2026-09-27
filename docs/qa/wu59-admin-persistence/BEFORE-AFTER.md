# WU-59 before and after

Base: `8980521550625e724fcc0b2bda9c46d93eeb0023`. Scope is fixed in `SCOPE.md`. The audit, decisions, and frozen contracts were copied unchanged from the completed audit checkout.

| Area | Before | After |
|---|---|---|
| Georeference | Local calibration could be lost on route exit; Reset wording did not identify saved versus local state | Saved calibration snapshot, dirty route guard, separate local clear and discard, save feedback; removal remains an immediate confirmed command |
| Map Settings | Independent section saves had no common leave/section-switch protection | Independent snapshots for name, translation, SEO, and branding; dirty section switch and route exit are guarded; unchanged Save disabled |
| Organization | Refetch could overwrite a profile draft; no route guard | Profile hydration pauses while dirty; unchanged Save disabled; route guard covers profile and unsent invitation email |
| Fields | In-page field switching was guarded, route exit and new-field draft were not | Route guard covers both drafts; Cancel clears the new-field draft; Save and commands reject duplicate requests |
| Spot Detail | Core SpotForm had a guard, but English draft did not | One page guard covers core and English drafts; English save has its own snapshot; core Save clears dirty only after a successful PATCH; core Cancel restores the saved form in place |
| Categories | English editing mutated the displayed source before Save; category target change could replace an edit | Per-category English drafts, own saved snapshots, leave guard, target-switch confirmation, unchanged Save disabled |
| Assigned Spot Editor | Revision form could be left without a warning; Save had no scoped state feedback | Draft snapshot and guard; Save busy/success/error; failed request retains input; photo upload announces its separate effect |
| Paper Edit | Existing draft and guard, but ambiguous Reset and incomplete success feedback | Explicit discard-to-saved action, save states, unchanged Save disabled, duplicate PDF request prevention; layout unchanged |
| PIN Editor | Visual draft and target guard existed, but save feedback and pending-state locking differed | Scoped SaveFeedback for position/design, guarded transitions while pending, unchanged design Save disabled; removal remains immediate |

No API, Prisma schema, migration, authorization, publication state, coordinate algorithm, or persisted geometry format changed. Decoration geometry, Paper desktop column reversal, and broad navigation/publication wording changes remain in later phases.
