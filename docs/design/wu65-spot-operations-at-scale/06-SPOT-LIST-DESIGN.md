# Spot List design and factual progress

Decisions D5/D9. Evidence [01 E2](01-CURRENT-WORKFLOW.md): existing rows already show categories, Floor/placement, target badge and updated date; no photo counts or visual-source provenance.

## Information architecture

Spot List remains parent for Spot records/import/Detail. Categories remain their first-class destination; Floor/PIN/field settings keep current navigation ownership. Add a contextual task strip and source/photo facts, not a new dashboard with its own editable state.

Example **illustrative** row (not measured Aquarium state):

```text
[ ] シャチ                         展示
    北館2F · 未配置                 公開対象外
    写真 1枚    ● カテゴリー既定：展示
    [PINを配置] [写真を編集] [詳細]
```

Existing row metadata can become a compact table on wide screens and stacked rows on narrow screens. The primary name opens Detail and preserves filter/scroll return. Keep checkbox and action hit targets separate; row click must not toggle selection. Do not require a new layout engine.

## Status definitions

| Fact | Meaning / action | Not implied |
|---|---|---|
| Floor + 未配置 / 配置済み | x/y missing versus both present; link to correct Floor and Spot in editor | A meaningful or verified location, or real-map coordinates |
| 公開対象 / 公開対象外 | Saved LIVE target flag; target-on only for positioned rows | Currently visible in released public Map |
| 写真 N枚 / 写真なし | Same effective saved photo set used by Spot detail, including legacy URL fallback | Quality, relevance or mandatory completion |
| Category chips / 未分類 in filter | All semantic memberships; zero allowed | Publication requirement or visual priority |
| PIN source thumbnail/text | Effective style and standard/category/individual source; detail on demand | First category controls style |
| Required-field issue | Only concrete failures under enabled required field definitions, if present | Generic “基本情報 complete” score |

Do not store a readiness boolean or percentage. A Spot with no category/photo is not universally incomplete. “公開対象にできる” may describe positioned target-excluded rows, but is not a guarantee of complete Map release checks. Required-field warnings can arise if field policy changed after creation; show the actual missing field, without quietly redefining current publication rules.

## Task strip and filters

Primary strip: `未配置 N件` · `配置済み・公開対象外 N件` · `閲覧者向けプレビュー`. These actions apply explicit filters/deep links. Secondary optional filters: `写真なし`, `カテゴリーなし`, `PIN設定：標準／カテゴリー既定／個別`, Floor, category and existing keyword/status/sort. Keep `写真なし` neutral rather than red failure. Do not show “34 failures” because only three Spots have photos.

Counts are Map-wide and labeled as such; result count describes current filters separately. Derive counts from saved authorized records, and refresh after mutation. For legacy photos count the effective photos once, not SpotPhoto plus duplicate photosJson entries. A photo fetch error is unknown, not zero. No stored setup task state.

Example top line: `このマップ：未配置 12件 / 配置済み・公開対象外 8件`. Show only a few actionable facts by default, with an expandable details area for category/style suggestions. Avoid five green ticks per row; they crowd out names and imply mandatory completeness.

Current keyword+position query composition needs the scoped fix noted in [03](03-BULK-OPERATIONS.md); every combination must match the count and selected set. No hidden cross-filter selection. Server returns sufficient factual summary (effective photo count, source/effective thumbnail, concurrency token; required-field warnings only when calculated reliably), not a generic readiness score.

## Actions and state ownership

- CSV entry: clearer `CSVでまとめて登録・更新`; first-use starter and current export remain different commands.
- Placement: direct link for both unplaced and placed rows, with validated same-Map Floor/Spot context. Task entry can launch the continuous queue.
- Photos: one contextual panel, one Spot at a time, existing association commands. Close returns to the exact list filter/scroll; open another row only after in-flight commands finish. Upload and association are visibly distinct persisted effects.
- Bulk: [03](03-BULK-OPERATIONS.md) selection/review contract. Category ADD/REMOVE, target, PIN source, safe intended Floor; no sheet with every Spot field.
- Style: list thumbnail reveals consequence; actual Category default editing stays in Categories, individual design in PIN Editor. No duplicate style editor inside every list row.
- Preview: source is saved `編集中の内容`; unpublished/unfinished records excluded by current policy. Explain omitted counts rather than presenting them as absent data.

## Reviewable acceptance cases

37 records remain scannable at desktop and 390 px. Keyboard can select, review, apply, open photo panel and return to the same row. Status uses words as well as color. Screen reader announces selection and committed operation counts. Three useful photos do not trigger a forced 37-photo task. A standard multi-category PIN remains valid but can be found through a style filter. A public Map with new target-excluded Spots never labels them “公開中”. Failed mutations do not change factual counts. UI preference state does not become business-data dirty state.
