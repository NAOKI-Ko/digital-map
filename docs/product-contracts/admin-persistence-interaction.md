# Admin persistence, Save and dirty-state contract

**Status:** Frozen product decision, 2026-09-28. **Source:** `origin/dev` `8980521550625e724fcc0b2bda9c46d93eeb0023` and `docs/audit/admin-ux-as-is-20260928/`. This describes target interaction behavior, not an assertion that every page already complies. Internal APIs and domain models need not adopt these names.

## Choose one persistence model for each action

| Model | Use when | User promise | Current examples / target classification |
|---|---|---|---|
| `FORM_EXPLICIT_SAVE` | Editing structured fields or a bounded configuration | Changes remain a local draft until the named Save/Submit action succeeds | SpotForm, Map New, Map/Workspace settings by section, Fields/Category item editors, translations, Paper design request, assigned Spot revision form |
| `VISUAL_DRAFT_SAVE` | Manipulating an artifact while comparing candidate output | Preview can change locally; Save commits; Cancel restores the last saved snapshot | PIN position/design, Paper Map Edit, Georeference two-point draft, Decoration geometry (position/size/rotation) target |
| `COMMAND_IMMEDIATE` | One discrete server operation with no editable draft | Activation commits once; resulting state is stated | Publish/unpublish/release restore, approve/reject, delete, duplicate, assignment, reorder, import commit, remove PIN placement, Decoration add/delete/duplicate/layer order |

A page can contain multiple models, but **each action must be visibly classifiable**. For example, Paper Map Edit is `VISUAL_DRAFT_SAVE` for content and `COMMAND_IMMEDIATE` for a PDF download only in the sense of an output action; downloading does not persist a draft. Media upload may persist an asset before the surrounding form is saved. The UI must not imply that Cancel deletes an uploaded asset unless that is actually guaranteed.

## `FORM_EXPLICIT_SAVE`

1. Load a saved snapshot for the object or named section. Edit a separate local draft. Dirty means the draft differs in meaningful persisted fields; focus, tab selection and transient UI state do not make it dirty.
2. Provide a named Save/Submit action; disable it when unchanged where practical. Show a busy state, prevent duplicate submission and preserve the draft on failure.
3. Show success at the action's scope and error near the relevant controls. A successful section save clears **that section's** dirty state only. A failed save leaves the draft dirty and editable.
4. Guard route exit, browser/tab close and switching the editing target or section whenever meaningful unsaved values would be lost. A guard offers **stay** or **discard**; an in-page switch may also offer **save and continue**. Do not silently commit in order to navigate.
5. “Cancel” leaves the form without persisting the draft and follows the navigation-parent contract. “Reset/変更を戻す” reloads the last successfully saved snapshot in place. Confirm discarding when dirty. These labels must not be used for a server DELETE.
6. Multiple settings sections may save separately. Display the section boundary and do not show a page-wide success state that suggests other sections were saved.

Existing `SpotForm` already supplies a useful dirty guard; Map Settings, Organization, Fields route exit, Spot English translation, Category English name and assigned Spot Editor need contract alignment (audit UX-004/012).

## `VISUAL_DRAFT_SAVE`

1. Keep a saved snapshot and a local candidate. Label or otherwise distinguish a preview of unsaved changes from saved output. Direct manipulation and inspector fields update the candidate without server persistence.
2. “Save” commits the current candidate. “Cancel/変更を戻す” restores the saved snapshot and its visual representation. Failed Save keeps the candidate for retry and does not falsely report success.
3. Guard route exit, tab close, switching Spot/floor/design/selection target, and any modal transition that would discard a candidate. If an immediate command depends on a dirty candidate, require Save or Discard first; do not silently mix saved and unsaved state.
4. Show busy, success and error feedback with accessible status/alert semantics. Feedback must identify the object or section if more than one can be edited.
5. The preview may be interactive, but a visual change alone never means persisted.

PIN is the existing reference. Paper Edit retains its documented exception: **PDF is generated from the current preview/draft without silently saving it**; the UI must say so and saving remains a separate action (`paper-map-easy-builder-v1.md`). Georeference is a specialized wizard but uses this persistence model for its two-point candidate. Decoration's current gesture-by-gesture PATCH is a **migration target**, not behavior this document claims is already present. Keep add/delete/duplicate/layer commands immediate with explicit feedback; settle a dirty geometry draft before invoking one.

## `COMMAND_IMMEDIATE`

- Use an action verb and the target/resulting state, never a fake Save button. Disable or busy-lock while a command runs. On failure retain or restore the displayed prior state and show an error.
- Confirm destructive, hard-to-reverse, scope-wide, or publication-affecting commands in proportion to risk. The confirmation must name the consequence. Harmless reversible commands need not acquire confirmation solely for uniformity.
- After success, refresh or reconcile the authoritative state and announce the result. “Delete”/“remove” must not look like a local Reset. Reordering and assignment are immediate commands, not auto-save.
- Publication and approval commands keep existing authorization and server checks; UI feedback is not a substitute.

## Auto-save policy and feedback

Silent auto-save is allowed only for low-risk, reversible **presentation preferences** (for example, sidebar expansion), clearly separate from business data. Domain data, visual positions, content and publication state require one of the three explicit models. This does not forbid an expressly labeled immediate command.

Use one primary success/error channel per action. Persistent in-place feedback suits explicit Save; a transient toast can suit an immediate command if the resulting state is visible and the announcement is accessible. Avoid simultaneous competing success messages. Busy state is required but is not sufficient success feedback. Validation errors belong near the affected field; server errors should preserve the draft.

## Acceptance questions for future WUs

For every editable route, identify the saved snapshot, draft scope, dirty computation, mutation trigger, Cancel target, failure behavior, route/target guard, success announcement and exact resulting server state. Test keyboard and browser-close journeys at 390, 768, 1024 and 1440 px where relevant. Do not change server persistence semantics merely to share a component.
