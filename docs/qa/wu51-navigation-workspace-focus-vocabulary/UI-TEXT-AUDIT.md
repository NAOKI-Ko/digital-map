# WU-51 UI Text Audit

Scope: user-visible strings in `app/pages/**/*.vue`, `app/components/**/*.vue`, and navigation utilities. Internal types, API paths, variables, comments, and test fixtures are excluded from visible-copy enforcement.

| Finding | Classification | Resolution |
| --- | --- | --- |
| `MAPサマリー`, `MAPの状態` | NORMALIZE | `マップの概要`, `マップの状態` |
| `マップホーム` | NORMALIZE | `ホーム` where Map context is already present |
| `監査ログ` | NORMALIZE | `操作履歴` |
| `アクセス解析` | NORMALIZE | `アクセス状況` |
| `公開管理` | NORMALIZE | `公開` |
| Visible `PIN` wording | NORMALIZE | `ピン` |
| Visible `組織` wording | NORMALIZE | `ワークスペース` |
| Visible `Revision` | NORMALIZE | `変更申請` / `承認待ち` by context |
| Visible `Field` | NORMALIZE | `項目` |
| Visible `Snapshot` | NORMALIZE | `公開内容` |
| `CSV取込` | NORMALIZE | `CSVでまとめて登録` |
| `CSV Export・一括編集`, `CSV出力`, `再Export` | NORMALIZE | `CSVでまとめて編集`, `CSVで書き出す`, `書き出し直す` |
| `ジオリファレンス` | NORMALIZE | `マップの位置合わせ` / `位置合わせ` in local context |
| Internal `Tenant`, `OrganizationSummary`, route/API names | INTERNAL_ONLY | Kept unchanged |
| Internal `PIN_SIZE_SCALES` and technical comments | INTERNAL_ONLY | Kept unchanged |
| `フロア` | REVIEW_REQUIRED | Kept unchanged |
| `イラストマップ` | REVIEW_REQUIRED | Kept unchanged |
| `リアルマップ` | REVIEW_REQUIRED | Kept unchanged |
| `カテゴリー` | REVIEW_REQUIRED | Kept unchanged |
| `ピンの重要度` | REVIEW_REQUIRED | Kept unchanged |
| `ワークスペース` | REVIEW_REQUIRED | Kept as the WU-51 canonical term; no further domain reinterpretation |
| `Digital Map` brand | KEEP | Kept as product identity |
| `CSV` | KEEP | Kept only as the file-format name with action-oriented labels |

Post-change high-risk scan leaves `PIN` only in internal identifiers/comments and leaves `組織`, `監査ログ`, `アクセス解析`, `MAPサマリー`, `Snapshot`, visible `Revision`, and mixed-language CSV action labels absent from application UI copy.
