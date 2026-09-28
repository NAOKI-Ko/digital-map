# WU-65 — Executive decisions

Date: 2026-09-29 · Findings: AQUA-005, AQUA-010, AQUA-013 · **DESIGN-READY**

Behavioral authority: `NAOKI-Ko/digital-map`, `dev`, **`2b5178859e236e07965d6106dbfae22fa2984037`**. GitHub dev and the inspected source checkout agreed. This is a documentation-only decision, not implementation acceptance or authorization to deploy. No application/Prisma/QA/data changes, migrations, commits, PRs or deployments were made.

## Verdict

Use **existing CSV v3 + focused Spot List commands + optional Category PIN defaults + a continuous floor placement queue**. Expose the sequence through existing screens. Do not build a dedicated setup Wizard, spreadsheet grid, Map presets, photo bulk assignment or a separate Placement entity in WU-65.

The operator can create 37 structured records in one import, choose repeated visual policies in groups, assign only the relevant photos, visually place 37 PINs in five floor sessions, mark the reviewed placed set as publication targets once, then use the existing visitor preview. No detail visit is required solely for shared classification, Floor, eligibility or style decisions. Content authorship and spatial judgment remain real work.

## Decisions D1–D10

Evidence keys refer to the pinned source inventory and provenance in [01](01-CURRENT-WORKFLOW.md). Each row is a decision, not a list of unresolved options.

| ID | Decision | Evidence | Alternatives considered / why chosen | Future compatibility | Migration impact | Main risk |
|---|---|---|---|---|---|---|
| D1 | Category **may** influence PIN appearance through an optional, separately edited default. | E1/E5/E8; AQUA-005: icons and PINs are independent today. | Keep full independence; mandatory Category styling; separate visual taxonomy. Optional default removes repeated styles without turning every classification into visual policy. | Semantic membership stays many-to-many and independent of rendering. | Existing Category defaults are absent; existing PINs remain individual. | Users may confuse Category icon with default PIN; show both distinct previews. |
| D2 | Dynamic inheritance in editable content, explicitly adopted; resolved concrete style in each release. Full style tuple, no per-property cascade. | E5/E8/E9; release snapshot boundary already exists. | Copy on creation, repeated bulk copy, dynamic public lookup. Live inheritance supports maintenance; immutable release resolution preserves publication ownership. | One shared resolver can later receive Placement data. | Add optional Category style and Spot source metadata; do not rewrite legacy styles. | A default edit affects many LIVE PINs; preview/count/version check required. |
| D3 | Store an explicit **PIN用カテゴリー** chosen from membership. Multi-category has no implicit winner. A reviewed bulk command can bind each single-category Spot to its sole category. | E1/E4/E10; zero/multiple categories and OR filtering are valid. | Primary semantic Category, first element, category priority. Reject order/priority and semantic-primary coupling; Restaurant can remain 飲食 + 休憩 and use 飲食 visually. | Visual choice belongs to current placement context, not global Content classification. | New/source-unselected records use standard style; old records remain individual. | Multi-category groups require an explicit choice; this is real classification judgment. |
| D4 | Explicit override belongs to **placement appearance**, temporarily stored in current Spot PIN fields. Modes: 標準ピン / カテゴリー既定 / 個別設定. Reset is an explicit saved change. | E1/E5; one Spot currently owns one PIN/Floor. | Content-wide override or new Placement table. Keep current storage, document placement ownership; do not solve AQUA-006. | Move source/override fields with x/y/Floor into future Placement; Content can share memberships. | Preserve existing full tuple and asset references as individual mode. | Old writers must not unknowingly overwrite inheritance; gate writer rollout. |
| D5 | Bulk: category add/remove; eligibility after placement; explicit style-source adoption/reset/freeze; Floor assignment only for coordinate-free, target-excluded records. No category Replace or arbitrary field grid in first release. | E2/E3/E4: bulk already exists; CSV covers fields. | Broad bulk editor, coordinate transfers, pre-placement publication intent. Focus on repeated safe policies and protect geometry. | Commands address current Spot, later placement IDs for spatial/visual operations. | New commands/API concurrency, generally no extra schema beyond D2/D4. | Stale selection, overlapping filters and source removal can change unintended objects. |
| D6 | Per-item: placement/move, photo choice/order, exceptional content and custom visual overrides. Typed repetitive content can already use CSV. | E5/E6/E7 and three supplied UAT photos. | Bulk photo reuse, automatic placement, mandatory photos. Reject unsupported automation/requirements. | Media ownership stays reusable asset plus association. | None for domain; contextual photo action reuses association model. | Queue must not become auto-save or lose candidates. |
| D7 | CSV owns structured text, existing/new row identity, new-row Floor assignment, semantic categories, enabled fields/translations. **No new business columns** now. Add a valid new-row CSV starter and clearer handoffs. | E3: these columns already exist; empty export has headers only. | Add eligibility, Floor-intent, media IDs, style/coordinates. One post-placement bulk action beats introducing publication intent; visual grouping belongs in UI. | Existing v3 remains stable; spatial/appearance state stays out of content import. | No format/version bump or schema change. Source-reference safety must be added to all category writers. | A new-row starter must populate metadata without making operators author IDs. |
| D8 | No dedicated Wizard. A resumable task strip and filtered queues on existing screens. | E2/E5/E9/E11; returning operators use the same jobs. | Forced stages, new onboarding session state, no guidance. Guidance without duplicate persistence/state machine. | Recomputes from data, works for initial and ongoing maintenance. | None. | Task strip could imply optional photos/categories are mandatory; separate suggestions. |
| D9 | Lightweight factual status: Floor + placement, publication target, photo count, optional style-source badge; filtered task counts. No readiness percentage or five checks on every row. | E2 lacks photos but already shows placement/eligibility/categories. | Full checklist per row, universal completion score. Facts reduce context switching without inventing completeness policy. | Later count placements per Content without redefining photo/content readiness. | Read-model/API additions only; no stored completion flag. | Do not label LIVE eligibility “currently public”; retain release distinction. |
| D10 | Neutral fixed Spot copy; configured field labels and existing retail defaults preserved. No Map preset system. | E7/E11; field definitions already configurable, default phone disabled. | Global retail-field rename, Aquarium-specific profile, dynamic copy presets. Few neutral labels solve demonstrated problem. | Same semantic keys, labels configurable by Map; no domain taxonomy fork. | None; no label/value/header backfill. | Hard-coded preview/error labels must respect configured labels or neutral errors. |

## Chosen model

**Model E, with placement-owned override:** Category supplies an optional PIN default; a chosen visual Category supplies the whole inherited tuple; individual mode supplies the whole explicit tuple. Category icon remains semantic legend/filter artwork. `importance` stays separate. See [02](02-CATEGORY-PIN-MODEL.md) for all transitions and [08](08-COMPATIBILITY-MIGRATION.md) for legacy adoption.

## Smallest coherent combination

| Option | Verdict |
|---|---|
| A — Better CSV | Keep v3 capability. Improve first-use starter/discovery; no business-column expansion. |
| B — Bulk editing | Reuse existing commands; add bounded style-source and safe unplaced-Floor commands, honest selection/conflict handling. |
| C — Category defaults | Adopt; largest new reduction in repeated styling and later maintenance. |
| D — Guided initial setup | Guidance through existing routes and queues; reject new Wizard/state model. |
| E — Combination | A + narrow B + C, with lightweight D. All use the same objects, resolver and Save boundaries. |

CSV alone already removes repeated basic forms but not shared visual policy. Bulk-copying styles improves first setup but leaves maintenance duplicated. Defaults alone leave import/discovery and queue overhead. A Wizard alone relocates repetition. The selected combination changes ownership of repeated work, not merely click counts.

## Delivery and implementation readiness

[01 Current workflow](01-CURRENT-WORKFLOW.md) · [02 Semantics](02-CATEGORY-PIN-MODEL.md) · [03 Bulk](03-BULK-OPERATIONS.md) · [04 CSV](04-CSV-RESPONSIBILITY.md) · [05 Flow](05-INITIAL-SETUP-FLOW.md) · [06 List](06-SPOT-LIST-DESIGN.md) · [07 Vocabulary](07-VOCABULARY.md) · [08 Compatibility](08-COMPATIBILITY-MIGRATION.md) · [09 Replay](09-AQUARIUM-BEFORE-AFTER.md) · [10 Slices](10-IMPLEMENTATION-PLAN.md).

**Open product decisions: zero.** Implementation may begin in a subsequent explicitly authorized implementation task, using the slice gates. This task stops at design. Evidence is source inspection plus supplied UAT/audit observations, not a new Windows session; predicted throughput must be tested with a disposable replay. AQUA-006/007 and Paper layout remain outside scope and are not declared solved.
