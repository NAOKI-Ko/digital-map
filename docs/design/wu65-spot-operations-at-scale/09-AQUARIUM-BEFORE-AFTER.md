# Aquarium operational replay

Workload supplied by the task: **5 Floors, 37 Spots, 6 Categories, 37 PIN placements, three available photos**. This is a model, not a timed replay or modification of Aquarium data. The underlying raw UAT click log is unavailable; source and audit boundaries are in [01](01-CURRENT-WORKFLOW.md).

## Assumptions and counts

Let P be the number of deliberate photo-to-Spot associations, E the number of exceptional content/design cases, and G the number of repeated visual-source groups. Three photos does **not** prove P=3: an image may be reused or unused. The simplest illustration uses P=3, one useful image on each of three exhibits, only as an assumption. We do not assume every Spot has exactly one Category or that every Category needs a distinct custom PIN style.

“37 saves” below means a possible/required domain write in that path, not 37 measured clicks. Review, validation and selection actions are additional. Time savings are not estimated.

| Work | Manual UI baseline supported by current source | Best existing dev CSV/bulk path | Proposed path / owner |
|---|---|---|---|
| Floor assets/configuration | Five Floor setups plus illustration/geo judgment as needed | Same | Same; no WU-65 Floor automation |
| Category setup | Six Category records/icons, no PIN defaults | Same | Six semantic categories; 0–6 optional PIN-default design saves, once per chosen group |
| Structured Spot records | 37 create forms/submissions; normal path enters Detail after each | One CSV preparation/preview/commit cycle for all 37 | One starter/preparation/preview/commit; same existing import capability, easier first use |
| Floor assignment | Chosen on each form (included in 37 submissions) | 37 Floor cells authored in the same CSV, no extra detail saves | Same; if wrong before placement, 1–5 Floor-group correction commands instead of per-record form updates |
| Classification | Category choices on forms or separate edits | Category column already assigns all 37 sets; existing ADD/REMOVE bulk can correct groups | Same structured import; no compulsory post-import classification pass |
| Visual policy | Default standard may need no edit; up to 37 individual style-edit/save sessions if distinct group styles are desired | Still up to 37 individual style sessions | Configure up to six Category defaults; one sole-category adoption command where applicable, plus up to six explicit multi-category source groups; E exceptions retain individual visual work |
| Photos | P per-Spot association decisions, generally reached through Detail | Same P decisions/Detail handoffs | Same P judgments/association commands in contextual list panels; missing-photo filter finds candidates without forcing photos on all 37 |
| PIN placement | 37 choose/start/candidate/save cycles | Same, already Floor-scoped unplaced search | **37 visual decisions and explicit saves remain**; five queue sessions replace repeated search/start for subsequent records; save-and-next preserves Floor/camera |
| Eligibility | Up to 37 per-Spot commands if using Detail; not technically necessary | One list bulk target-on for all reviewed positioned Spots (37 < cap100) | Same one reviewed bulk command after placement; no claimed 37→1 innovation here |
| Visitor review | Available in current dev through WU-64 | Existing authenticated Preview | Same Preview, plus factual lists to locate omissions; review all five Floors |
| Publish | Explicit Map publication | Same | Same; never combined with import/default Save/queue advance |

Category/Floor assignments inside a create form are not counted as extra saves on top of 37. Existing bulk is a real baseline alternative. Do not add hypothetical maximum counts together and call the sum a measured UAT cost.

## Proposed initial-build walkthrough

1. Register five Floors and six Categories; configure only needed fields and optional default styles once.
2. Generate a current new-row starter. Fill 37 names/structured records with human Floor/category values. Preview and import: 37 saved, unplaced, target-excluded, standard PIN source. No fake Spot or temporary publish is needed to obtain a CSV template.
3. Adopt shared visual policy. If all relevant records are single-category, one reviewed sole-category operation binds each to its own Category. If some have multiple memberships, group them by explicitly chosen source; with six possible sources, at most six such group operations are needed for those cases. No-category records stay standard unless deliberately overridden. Actual group count is unmeasured; do not promise one action for every dataset.
4. Associate the three photos where useful (P decisions; illustrative P=3), leave other Spots photo-free. Edit E exceptions only.
5. Enter five Floor queues and make 37 placements. Existing WU-64 Aquarium evidence reports eligible counts 11/4/6/9/7 by Floor; these total 37 and can guide later read-only comparison, but this pass did not revalidate live counts. The design requires no fixed distribution.
6. Filter positioned target-excluded Spots, select the reviewed 37 (or intentionally smaller subset), mark target-on once. Unplaced errors cannot be silently skipped.
7. Preview the next-release candidate across all Floors, then the operator may publish in a separately authorized implementation/acceptance workflow.

**North Star met conditionally:** repeated policies require zero individual Detail visits. The remaining P photo decisions, 37 spatial decisions and E exceptions are meaningful human work. CSV still requires 37 rows of real content; the design does not eliminate authoring or classification judgment. A facility with 37 truly unique visual requirements will still do 37 visual designs. We do not force a six-style taxonomy onto it.

## Existing Aquarium is a different replay

Do not re-import/recreate its 37 Spots or replace its existing 37 placements to demonstrate the feature. Migration leaves them individual, with all coordinates and public output unchanged. In a later authorized test, read-only compare baseline tuples; optional adoption is a deliberate user action with before/after previews. The projected initial-setup flow should be exercised on a disposable 37-Spot, five-Floor fixture. Existing Aquarium can verify legacy compatibility read-only; a live adoption rehearsal requires its own explicit authorization.

For maintenance, once adopted, changing one Category default updates its inherited LIVE group with one reviewed save; existing individual exceptions remain. The published Map remains unchanged until Publish. This is the substantive advantage over one-time bulk style copying.

## Acceptance measurements for later implementation

Record counts, not invented minutes: Detail visits used only for shared policies (target zero), import attempts/errors, shared style configuration/adoption commands, manual exceptions, search/reselection per placement, successful placement saves (37), unintended Floor resets (zero), lost candidates (zero), silent override changes (zero), photo decisions/associations, eligibility batch outcomes and Preview omissions. Compare against **both** manual and existing CSV/bulk baselines. A reduction in clicks with more unexplained state changes is a failure.
