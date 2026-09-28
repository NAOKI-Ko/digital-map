# Neutral Spot vocabulary

Decision D10. Source [01 E7/E11](01-CURRENT-WORKFLOW.md); target AQUA-010. Change generic fixed copy; retain Map-configured business meaning and existing Arimatsu fields/data.

| Surface | Current | Classification | Ship wording / treatment |
|---|---|---|---|
| SpotForm name label | 店名・スポット名 | Generic field with retail framing | **スポット名** |
| Name validation | 店名・スポット名を入力してください。 | Generic error | **スポット名を入力してください。** |
| Name placeholder | 例：まちかどカフェ | Example, not field semantics | **例：中央広場、展示室、〇〇商店**; never save placeholder text |
| Spot New help | 店名や営業情報、所属フロアを登録します。 | Generic workflow | **スポット名や説明、カテゴリー、配置するフロアを登録します。** |
| SpotForm section | 営業情報・詳細 | Generic section containing configurable fields | **追加情報** (基本情報 already exists above) |
| List search | 店名・カテゴリ・説明文を検索 | Generic search | **スポット名・カテゴリー・説明文を検索** |
| List category heading | カテゴリ | Inconsistent generic noun | **カテゴリー** throughout affected Spot surfaces |
| Hours field | 営業時間 | Configurable standard field, hours semantic key | Keep existing configured label/default. Explain in Fields help that it can be relabeled **利用時間** or **開館時間** for a facility. |
| Holiday field | 定休日 | Configurable standard field | Keep; Map admin may choose **休館日** or disable. No bulk relabel. |
| Field validation for hours/holiday | Hard-coded 営業時間/定休日 | May disagree with configured label | Use configured label when available; shared schema fallback **時間の情報は500文字以内で入力してください。** / **休業日の情報は500文字以内で入力してください。** |
| SpotPublishPanel local preview | Hard-coded 営業時間/定休日 labels | Preview should reflect Map configuration | Use configured labels for these fields, preserve retail defaults when no alternate label; no visitor redesign |
| 店舗 in truly shop-specific guidance/roles | Context-dependent | Actual retail meaning, not global search/replace | Keep where it describes a shop-specific example/contract; change only generic Spot references when found in affected surfaces. |
| Setup suggestions | 観光向けカテゴリー候補 | Optional suggestion | Keep explicitly optional, not a mandatory facility taxonomy. |
| Publication labels | 公開対象 / 編集中の内容 / 公開中の内容 | Existing contract | Preserve, never reduce to ambiguous 公開/下書き. |

## Why not rename every hours field to 利用時間?

利用時間 can mean a duration or permitted time slot; 営業時間 remains precise for Arimatsu retailers. Existing fields have a stable semantic key plus editable label. The chosen fix removes retail assumptions from core navigation/sections/examples while using the existing configuration system for field meaning. Keep default seed labels and current configured labels unchanged in this WU. Facilities may deliberately relabel one Map; this pass makes no Aquarium/Arimatsu data edits.

CSV v3 uses canonical standard headers (営業時間/定休日/説明), while Spot UI may use configured labels. Keep these headers for compatibility and display a mapping in CSV help when labels differ, e.g. `利用時間 → CSV列「営業時間」`. Do not silently change schema hash/header vocabulary under a copy-only release. Field IDs, values, enabled/public-visible/required state and translations stay unchanged.

## Presets evaluated

| Preset | Potential real benefit | Why not recommend now |
|---|---|---|
| 観光地 | Seed fields/categories/icons | Optional tourism suggestions already exist; no demonstrated new repeated bundle. |
| 商店街 | Retail labels/hours/category defaults | Existing field model supports retail; avoid introducing a profile just to preserve defaults. |
| 屋内施設 | Exhibit/utility categories, disabled addresses/hours | One Aquarium UAT does not establish a stable shared facility configuration; many indoor facilities differ. |
| イベント | Time/location-specific content | No observed event requirement; may require scheduling semantics beyond copy. |

No preset solves multiple evidenced gaps better than neutral fixed copy, configurable fields and Category defaults. Do not add preset persistence/versioning or runtime organization-specific copy. This decision is complete for WU-65; future repeated evidence can justify a new product task.

## Acceptance

Review Aquarium exhibit, toilet/service point and Arimatsu shop journeys, including empty optional fields, Map relabeling, validation and local preview. Ensure retailer hours/holiday meaning remains intact and exported existing v3 headers do not change. Screenshots/string review suffice for simple copy; only add behavioral tests where configured-label/validation wiring changes, not tests that merely mirror every literal string.
