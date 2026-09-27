# Visual Editor AS-IS audit

## Current desktop structures

```text
PIN (lg≥1024):       [ Map, sticky top 24px ][ Inspector, document scroll ]
Paper New (lg≥1024): [ Preview, nonsticky   ][ Design choices, sticky top 20px ]
Paper Edit (lg≥1024):[ Inspector, scroll     ][ Preview, sticky top 112px ]
Decoration (lg≥1024):[ Canvas, nonsticky     ][ Media/operation controls ]
Georeference (xl≥1280): [ Illustration point canvas ][ Real-map point canvas ]
```

| Screen | Preview / inspector sides | Sticky and height | Scroll / toolbar / save | Mobile / live interaction | Classification |
|---|---|---|---|---|---|
| PIN | Map left / inspector right | `lg:sticky lg:top-6`; map height constrained by viewport in editor | Document scroll; toolbar above grid; save/cancel inside inspector | Map then inspector; marker/design preview updates locally; position click and candidate; guard on dirty | Strong long-inspector reference |
| Paper New | Paper preview left / choices right | Right aside `lg:sticky lg:top-5`; preview not sticky; preview intrinsic page aspect | Document scroll; create in right aside; no unsaved model before create | Preview then choices; design choice refreshes preview | Justified exception: choosing among finished outputs; test long previews |
| Paper Edit | Inspector left / paper preview right | Preview `lg:sticky lg:top-28`; sticky header `lg:sticky top-0`; preview page height depends on paper | Document scroll; Save/Reset/PDF in header, fixed bottom at mobile; list selectors have bounded inner scroll | Preview first (`order-first`), inspector second; preview slot/Spot click selects editor and editor edits update preview; guard | Historical orientation difference; paper output emphasis partly justifies, desktop contract still undecided |
| Decoration | Canvas left / controls right | No sticky; canvas height from floor aspect ratio | Operation commits on pointer-up/key; no global save/cancel | Stack canvas then controls; keyboard transform handlers and labelled handles | Historical rollout gap in persistence and sticky; sticky need depends on control length |
| Georeference | Illustration left / real map right at `xl` | Neither sticky; paired canvases, step list and save below | Ordered 2-point workflow; explicit save; map canvas may scroll internally | Stack paired canvases; image point chosen by click and map point selected | Justified task-specific exception; no generic inspector |

**Nested scroll:** Paper Edit selection lists (`max-h-40/48 overflow-auto`) and field picker (`max-h-72`) create bounded subscrolls. The main visual workspaces use document scrolling. Whether Paper's sticky preview exceeds short laptop height was not measured in this audit. The source does not establish a no-trap guarantee at every viewport.

**Pointer/keyboard:** Decoration has key handlers for moving, resizing and rotating. Paper viewport has focusable arrows and button alternatives; Paper ordering uses buttons. Georeference illustration points are selected through an `<img @click>`; no equivalent keyboard point-selection control was found in `GeoReferenceWizard.vue` (UX-008). PIN position selection needs a fresh keyboard pass; source offers map click plus geocoding and inspector controls.

## Hypothesis results

| Hypothesis | Result | Evidence |
|---|---|---|
| H1 PIN strongest Visual Editor pattern, incomplete rollout | **Partly confirmed.** Strong for long Map/Inspector work; not universal | `editor.vue:439-462`; WU-56 visual QA |
| H2 Paper New/Edit inconsistent orientation/sticky | **Confirmed, with task difference.** New previews left and choices sticky; Edit previews right and sticky | `paper/new.vue:26-30`; `paper/[paperMapId].vue:57-77` |
| H3 Decoration predates sticky pattern | **Layout gap confirmed; origin uncertain.** Canvas is not sticky; controls are shorter than Paper Inspector | `decorations.vue:233-280`; no change-history attribution proven |
| H4 Georeference specialized exception | **Confirmed.** Two equivalent spatial canvases, four-stage point task; forcing one into inspector would change task | `GeoReferenceWizard.vue:322-351`; page `:145-190` |
| H5 Save/Cancel less consistent than visuals | **Confirmed.** Draft vs operation commit vs section save; guard coverage varies | [save matrix](04-SAVE-STATE-AUDIT.md) |
| H6 WU-41 IA sound; later features drift | **Partly confirmed.** Shared spine remains; Paper routes fit Operations but custom header/action shell and back vocabulary differ | `admin-navigation.ts`; WU-41 design/QA; Paper pages |
| H7 formal contracts useful | **Supported hypothesis**, not proven user outcome | repeated shell/feedback/save deviations across 32 routes |

**FACT:** orientations and breakpoints above are from current source. **INCONSISTENCY:** comparable long editors place the preview on opposite sides and handle sticky differently. **IMPACT:** users cannot transfer scanning/scroll expectations; Preview can leave view in Decoration. **HYPOTHESIS:** classify visual tasks by editing intent and use a common shell only for live canvas-plus-long-inspector screens.
