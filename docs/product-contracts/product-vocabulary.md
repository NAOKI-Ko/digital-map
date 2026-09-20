# Product Vocabulary Contract

This contract governs user-facing copy. Internal identifiers, Prisma models, route paths, API paths, payloads, and log terminology remain unchanged.

## Canonical terms

| Internal or legacy wording | User-facing wording |
| --- | --- |
| Tenant / Organization / 組織 | ワークスペース |
| MAP / Map | マップ |
| Spot | スポット |
| PIN | ピン |
| Field | 項目 |
| Spot Field | スポット項目 |
| Revision | 変更申請 |
| Pending Revision | 承認待ち |
| Audit Log / 監査ログ | 操作履歴 |
| Analytics / アクセス解析 | アクセス状況 |
| Publish management / 公開管理 | 公開 |
| Publish settings | 公開設定 |
| Map Editor | マップ編集者 |
| Spot Editor | スポット担当者 |
| slug | 公開URL / 公開URLの名前 |
| Media / MediaAsset | 画像 / 登録済み画像 |
| Decoration | 装飾 |
| Georeference | マップの位置合わせ |

`Digital Map` is the product name and is not translated to `Digital マップ`. Internal `Tenant` remains the code/domain concept.

## Context rules

- Use `変更申請` for the feature/page, `承認待ち` for status/count, and `承認する` / `却下する` for actions.
- Use `公開` in navigation, `公開設定` for the page, and `公開履歴` for historical releases. Never expose `PublicRelease` or `Snapshot`.
- `CSV` may remain as a format name. Prefer `CSVでまとめて登録`, `CSVを書き出す`, and `CSVファイルを選択`.
- Use `公開URL` or `公開URLの名前`, never user-facing `slug`.

## REVIEW_REQUIRED

The following established domain terms require a separate product decision before renaming:

- `フロア`
- `イラストマップ`
- `リアルマップ`
- `カテゴリー`
- `ピンの重要度`
- `ワークスペース`

WU-51 keeps these terms unchanged. Source identifiers and technical tests are not mechanically renamed.

