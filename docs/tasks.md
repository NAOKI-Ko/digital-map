# Tasks: 実装タスク分解

各タスクは独立してレビュー・マージできる粒度を意識している。上から順に進めることを推奨。Codexに1タスクずつ渡すことを想定。

## Phase 0: 基盤

- [x] T-01: Nuxt 4(TypeScript)プロジェクトの雛形作成、Tailwind CSSモジュール導入
- [x] T-02: Prisma + PostgreSQLのセットアップ、`design.md`のスキーマでマイグレーション作成
- [x] T-03: Docker Compose(app + postgres)でローカル起動できる状態にする
- [x] T-04: 初期管理者ユーザーをseedスクリプトで作成できるようにする

## Phase 1: 認証・管理画面の骨格

- [x] T-05: nuxt-auth-utilsによるセッションベースのログイン機能(Credentials方式)
- [x] T-06: 管理画面のレイアウト(`app/layouts/admin.vue`、サイドナビ、ダッシュボードの空実装)
- [x] T-07: ダッシュボード画面:マップ一覧の表示、新規マップ作成ボタン

## Phase 2: マップ・フロア管理

- [x] T-08: マップ設定画面:マップ名の登録、マップの新規作成API
- [x] T-09: イラスト画像アップロード機能(API Route経由、ローカル保存でまず動かす)
- [x] T-10: フロア(MapFloor)のCRUD:追加・並び替え・削除
- [x] T-11: フロアのジオリファレンス設定UI ※旧4隅方式として実装後、Phase 8(T-39)で2点合わせ方式へ移行済み

## Phase 3: スポット管理(管理側)

- [x] T-12: スポット一覧画面(検索・絞り込み)
- [x] T-13: スポット登録編集フォーム(店名・カテゴリ・説明文・営業時間・定休日・電話番号)
- [x] T-14: 写真アップロード(複数枚)
- [x] T-15: 住所入力→Nominatim経由の自動ジオコーディング ※ジオリファレンス設定(⑤-2)での基準点検索補助としても継続使用
- [x] T-16: ピン配置エディタ:MapLibre上のクリック位置を逆変換し、正規化IMAGE `x`/`y`としてピンを仮配置
- [x] T-17: 既存ピン(Marker)のドラッグによる位置調整
- [x] T-18: ピンデザイン選択(プリセットアイコン一覧、カラーピッカー、カスタム画像アップロード)
- [x] T-19: スポットの公開/非公開切り替え、プレビュー機能

## Phase 4: 地図ビューア(MapLibre GL JS, コアコンポーネント)

- [x] T-20: `MapViewer.vue`コンポーネントの実装(MapLibre GL JSの初期化。ロジックは`app/composables/useMapViewer.ts`に切り出す)
- [x] T-21: フロアのイラストを`image`ソースとして追加し、緯度経度に対応づけて表示(Phase 8で四隅の算出方法を2点合わせ方式へ変更済み)
- [x] T-22: `pitch`/`bearing`/`zoom`の制約設定(`maxPitch`等。design.md 4.3節を参照)
- [x] T-23: ピンの表示(`maplibregl.Marker`)、当時仕様のカテゴリ別カラー・アイコン反映、クリックイベントでのスポット選択(カテゴリからの暗黙推定はPhase 14で汎用defaultへ変更済み)
- [x] T-24: フロア切り替え時の`image`ソース差し替え(`removeLayer`/`removeSource`→再追加)と`fitBounds`による視点移動
- [x] T-25: 現在地表示(`GeolocateControl`) ※初期実装の屋内外判定は廃止し、現行はジオリファレンス設定有無で切り替え

## Phase 5: 公開側画面

- [x] T-26: 公開マップ閲覧画面(`MapViewer`の組み込み)
- [x] T-27: スポット詳細カード(オーバーレイ表示)
- [x] T-28: カテゴリ絞り込みチップ
- [x] T-29: フロア切り替えタブ(複数フロアがある場合のみ表示)
- [x] T-30: 初回操作ヒントの表示・フェードアウト

## Phase 6: 公開設定・仕上げ

- [x] T-31: マップの公開/非公開切り替え画面
- [x] T-32: 公開URL・QRコード発行
- [x] T-33: レスポンシブ対応の最終調整(モバイル優先)
- [x] T-34: README整備(セルフホスト手順、Docker Composeの使い方)

## Phase 7: 保守系(次フェーズ)

- [ ] T-35: アップロード画像のガベージコレクション(未使用画像の検出・猶予期間付き削除・dry-run対応。フロアイラスト/スポット写真/カスタムピン画像を対象)

## Phase 8: 2点合わせジオリファレンス方式への移行

Ver.3で採用した「イラストの四隅を個別にドラッグして緯度経度に対応づける」方式は、
対角のねじれや日付変更線をまたぐ座標破損など、運用検証でバグが繰り返し発生した。
design.md Ver.5 / wireframe-spec.md Ver.5を正として、ジオリファレンスの"やり方"を
「2点合わせ(相似変換)」に置き換える。このPhaseでは現在地表示(`GeolocateControl`)・
緯度経度ベースの設計をVer.3から維持した。現在地の有効判定は、その後Phase 10で
屋内外ではなくジオリファレンス設定有無へ変更済み。

- [x] T-36: Prismaスキーマ移行:`MapFloor`の四隅8カラム(`topLeft/topRight/bottomRight/bottomLeft`)を削除し、基準点A・B用の8カラム(現在は`refAImageX/Y, refALat/Lng, refBImageX/Y, refBLat/Lng`)と`imageWidth`, `imageHeight`を追加
- [x] T-37: 画像アップロードAPI(`server/api/uploads/image.post.ts`)で、アップロード時に画像のピクセル幅・高さを計測し`MapFloor.imageWidth/imageHeight`に保存する処理を追加
- [x] T-38: `lib/geo.ts`に`computeFloorCorners()`(2点合わせによる相似変換で4隅を算出)を実装し、design.md 4.2節のロジックに沿って実装する。四隅個別ドラッグ・経度正規化のための旧ロジックは削除する
- [x] T-39: ジオリファレンス設定UI(`⑤-2`相当)を、4隅個別ドラッグのUIから「2点合わせウィザード」(`GeoReferenceWizard.vue`)に作り直す。イラスト側クリック→実地図側クリック(住所検索可)を、基準点A・Bそれぞれについて行う
- [x] T-40: 保存前プレビュー:`computeFloorCorners()`の計算結果を実地図上にイラストを半透明重ねで表示し、確認できるようにする
- [x] T-41: バリデーション:基準点A・Bのピクセル距離・実距離がdesign.md 4.3節の閾値未満の場合、保存時にエラーとし「もっと離れた目印を選んでください」と案内する
- [x] T-42: `MapViewer.vue` / `useMapViewer.ts`が受け取る4隅座標の算出元を、`computeFloorCorners()`の結果に差し替える
- [x] T-43: ピン配置エディタ(`editor.vue`)を開いた際、ジオリファレンス済みであれば自動的に計算済みの4隅範囲へ`fitBounds`する処理を確認・調整する
- [x] T-44: 自動テストの移行:四隅個別ドラッグ・経度正規化のために書いた既存テストを削除し、`computeFloorCorners()`のユニットテストに置き換える
- [x] T-45: 既存データのクリーンアップ確認:旧方式の座標データを洗い出して報告する(削除は別指示)

## Phase 9: 屋内フロアのジオリファレンス省略(旧仕様・廃止済み)

`isOutdoor`で屋内外を分類し、屋内だけ疑似座標へ分岐する方式として一度実装した。その後、
Phase 10で「全フロアをジオリファレンス設定有無で扱う」方式へ置き換えたため、以下は完了済みの
過去経緯であり、現在仕様ではない。

- [x] T-46: `computeIndoorPseudoCorners()`を実装(後に`computeFallbackCorners()`へ改名・一般化)
- [x] T-47: `isOutdoor`による屋外/屋内の4隅算出分岐を実装(廃止済み)
- [x] T-48: 屋内フロアでジオリファレンス設定導線を非表示化(廃止済み)
- [x] T-49: 屋内エディタを疑似座標範囲へ自動表示(全未設定フロアのfallback表示へ一般化)
- [x] T-50: 屋外/屋内切り替え時の基準点保持を実装(`isOutdoor`廃止に伴い不要化)
- [x] T-51: 屋内疑似座標と屋内外分岐をテスト(現行のfallback・設定有無テストへ置換)
- [x] T-52: 屋内外フロアの実地動作を確認(現行の設定有無別確認へ置換)

## Phase 10: ジオリファレンス設定有無への統一

Phase 9のT-46〜T-52を置き換える際、実装履歴では同じタスク番号を再利用した。
現行実装は以下を正とする。

- [x] T-46: 屋内専用だった疑似座標を、未設定フロア用の`computeFallbackCorners()`へ改名・一般化
- [x] T-47: `isGeoReferenced()`へ設定有無判定を一元化し、`getFloorCorners()`で2点合わせ/fallbackを切り替え
- [x] T-48: すべてのフロアにジオリファレンス設定・調整導線を表示し、未設定でも表示・ピン配置可能である旨を案内
- [x] T-49: `GeolocateControl`とエディタ警告をジオリファレンス設定有無で切り替え
- [x] T-50: fallback coordinatesと設定有無判定の自動テストを追加
- [x] T-51: Prisma schema・API・共有型・画面から`isOutdoor`を削除し、カラム削除migrationを追加
- [x] T-52: ジオリファレンス設定済み/未設定フロアの実地動作を確認

## Phase 11: ビューア制約・現在地エリア判定

- [x] T-53: フロアの初期表示を基準に、ズームアウト/ズームインの相対制約を設定
- [x] T-54: ジオリファレンス済みフロアの4隅から現在地の表示対象エリアを判定
- [x] T-55: エリア外の現在地マーカーを抑制し、案内メッセージとフロア範囲への視点復帰を追加
- [x] T-56: 現在地エリア判定と表示制御の自動テストを追加
- [x] T-57: フロア相対ズーム制約をブラウザで確認

## Phase 12: ピン表示方式の拡張

- [x] T-58: 雫型ピンを立体グラデーション表示へ更新
- [x] T-59: ピンの接地影を独立したDOM要素として追加
- [x] T-60: 画像を台座なしで表示する`illustration`方式を共有型・schemaへ追加
- [x] T-61: 管理画面へ3種類のピン表示方式の選択UIを追加
- [x] T-62: イラスト直置き型のMarker表示を実装
- [x] T-63: 3種類のピンデザインに対応するミニプレビューを追加
- [x] T-64: 3種類のMarker生成を自動テスト
- [x] T-65: 3種類のピン表示を実地確認

## Phase 13: Material Symbols対応

- [x] T-66: 利用するMaterial Symbolsのプリセット一覧を確定
- [x] T-67: Material Symbolsフォントを使用グリフに限定して読み込み
- [x] T-68: 旧プリセットIDを接頭辞付きIDへ正規化する後方互換を追加
- [x] T-69: 文字アイコン/Material Symbolsのファミリー切り替えUIを追加
- [x] T-70: Markerのアイコン表示をアイコンファミリーで分岐
- [x] T-71: アイコンID接頭辞と後方互換の自動テストを追加
- [x] T-72: Material Symbols表示を実地確認

## Phase 14: Category domain完成・複数カテゴリー

- [x] T-73: Map単位のCategory CRUD、表示順、使用件数、重複・使用中削除のvalidationを追加
- [x] T-74: SpotCategoryによる0/1/複数CategoryとMap境界validationをAPI・管理UIへ追加
- [x] T-75: 公開側の複数Category選択をOR semanticsで実装し、Category 0件Spotの扱いを統一
- [x] T-76: 既存データ移行後、旧`Spot.category`カラムを削除し恒久sourceから撤去

## Phase 15: 柔軟なSpot作成・後配置

- [x] T-77: 位置(`x`/`y`)未設定でSpot情報を先に作成できるフォーム・APIを実装
- [x] T-78: Spot一覧・詳細で未配置を明示し、エディタから既存Spotを後配置できる導線を追加
- [x] T-79: editor起点の位置付き新規Spotフローを維持し、camera contextを往復で保持
- [x] T-80: 位置未設定Spotの公開拒否と公開API非漏洩をテスト

## Phase 16: Floor画像・camera操作改善

- [x] T-81: upload確定前のfilename・画像preview・差し替え・cancelを追加
- [x] T-82: Floor画像差し替え時の影響警告を追加し、Spot座標と基準点を自動変更しない
- [x] T-83: Floor切替・初期表示ではfitし、通常click・PIN配置ではcameraを変更しないよう調整

## Phase 17: Map基本情報・Spot一括操作

- [x] T-84: Map名編集と、slugを公開URL保護のためread-onlyとする案内を同期
- [x] T-85: Spot一覧へ複数選択・検索結果全選択・公開/非公開・Categoryの1件追加/1件削除を追加（他Categoryは保持）
- [x] T-86: 最大100件のtransaction一括削除と件数確認、Map ownership validationを追加

## Phase 18: 意味的PIN密度

- [x] T-87: Spot重要度`normal`/`featured`をschema・API・管理フォームへ追加
- [x] T-88: フロア相対zoomに応じて通常PINを離散的に表示/非表示とし、selected・filter match・featuredを優先表示
- [x] T-89: PINサイズを`small`/`medium`/`large`の独立presetとして実装し、opacity fadeと管理者向け数値thresholdを使わない
- [x] T-90: PIN方式・接地点・選択状態と独立した密度表示を自動/実画面確認

## Phase 19: モバイル公開Map UX

- [x] T-91: Categoryチップをsafe area対応の下部操作列へ移動し、Map controlsとの競合を回避
- [x] T-92: Spot詳細をcollapsed/expandedのBottom Sheet化し、Sheet外のpan gestureを維持
- [x] T-93: desktopの右側dialog表示を維持し、レスポンシブ回帰を追加

## Phase 20: 限定的な団体branding

- [x] T-94: Mapへ団体名・ロゴ・公式WebサイトURL・SNS URLのnullable項目を追加
- [x] T-95: ownership検証済み管理API・設定UIと、ローカルupload/http(s) URL validationを追加
- [x] T-96: 公開headerへ設定済み項目だけを表示し、未設定時の従来表示を維持
- [x] T-97: 任意HTML/CSS・配色・自由レイアウトを対象外のまま維持

## 対象外としたFB

- custom PIN画像のcrop範囲editor: PdM判断により未実装・MVP対象外。画像表示の既存BUG修正とは別の新機能として扱う

## Phase 21: Product Foundation & Feedback Batch（2026-09-13）

- [x] T-98: Illustration Spotの正本を正規化IMAGE `x/y`へ統一し、legacy `lat/lng`をread-only preflight付きで移行
- [x] T-99: Floor georeferenceの編集・解除・画像差し替えでSpot/DecorationのIMAGE相対位置を保持
- [x] T-100: Tenant Media Libraryと共通picker、参照状況、使用中削除拒否を実装
- [x] T-101: Map単位Spot Field Definitions、標準6項目、カスタム5型、admin/public適用を実装
- [x] T-102: Field Definitions駆動CSV template/preview/transactional create-only importを実装
- [x] T-103: Illustration Map作成・setup flowと無効状態のReal Map選択肢を実装
- [x] T-104: Floor DecorationとPINより下のpublic renderingを実装
- [x] T-105: PINサイズpreset、離散的density、観光向けMaterial Symbols catalogを実装
- [x] T-106: Category 1件追加/削除bulk、Spot list navigation、同名警告を実装
- [x] T-107: dirty guardと共通save feedbackを実装し、mobile public Mapをregression audit

詳細なwork-unit結果は`docs/work-units/2026-09-13/PROGRESS.md`、人手確認は`docs/qa/phase1-product-batch-20260913.md`を参照する。

## WU-41 / KAN-71: CSV Export・既存Spot安全一括編集（2026-09-14）

- [x] T-108: v1 create-only互換を維持し、1 Floor全Spotのv2 CSV Exportを追加
- [x] T-109: stable Spot ID、schemaVersion、全編集可能状態rowVersionとformula-safe可逆round-tripを実装
- [x] T-110: NEW/UPDATE/UNCHANGED/WARNING/CONFLICT/ERRORとfield-level diff previewを実装
- [x] T-111: CREATE/UPDATE/Category/Custom/i18n/liveVersion/auditのserializable transaction applyを実装
- [x] T-112: OWNER/assigned Map EDITOR gate、Snapshot/Revision/除外状態不変contract、100/1000行sanityを検証

## 各タスクの依頼テンプレート(Codex用)

```
## タスク: T-XX <タイトル>

### コンテキスト
requirements.md の FR-XX, design.md の X章を参照。

### やること
(タスクの説明をそのまま貼る)

### 完了条件
- [ ] 該当機能が動作する
- [ ] 型エラーがない
- [ ] 既存のPrismaスキーマ・命名規則に従っている
```
