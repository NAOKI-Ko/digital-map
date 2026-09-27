# Canonical finding register

Findings are grouped at the smallest useful product level. Severity follows the requested P0–P3 scale; there are **0 P0, 0 P1, 9 P2, 3 P3**. Scope: **2 SYSTEMIC, 6 PATTERN, 4 LOCAL**. No observed browser failure is claimed where only source was available.

## UX-001

- **ID:** UX-001
- **Severity:** P2
- **Scope:** SYSTEMIC
- **Area:** Persistence semantics
- **Screens:** PIN, Paper Edit, Decoration, Georeference, Settings
- **Evidence:** `editor.vue:209-233`; `paper/[paperMapId].vue:46-53`; `decorations.vue:52-79`; `georeference.vue:75-127`
- **Current behavior:** PIN/Paper stage drafts; Decoration commits each gesture; Georeference/Settings require explicit save.
- **Comparable behavior:** Comparable visual editing actions are not consistently marked as draft versus committed.
- **Why this matters:** Users cannot predict whether leaving, reset or PDF uses saved data.
- **Likely origin:** Incremental feature-specific implementation; exact historical cause unverified.
- **Recommendation direction:** Define visible persistence states and action language by operation; retain justified immediate operations.
- **Confidence:** High

## UX-002

- **ID:** UX-002
- **Severity:** P2
- **Scope:** LOCAL
- **Area:** Dirty navigation
- **Screens:** Georeference
- **Evidence:** `georeference.vue:20-74,145-190`; no guard import/render
- **Current behavior:** Two-point draft may be changed then route/back navigation proceeds without a dirty prompt.
- **Comparable behavior:** PIN and Paper Edit use `UnsavedChangesGuard`.
- **Why this matters:** Completed point selection can be lost before Save.
- **Likely origin:** Specialized wizard implementation; origin unverified.
- **Recommendation direction:** Add a route/tab exit decision after validating point-draft semantics.
- **Confidence:** High

## UX-003

- **ID:** UX-003
- **Severity:** P2
- **Scope:** PATTERN
- **Area:** Visual workspace
- **Screens:** PIN, Paper New/Edit, Decoration
- **Evidence:** `editor.vue:439-462`; `paper/new.vue:26-30`; `paper/[paperMapId].vue:57-77`; `decorations.vue:233-280`
- **Current behavior:** Preview side and sticky target differ in four workspaces.
- **Comparable behavior:** PIN has left sticky map; Paper Edit has right sticky paper; Paper New sticks right choices; Decoration sticks neither.
- **Why this matters:** Long controls have different preview visibility and scanning order.
- **Likely origin:** Post-WU-41 features evolved separately; exact intent not proven.
- **Recommendation direction:** Decide task classes and a visual shell contract, with explicit Paper New/Georeference exceptions.
- **Confidence:** High

## UX-004

- **ID:** UX-004
- **Severity:** P2
- **Scope:** PATTERN
- **Area:** Dirty navigation
- **Screens:** Settings, Organization, Fields, Spot translation, assigned Spot Editor
- **Evidence:** `settings.vue:67-180`; `fields.vue:79-123`; `SpotForm.vue:188`; `spot-editor/[spotId].vue:58-132`
- **Current behavior:** Section or revision drafts lack a shared route-leave prompt; Fields only guards in-page changes.
- **Comparable behavior:** SpotForm, PIN and Paper Edit guard route exit.
- **Why this matters:** Admins can leave a partly edited form believing the same protection applies.
- **Likely origin:** Mixed page-level and component-level implementation.
- **Recommendation direction:** Audit each editable section and apply a consistent guard where unsaved state exists.
- **Confidence:** High

## UX-005

- **ID:** UX-005
- **Severity:** P2
- **Scope:** PATTERN
- **Area:** Save feedback
- **Screens:** PIN, Paper, Decoration, Georeference, Settings, Publish
- **Evidence:** `SaveFeedback.vue`; page component usage; `useToast` imports
- **Current behavior:** Comparable successful mutations use persistent status, toast, inline message, or button-only state.
- **Comparable behavior:** SpotForm/Settings use SaveFeedback; Decoration uses toast; Paper Edit offers no success text beyond clean Save state.
- **Why this matters:** Success and failure acknowledgment moves between locations.
- **Likely origin:** Feature-specific delivery.
- **Recommendation direction:** Set per-action feedback placement and accessibility contract.
- **Confidence:** High

## UX-006

- **ID:** UX-006
- **Severity:** P2
- **Scope:** PATTERN
- **Area:** Information architecture
- **Screens:** Categories, Fields, Floors, Settings, Editors, Revisions
- **Evidence:** `admin-navigation.ts:30-143`; `AdminSubnavigation.vue`
- **Current behavior:** Categories is first-class; Fields is within Illustration Map; Editors is Team plus Settings link; Revisions is Team plus Spot tab.
- **Comparable behavior:** Related entities have more than one parent model.
- **Why this matters:** Discovery and return paths require memorizing feature-specific locations.
- **Likely origin:** WU-41 base plus later feature growth; intent of each placement unknown.
- **Recommendation direction:** Validate user mental model and define one primary parent per entity with contextual links.
- **Confidence:** High

## UX-007

- **ID:** UX-007
- **Severity:** P3
- **Scope:** PATTERN
- **Area:** Back/title vocabulary
- **Screens:** Georeference, Spot New/Detail, Paper New/Edit
- **Evidence:** `georeference.vue:29-33,146`; `spots/new.vue:21-25,124`; `spots/[spotId]/index.vue:16,126`; Paper back links
- **Current behavior:** Some pages retain originating context while others always return to a fixed list/dashboard.
- **Comparable behavior:** Georeference and New Spot have explicit contextual exits.
- **Why this matters:** Deep-link users face inconsistent expectations for “戻る”.
- **Likely origin:** Local page routing decisions.
- **Recommendation direction:** Document default parent and contextual return rule in header contract.
- **Confidence:** High

## UX-008

- **ID:** UX-008
- **Severity:** P2
- **Scope:** LOCAL
- **Area:** Keyboard spatial input
- **Screens:** Georeference
- **Evidence:** `GeoReferenceWizard.vue:328-351`
- **Current behavior:** Illustration points are selected by click on an image; no keyboard-equivalent point selector was found.
- **Comparable behavior:** Paper viewport has keyboard arrows/buttons; Decoration has key handlers.
- **Why this matters:** Keyboard-only users may be unable to complete alignment.
- **Likely origin:** Map-specific interaction design; origin unknown.
- **Recommendation direction:** Provide non-pixel keyboard point entry/selection after task validation.
- **Confidence:** Medium; browser test needed

## UX-009

- **ID:** UX-009
- **Severity:** P3
- **Scope:** LOCAL
- **Area:** Mobile action placement
- **Screens:** Paper Edit
- **Evidence:** `paper/[paperMapId].vue:53-77`; historical `docs/qa/paper-map-adoption-final/browser/editor-390.png`
- **Current behavior:** Mobile action bar is fixed at bottom; page reserves `pb-24`; screenshot shows it over the scroll viewport.
- **Comparable behavior:** SpotForm uses `UiFormActions sticky-mobile`; other forms keep actions in flow.
- **Why this matters:** Focus visibility and preview reading may be tighter on 390px, especially with long inspector.
- **Likely origin:** Paper-specific editing shell.
- **Recommendation direction:** Measure focus/scroll clearance at 390 and 768 before altering.
- **Confidence:** Medium; no fresh browser

## UX-010

- **ID:** UX-010
- **Severity:** P2
- **Scope:** SYSTEMIC
- **Area:** Publication vocabulary
- **Screens:** Publish, Paper, Spot, Map Home
- **Evidence:** `publish.vue:125-172`; `paper/[paperMapId].vue:58,72-76`; Paper New source copy
- **Current behavior:** UI uses 公開中, 下書き, 公開版, 最新の編集内容, 現在の編集内容, and source modes across levels.
- **Comparable behavior:** Publish distinguishes Map visibility and release; Paper distinguishes LIVE/PUBLISHED; Spot has own publish state.
- **Why this matters:** The same “公開” family can mean Spot eligibility, Map visibility, or immutable release.
- **Likely origin:** Multiple domain layers, not necessarily wrong copy.
- **Recommendation direction:** Define entity-qualified publication terms and show propagation state.
- **Confidence:** High

## UX-011

- **ID:** UX-011
- **Severity:** P3
- **Scope:** PATTERN
- **Area:** Component primitives
- **Screens:** Paper, Decoration, Georeference, Settings, Categories
- **Evidence:** `UiButton.vue`; `UiFormActions.vue`; custom button classes in cited pages
- **Current behavior:** Shared buttons/actions exist, but many equivalent actions are restyled locally.
- **Comparable behavior:** SpotForm/PIN use shared primitives.
- **Why this matters:** Disabled appearance, touch target and layout drift can accumulate.
- **Likely origin:** Later screens use domain-specific markup.
- **Recommendation direction:** Consolidate only repeated interaction-critical variants after contract decision.
- **Confidence:** High

## UX-012

- **ID:** UX-012
- **Severity:** P2
- **Scope:** LOCAL
- **Area:** Category translation state
- **Screens:** Categories
- **Evidence:** `categories.vue:152-188`
- **Current behavior:** English name input binds directly to `category.englishName` before separate save.
- **Comparable behavior:** Category main editor keeps its own edit draft and Cancel path.
- **Why this matters:** An unsaved English value can appear in the list model as though saved; route exit is unguarded.
- **Likely origin:** Inline addition to management list; origin unknown.
- **Recommendation direction:** Use an explicit local translation draft and saved-state feedback.
- **Confidence:** High

