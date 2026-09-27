# Screen-to-contract map

**Frozen target classification at `8980521550625e724fcc0b2bda9c46d93eeb0023`.** One row per `app/pages/admin` route (32 rows). This maps future interaction rules; `docs/audit/admin-ux-as-is-20260928/01-SCREEN-INVENTORY.md` records current behavior. `—` means no domain-edit persistence/visual contract on that route. Mixed models are action-scoped, not contradictions.

| Route | UX Type | Persistence Contract | Visual Contract | Navigation Parent | Vocabulary Notes | Exception |
|---|---|---|---|---|---|---|
| /admin/login | Auth | FORM_EXPLICIT_SAVE (submit) | — | Auth entry | Login/status | Credential form; no Map context |
| /admin/signup/complete | Onboarding | FORM_EXPLICIT_SAVE (submit) | — | Signup flow | Workspace | Consent gate |
| /admin/dashboard | Dashboard | — | — | Workspace Home | Workspace/Map | Single-Map redirect |
| /admin/workspaces | Management | COMMAND_IMMEDIATE (switch) | — | Dashboard | Workspace | Active context switch |
| /admin/organization | Settings | FORM_EXPLICIT_SAVE (profile); COMMAND_IMMEDIATE (members) | — | Workspace settings | Workspace | Per-section dirty scope |
| /admin/organization/audit | Read | — | — | Workspace settings | 操作履歴 | Owner only |
| /admin/maps/new | Form | FORM_EXPLICIT_SAVE (create) | — | Dashboard | Map | Create redirects to Setup |
| /admin/maps/:mapId | Dashboard | — | — | Workspace Home | Map public state | URL-authoritative Map |
| /admin/maps/:mapId/setup | Wizard | FORM_EXPLICIT_SAVE (step); COMMAND_IMMEDIATE (add) | — | Map Home | 編集中の内容 | Onboarding sequence |
| /admin/maps/:mapId/settings | Settings | FORM_EXPLICIT_SAVE (section); COMMAND_IMMEDIATE (language/delete) | — | Illustration Map / Settings | Map visibility/source qualifiers | Section snapshots/guards |
| /admin/maps/:mapId/floors | Management | FORM_EXPLICIT_SAVE (item); COMMAND_IMMEDIATE (order/delete/image replace) | — | Illustration Map / Floors | Floor/illustration | Image replace consequence explicit |
| /admin/maps/:mapId/floors/:floorId/decorations | Visual Editor | VISUAL_DRAFT_SAVE (geometry); COMMAND_IMMEDIATE (add/delete/duplicate/layer) | Short canvas editor; sticky conditional | Floors | 装飾を保存/追加 | Mixed action models labelled |
| /admin/maps/:mapId/floors/:floorId/georeference | Spatial wizard | VISUAL_DRAFT_SAVE (points); COMMAND_IMMEDIATE (remove alignment) | Specialized paired canvases | Floors; PIN return override | 位置合わせ/解除 | Two-point task kept |
| /admin/maps/:mapId/editor | Visual Editor | VISUAL_DRAFT_SAVE (position/design); COMMAND_IMMEDIATE (unplace) | Default left sticky Map | Illustration Map / PIN | 候補/保存済み position | Current reference |
| /admin/maps/:mapId/fields | Management/form | FORM_EXPLICIT_SAVE (field); COMMAND_IMMEDIATE (order/delete) | — | Illustration Map / Fields | スポット項目 | In-page and route dirty guard |
| /admin/maps/:mapId/categories | Management/form | FORM_EXPLICIT_SAVE (item/translation); COMMAND_IMMEDIATE (order/delete) | — | Map / Categories | カテゴリー | Separate translation draft |
| /admin/maps/:mapId/spots | List | COMMAND_IMMEDIATE (bulk) | — | Map / Spots | Spot publication eligibility | Query/scroll preserved |
| /admin/maps/:mapId/spots/new | Form | FORM_EXPLICIT_SAVE (create) | — | Spot list; PIN return override | Spot publication eligibility | SpotForm guard |
| /admin/maps/:mapId/spots/:spotId | Form | FORM_EXPLICIT_SAVE (core/translation); COMMAND_IMMEDIATE (photo operations if independent) | — | Spot list | Spot public eligibility | Separate translation scope |
| /admin/maps/:mapId/spots/:spotId/assignee | Management | COMMAND_IMMEDIATE (assign/invite/remove) | — | Spot detail | 担当者 | Restricted team action |
| /admin/maps/:mapId/spots/import | Wizard | COMMAND_IMMEDIATE (import commit) | — | Spot list | Import result | Preview is noncommittal |
| /admin/maps/:mapId/editors | Management | COMMAND_IMMEDIATE (access change) | — | Team / Map Editors | 編集者 | Owner only |
| /admin/maps/:mapId/revisions | Lifecycle | COMMAND_IMMEDIATE (approve/reject) | — | Team / Revisions | 承認待ち/変更申請 | Spot subnav is shortcut |
| /admin/maps/:mapId/publish | Lifecycle | COMMAND_IMMEDIATE (publish/stop/restore) | — | Operations / Publish | 公開中/非公開; 公開履歴 | Map visibility ≠ release |
| /admin/maps/:mapId/paper | List | COMMAND_IMMEDIATE (duplicate/delete/export) | — | Operations / Paper | 紙マップ | Legacy configs remain accessible |
| /admin/maps/:mapId/paper/new | Selection/Preview | COMMAND_IMMEDIATE (create) | Exception: Preview left/choice right | Paper list | 元データ：編集中の内容 | No editable draft before create |
| /admin/maps/:mapId/paper/:paperMapId | Visual Editor | VISUAL_DRAFT_SAVE (config/name); PDF output from draft | Default left sticky Preview target | Paper list | 編集中/公開中/前回公開; 紙面だけ | Current desktop orientation migrates |
| /admin/maps/:mapId/paper/request | Specialized form | FORM_EXPLICIT_SAVE (submit request) | — | Paper Map item | 相談/送信 | External design service |
| /admin/maps/:mapId/analytics | Read | — | — | Operations / Analytics | アクセス状況 | Read only |
| /admin/spot-editor | Restricted list | — | — | Workspace / Assigned Spots | 担当スポット | No Map admin context |
| /admin/spot-editor/:spotId | Restricted form | FORM_EXPLICIT_SAVE (submit revision); COMMAND_IMMEDIATE (photo upload) | — | Assigned Spots | 承認待ちとして送信 | Does not directly save public Spot |
| /admin/account/password | Account form | FORM_EXPLICIT_SAVE (submit) | — | Account | パスワード変更 | Redirect to login |
