# WU-77 Design Contract v1.0

Benchmark Lock v1.0を品質の正本とする。新しいDB列、pinIconType、所有権、権限、publicationの変更は含めない。

## 意味と外観

目的地は既存teardrop（文字/Material/写真）、直置きillustrationを継続。設備は作成者が明示選択する `facility:*` presetカタログを使い、tip無しの角丸square badge・高contrast pictogramを採用。形と記号で区別し、色だけで意味を伝えない。EV/階段/エスカレーターも施設familyに含め、第三taxonomyは追加しない。

比較した候補: 既存teardrop=目的地と混同するため不採用。circle=写真目的地と紛らわしいため不採用。tip無し角丸square=設備標識に近くcompactであり採用。bare pictogram=背景が複雑な時のcontrast不足のため不採用。squareは白い面・濃い固定glyph・author色のaccent borderを持ち、28〜36px程度のpainted footprintと既存60×60 targetを分離する。小/中/大と重要度は別。selected/focusに既存ringを持たせる。

施設カタログ最低範囲: トイレ、多目的トイレ、EV、階段、エスカレーター、授乳室、AED、案内所。Material Symbolsの既存ライセンス/stylesheet方式を使用し、必要glyphを明示カタログへ加える。AEDは文字AEDを併用して曖昧なheart記号だけにしない。

既存 `material:wc`, `material:info`, `kanji:i` 等は引き続き目的地PIN。名称・Categoryからroleを推測しない。新施設presetを選択する時だけ新文法を有効にする。保存は既存 `pinIconType='preset'` と `pinIconId`、appearance sourceを使用し、既存DTO形・Spot/Placement/Category/Workspace契約を変えない。最小Admin変更は既存PinDesignEditorと各previewのカタログ表示のみ。既存category defaultsによる継承、明示individual、公開snapshot/LIVEを共通rendererへ通す。

## Viewerと操作

Public/LIVEのVisitorMapExperienceを共通変更する。設備用凡例は実際にfacility presetが存在するフロアにだけ表示し、小さい凡例で形の意味を説明する。Categoryは既存複数ORを維持し、横スクロールの発見性・selected・clear・keyboard focusを整える。Floorは選択中の場所/フロアと設備/目的地の理解を助ける。Detailは既存selected地点とcamera/focus復帰を保ち、狭いtabletでmapを失わない幅を用いる。

Map controls/一手操作/空白背景/レスポンシブ/文字contrastは一つのsurfaceとして調整。initial camera/overview契約は保持し、backgroundやoverlayの都合でcameraを自動refitしない。長い名称、空フロア、写真欠落、施設と目的地の混在、Category多数でも可読性とスクロールを維持。

## 回帰不変条件

selected > active Category > featured > normal、選択/focus保護、visual geometryと60×60 targetの分離、count badge・staged zoom・maxZoom spiderfy・offscreen representative、initial camera/overview、PIN pop-in/reduced motion。施設geometryはunrotated artworkを測り、teardrop専用透明角trimを適用しない。入口のpaint cloneも同じbadge shapeを維持。

publication lifecycle、Spot canonical/Placement usage、consumer Map0..1、Workspace/Map authorizationを維持。新たなpersist field/migrationが必要と判明した場合はProduct Decisionとして止める。

## 実装分担とgate

77-02: facility catalogue/renderer/geometry/最小authoring/previewと意味・保存の回帰test。
77-03: sharedVisitor shell/Category/Floor/Detail/controls/background/responsive/a11y/motionとbaseline/candidate固定fixture。
77-04: 作成者から独立したblack-box QA、同条件競合比較、Finding修正反復。candidate exact SHA・URL・fixtures・通常認証の入口を渡す。secretは共有しない。
77-05: tests/typecheck/build/Prisma/audit/security→Codex review→Verify→Windows candidate→独立QA→Quality Acceptance→dev merge→postmerge Verify→Windows exact merge SHA→Evidence→Close。

各gateの未確認項目は未確認と記録。schema変更やsecurity例外の追加でチェックを通さない。実装者の評価だけでPASSにしない。
