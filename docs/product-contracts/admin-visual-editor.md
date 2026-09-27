# Admin visual-editor contract

**Status:** Frozen product decision, 2026-09-28. **Source:** `8980521550625e724fcc0b2bda9c46d93eeb0023`, AS-IS audit `03-VISUAL-EDITOR-AUDIT.md`, WU-56 visual QA and Paper Map adoption evidence. This is a target layout/interaction rule, with explicit task exceptions.

## Classification

A **Visual Editor** lets a user change a visual artifact and repeatedly compare controls with its candidate appearance. PIN position/design, Paper Map Edit and Decoration geometry qualify. Paper Map New is a **Selection/Preview flow**: the user compares generated finished designs before creation. Georeference is a **spatial calibration wizard** with two peer canvases and ordered point selection. A short visual task may qualify without needing sticky behavior.

## Default for a long-form live-preview editor

```text
Desktop ≥ lg when geometry permits
[ Preview / Map / Canvas — LEFT, sticky ][ Inspector — RIGHT, document scroll ]
```

- Preview is on the **left** and Inspector on the **right**. When Inspector content materially exceeds the Preview, the Preview remains visible during normal page scrolling. PIN Editor is the existing strongest reference (`editor.vue:439-462`; WU-56 measured top 24 px at 1024/1440).
- Sticky starts at a desktop breakpoint chosen from actual available width, clears any sticky header, remains within the workspace, and ends naturally at its bottom. Cap/scale the Preview so its meaningful controls fit available viewport height. A sticky Preview that hides its own lower controls fails this contract.
- The page/document remains the primary scroll. Do not impose an Inspector-only scroll container simply to pin the Preview. Small, bounded lists may scroll independently when their content truly requires it and are keyboard usable.
- Put context and mode controls before the workspace; place Save/Cancel where the current editing task makes them discoverable. Sticky/fixed actions must not obscure focus, errors or the Preview.
- Candidate changes update the Preview; selection in Preview and Inspector stays synchronized. Explicitly follow `VISUAL_DRAFT_SAVE` for edits, including target switches and failures.

## Mobile and tablet

Default order is Preview → controls → actions in normal document flow. No full-height sticky preview, nested page-height trap, or horizontal overflow. A compact fixed action bar is allowed only with enough scroll/focus clearance and safe-area spacing; it is not the default. At tablet widths, choose the one-column flow unless both canvas and controls remain usable. Verify 390, approximately 768, 1024 and 1440 px and a short desktop viewport with a long Inspector.

## Explicit screen decisions

| Screen | Decision | Reason / boundary |
|---|---|---|
| PIN Editor | **Reference: keep** left sticky Map and right Inspector | Current WU-56 behavior demonstrated persistent Map visibility and normal mobile flow. Do not convert to a generic paper preview. |
| Paper Map New | **Keep as Selection/Preview exception**: large Preview left, design choice panel may be sticky right | Its job is comparing finished designs and creating one item, not editing many fields. No draft persistence before Create. |
| Paper Map Edit | **Migrate desktop orientation to Preview LEFT / Inspector RIGHT**; retain preview-first mobile order | It is a long-form live-preview editor. Current right-sticky Preview is an inconsistent scanning/scroll contract (`paper/[paperMapId].vue:57-77`). The paper-first emphasis survives through size, first visual position and interactive slot selection. This is a product decision, not a claim of measured superiority; validate paper readability and multi-page height before shipping. |
| Decoration Editor | **Keep left Canvas/right controls. Do not require sticky while controls remain short; add sticky only when measured control length warrants it.** Geometry edits adopt visual draft persistence | Current canvas is left, controls short, and no evidence proves sticky improves the task. The horizontal rollout gap is the missing rule and inconsistent save semantics, not automatically the absence of `position:sticky`. |
| Georeference | **Keep specialized spatial calibration wizard** with illustration and real map as peer surfaces | Two-point matching and validation are the task. It follows visual draft Save/dirty protection, not the generic left-preview/right-inspector shell. |

## Reusable shell threshold

A shared layout shell is optional only if at least two workflows share side order, sticky containment, responsive order, toolbar/action geometry and focus behavior. Do not create one universal editor component. Domain canvases, point math, print pagination and inspectors stay separate. Contracts take precedence over component reuse.

## Migration risks to test

Paper print previews can be tall or multi-page. At 1024 and short desktop heights, ensure sticky bounds never hide page controls or the Inspector. Check Preview-to-inspector and inspector-to-Preview selection, Save/PDF draft behavior, focus visibility, keyboard alternatives and 390/768 flow. Decoration draft migration must avoid server writes per arrow/drag and must settle dirty state before discrete commands. Historical QA is baseline evidence, not a substitute for fresh implementation QA.
