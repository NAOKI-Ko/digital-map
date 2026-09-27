# Admin UX audit decisions

**Decision status:** `CONTRACTS-FROZEN-WITH-EXCEPTIONS` on 2026-09-28. Source SHA `8980521550625e724fcc0b2bda9c46d93eeb0023`. AS-IS findings remain unchanged in `docs/audit/admin-ux-as-is-20260928/08-FINDINGS.md`. These decisions set target behavior; they do not claim implementation or fresh browser validation.

| Hypothesis | Decision | Evidence and resolution |
|---|---|---|
| H1 — PIN left sticky Preview/right Inspector is strongest reference | **ACCEPT with scope** | `editor.vue:439-462` and WU-56 visual QA show document scroll, `top:24px` desktop and normal 390px flow. It is the reference for long canvas-plus-inspector editors, not every visual task. |
| H2 — Paper New and Edit are different jobs and need not share shell | **ACCEPT** | `paper/new.vue:26-30` is preview-led design selection and creation; `paper/[paperMapId].vue:57-77` is long-form content/viewport editing. New keeps left preview/right sticky choices. Edit migrates to the default left sticky Preview/right Inspector on desktop; task difference does not justify opposite long-editor orientation. |
| H3 — Decoration missed sticky Preview rollout | **MODIFY** | `decorations.vue:233-280` has a left canvas and short right controls, so sticky is conditional on measured length, not mandatory. Its gesture-by-gesture PATCH (`:52-79,97-229`) is the larger interaction gap: geometry should become `VISUAL_DRAFT_SAVE`; add/delete/duplicate/layer stay explicit commands. |
| H4 — Georeference is a specialized spatial wizard | **ACCEPT** | `GeoReferenceWizard.vue:322-351` has illustration and real-map peer canvases for two-point matching. Keep the geometry and task sequence; apply draft Save/dirty protection and keyboard alternative without forcing a generic inspector. |
| H5 — Persistence inconsistency outweighs cosmetic inconsistency | **ACCEPT** | Audit UX-001/002/004/012 document silent loss or ambiguous commit boundaries; UX-011 is P3 styling drift. Persistence work precedes component consolidation. |
| H6 — WU-41 IA is sound; later drift is mainly interaction-level | **MODIFY** | WU-41 URL-authoritative Map, role-aware sidebar and Map Home still hold; WU-50/51 refined rather than replaced them. Audit UX-006/007 also found genuine ownership/back-vocabulary drift, so IA needs a focused pass without a structural rewrite. |
| H7 — formal contracts reduce future drift | **ACCEPT as policy** | 32 routes use recurrent form, visual, command and navigation patterns, with inconsistent guards/feedback. These four contracts become the review criteria for future WUs. Whether they reduce drift in practice must be checked in later audits. |

## Boundaries and explicit product choices

- **Paper Map Edit:** target desktop Preview-left/Inspector-right. Preserve paper-first mobile order, interactive Preview selection, source/override explanation and PDF-from-unsaved-draft disclosure. Browser geometry remains an implementation acceptance gate, not an open product decision.
- **Decoration:** stage position/size/rotation changes; keep add/delete/duplicate/layer as immediate commands. Short controls do not justify mandatory sticky canvas. Dirty draft must be resolved before a command that depends on it.
- **Georeference:** retain two-point wizard and paired canvases; use visual draft persistence/guard and provide keyboard-operable point selection.
- **Publication:** primary mental model is **編集中の内容** versus **公開中の内容**. When the Map is private but a ready release is retained, name that source **前回公開した内容**, because current `server/utils/paper-map.ts` permits using it.
- **Navigation:** retain URL Map authority and WU-51 Workspace switch. Keep one primary parent for each domain, with contextual entry/return links rather than route churn.

## Evidence hierarchy

Current `dev` source establishes AS-IS behavior. Historical WU-41/50/51/56/57/58 and Paper adoption records establish prior intent and tested baselines. The AS-IS audit did not run a fresh authenticated browser session; future implementation WUs must verify geometry, focus and persistence with disposable data. No business/product choice remains unresolved in this decision pass. This is not a claim that every interaction has been empirically validated.
