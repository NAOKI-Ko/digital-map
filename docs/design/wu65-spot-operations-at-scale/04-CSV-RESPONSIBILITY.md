# CSV responsibility and minimum enhancement

Decision D7. The baseline is **CSV v3**, not a proposed Floor/category/custom-field import. See [01 E3/E7](01-CURRENT-WORKFLOW.md).

## Current field matrix

“Form” means SpotForm unless another surface is named. Bulk classification is the design decision, not a claim that every action exists today. Visual-only means authorship should remain a visual operation, not that the data is absent from storage.

| Field | Current CSV import | Current CSV export | Current Spot form / editor | Bulk candidate | Visual-only |
|---|---|---|---|---|---|
| Name | New + update | Yes, スポット名 | Required | Individual values via CSV, no list mass-name action | No |
| Description | If standard field enabled | Enabled, header 説明 | Configured label / enabled | CSV | No |
| Address | If enabled | Enabled, 住所 | Configured field | Conditional via CSV | No |
| Website | If enabled | Enabled, Webサイト | URL field | Conditional via CSV | No |
| Hours | If enabled | Enabled, 営業時間 | Configured field | Conditional via CSV | No |
| Holiday | If enabled | Enabled, 定休日 | Configured field | Conditional via CSV | No |
| Phone | If enabled | Enabled, 電話番号 | Configured field; disabled in default definitions | Conditional via CSV | No |
| Custom single/multiline text | Enabled definitions | Enabled labels | Configured fields | Conditional via CSV | No |
| Custom number / URL / boolean | Enabled; typed validation | Enabled | Configured typed fields | Conditional via CSV | No |
| English name | When en enabled | スポット名（英語） | Detail translation section | Individual values via CSV | No |
| English description/address/hours/holiday | Enabled translatable fields | Enabled English columns | Detail translation section | Individual values via CSV | No |
| English custom text | Single/multiline only | Enabled English columns | Detail translation section | Individual values via CSV | No |
| Phone/URL/numeric/boolean translations | No separate translated value | No separate columns | Shared value | Not applicable | No |
| Semantic categories | Exact registered names separated by `\|`; **full set replacement** on update | Names separated by `\|` | Zero/multiple checkboxes | ADD safe; REMOVE conditional; no list Replace initially | No |
| Floor | New rows: exact unique name; existing rows: cannot change | フロア plus preserved __floorId | Required Floor selection | Conditional only if all coordinates absent and target off | Destination intent textual; transfer spatial |
| isPublished / target eligibility | No; new false, existing preserved | No | Separate publication panel | Conditional target on after x/y, safe off | No, but depends on visual placement |
| x/y illustration position | No | No | PIN Editor, not normal coordinate text inputs | Per-item | Yes |
| lat/lng real position | No | No | SpotForm numeric pair | Per-item; no WU-65 CSV expansion | Spatial judgment, manual coordinates remain supported |
| PIN type/icon/image/color/size | No | No | PIN design editor | Source adoption conditional; exception tuple per-item | Visual review |
| Importance normal/featured | No | No | PIN design editor (also carried in form state) | Defer list bulk | Judgment, not inherited style |
| Photo associations/order | No | No | SpotPhotoManager in Detail | Per-item contextual action | Yes |
| Category icon/default style | No | No | Categories, not Spot form | Category-level config | Visual review |
| Assignee, pending revisions | No | No | Separate task/assignee surfaces | Out of this pass | No |
| IDs, schema/row hashes | Required metadata rules, not authored business data | Five system columns last | Not editable business fields | Never mass-edit IDs | No |

There is no exported CSV round-trip of the entire Spot: photos, geometry, style, importance, target state and assignee are intentionally not included. Enabled fields alone appear; disabled fields are preserved by updates, not cleared as an accidental omission.

## Exact current responsibility

Export is Map-wide, ordered by Floor then name/id. Human columns precede `__csvVersion`, `__schemaVersion`, `__spotId`, `__rowVersion`, `__floorId`. Standard headers are canonical Japanese strings, **not necessarily the Map's configured labels**. Custom duplicate labels are disambiguated deterministically by generated ordering. Schema hash covers version/locales/field structure and Floor identity/name/order. Row hash covers editable CSV content and categories; it is not a hash of all visual state.

Preview/apply receive `{ csv }`. Existing rows match only their preserved Spot IDs, not names; duplicate names warn, duplicate IDs block. Missing/unknown/mismatched Floor and unknown Category block. New rows resolve a unique exact Floor name; no Floor or Category is auto-created. New rows keep __spotId/__rowVersion blank and may keep __floorId blank. They need generated current version/schema metadata. Existing rows preserve IDs and row hashes. Removing a row never deletes a Spot. Blank optional cells clear imported fields; blank Category cell replaces membership with the empty set. This differs from list ADD and must be stated in review.

Formula-like values are protected on export and restored by parser. Custom types/required values, locale, ownership and stale hashes are validated; apply re-reads/re-hashes inside a Serializable transaction and is all-or-nothing. Legacy v2 existing rows can derive their Floor from Spot identity. v1 and v2 new rows without Floor context are rejected in the Map-wide API with re-export guidance; do not promise universal legacy acceptance.

Names containing `\|` cannot be unambiguously authored as v3 Category lists. Do not change name semantics or invent escaping silently in this pass: show a targeted warning and direct those assignments to the list. Likewise, ambiguous human labels/duplicate Floor names must block with instructions, never choose the first match. Preserve existing values and use current exports rather than opaque IDs as operator-authored substitutes.

## Minimum useful enhancement: first-use starter, not more columns

Current empty-Map export contains headers but no row with required schema metadata. The unlinked legacy template endpoint produces an old field-key format, not a valid Map-wide v3 starter. This is an observed source-level first-use gap, not a measured UAT error.

Add `新規スポット用CSVを用意` next to export/import. The server generates a current v3 starter row with `__csvVersion=3` and the current schema hash; __spotId/__rowVersion/__floorId are blank. Human cells remain blank to be filled, never seeded with a fake exhibit that can accidentally be imported. Instructions say: copy the whole starter row for each Spot, fill human columns, keep the generated system metadata unchanged. Blank/incomplete rows remain validation errors; there is no “import 37 empty rows” path. Provide the current human-readable Floor and Category names on the import page, plus concise delimiter/examples help. Existing export stays a faithful export, with no synthetic Spot row.

New endpoint or explicit starter operation must be distinct from the legacy template endpoint; do not alter that endpoint's response silently. No new business columns, no version bump, no schema changes. Files users already export retain the same headers/hashes under unchanged Map configuration.

Enhance import result with `登録37件・位置未設定37件・公開対象外37件` and explicit links to list/placement. It does not silently adopt styles or turn on eligibility. Apply the source-reference validation in [02](02-CATEGORY-PIN-MODEL.md) when an existing category-mode row would remove its chosen Category; show the blocking row and instruction to resolve the PIN source. Old CSVs still cannot silently repaint inherited PINs through semantic replacement.

## Candidate expansion decisions

| Candidate | Decision |
|---|---|
| Category | Already present; retain full-set semantics, improve explanation. |
| Floor intent | Already represented by required floorId before placement. No second field or existing-row move via CSV. |
| Publication eligibility/intent | Reject expansion now. Eligibility needs positioned records; one reviewed bulk action after placement replaces up to 37 toggles. Storing future intent adds a second publication state without evidence. |
| Custom fields | Already present; no new field model/list grid. |
| PIN visual Category or override | Reject columns now. One reviewed sole-category adoption command plus group exceptions is understandable; visual appearance needs preview. |
| Photo IDs/names/URLs/binaries | Reject now. Three photos do not justify another reference resolver; filename ambiguity and association judgment remain. |
| PIN coordinates | Reject. No evidenced spreadsheet spatial workflow; preserve visual placement. |

**Conclusion:** structured textual setup is CSV's responsibility. Visual placement and choosing media are not. This is a deliberate decision against broad “Better CSV” scope, not a missing design decision.
