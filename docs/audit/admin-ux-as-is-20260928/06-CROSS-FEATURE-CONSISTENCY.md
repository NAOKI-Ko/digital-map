# Cross-feature entity consistency

## Map

```text
Map Settings (name/brand/SEO/languages) ─┐
Floors/Illustration + PIN/Spots ──────────┼→ current editing state
Publish creates release ──────────────────┼→ current published version / public URL
Paper Map source selector: LIVE or PUBLISHED ─→ Paper-only config → preview/PDF
```

The Publish page distinguishes `isPublished`, `currentReleaseId`, stopping publication, resuming the stopped version, publishing current edits, and rollback. Map Home exposes the public URL only with a ready published release (WU-41 evidence). Paper Map then lets an editor select `LIVE` (“現在の編集内容”) or `PUBLISHED` (“現在の公開版”). The distinction is explicit inside Paper Edit, but its New flow starts from live/current edits while Publish uses “最新の編集内容”; a user must understand that a Paper PDF can differ from the public URL.

## Spot

| Aspect | Edit owner / source | Other readers or editors | Boundary clarity |
|---|---|---|---|
| Basic fields/category/photo/floor | Spot New/Detail using `SpotForm` | Spot list, public Map, Paper source | Mostly centralized |
| Position and PIN visual | PIN Editor; Spot Detail links there | Public Map, Paper source | Separate editor is signposted |
| Assignment | Spot assignee | Restricted Spot Editor | Explicit role boundary |
| Revision/approval | Restricted Spot Editor submits revision; Revisions approves | Spot Detail/public output | “承認待ちとして保存” communicates non-direct commit |
| Translation | Spot Detail English form; Category/Map translations elsewhere | Public language output | Per-entity controls, inconsistent section feedback |
| Paper override | Paper Edit short text, photo choice, visibility/order | Paper preview/PDF only | Strong “Digital Map由来 / 紙面用” disclosure and link to Spot Detail |
| Publication | Spot form/list and Map release | Public Map and Paper source | Two levels of publication need vocabulary contract |

Paper Edit shows source text adjacent to the paper-only override and offers a link to edit the Map source. This is a clear ownership boundary. Its PDF uses displayed draft config even before Save and explains that persistence requires Save. The likely expectation risk is propagation timing: source changes update Paper only according to selected LIVE/PUBLISHED mode, while saved Paper overrides remain paper-only. Current source refresh behavior needs a fresh end-to-end session for verification.

## Floor / image

```text
Floor list: illustration upload/order
  ↳ Decoration: separate image overlays, immediate per-operation commit
  ↳ Georeference: two-point real-world mapping, explicit commit
  ↳ PIN Editor: Spot coordinates on illustration, explicit position commit
  ↳ Paper source: floor illustration and PINs rendered to print
```

Georeference copy explicitly says changing real-world correspondence does not move illustration PIN positions. Floor image replacement and Decoration overlay are different ownership layers. Paper's source uses floor and spot data and then applies a paper-only viewport/selection. These boundaries are technically sensible, but the separate persistence models are not always visible before interaction.

**FACT:** routes and APIs above. **INCONSISTENCY:** the same Spot appears in direct edit, revision, PIN, Paper override and publication contexts. **IMPACT:** a user may expect a change to propagate to paper/public immediately when it is still live-only, approval-pending, or paper-only. **HYPOTHESIS:** label source, draft, release and override state at the point of action; avoid duplicating the underlying editor.
