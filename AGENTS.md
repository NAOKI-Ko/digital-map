# AGENTS.md

このリポジトリで作業するAIコーディングエージェント向けの指示書です。

## プロジェクト概要

非エンジニアの団体(商店街振興組合・温泉旅館組合・地下街管理会社)向けの、デジタルマップ作成プラットフォーム。詳細は以下を参照:

- `docs/requirements.md` … 要件定義・ユーザーストーリー
- `docs/design.md` … 技術設計・データモデル・ディレクトリ構造
- `docs/tasks.md` … 実装タスク分解

## 技術スタックのルール

- フレームワーク: Nuxt 4 (Vue 3, Composition API, `<script setup lang="ts">`)。Options APIは使わない。フロント資産は`app/`配下に置く(Nuxt 4のデフォルト構成)
- DB: PostgreSQL + Prisma。生SQLは特別な理由がない限り書かない。Prismaクライアントは`server/utils/prisma.ts`等に集約し、各APIハンドラで使い回す
- API: `server/api/`配下のNitroサーバールートとして実装する(Express等の別サーバーは立てない)
- 地図/ビューア: **MapLibre GL JS**を使う。Three.jsによる自前3Dレンダリングには戻さない。イラストは`image`ソースとして緯度経度に対応づけ、`pitch`/`bearing`/`zoom`はMapLibreの標準機能をそのまま使う
- ジオリファレンス(イラストと実世界の緯度経度を対応づける機能)は**「2点合わせ」方式**で実装する。イラスト上・実地図上でそれぞれ2箇所の目印をクリックし、その対応関係から相似変換(回転+一様縮尺)で4隅を自動計算する(design.md 4章)。**4隅を個別にドラッグさせる方式には戻さない**(過去に採用し、歪んだ形・日付変更線での破損が繰り返し発生したため廃止済み)
- 現在地表示(`GeolocateControl`)・住所ジオコーディングは実装する。現在地表示は、基準点A・Bの8項目(`refAPixelX/Y`, `refALat/Lng`, `refBPixelX/Y`, `refBLat/Lng`)がすべて有限数として揃い、`isGeoReferenced()`が`true`になるフロアだけで有効にする
- MapLibreの初期化は`onMounted`、破棄(`map.remove()`)は`onUnmounted`で行う。ロジックは`app/composables/useMapViewer.ts`に切り出す
- ピン表示: `maplibregl.Marker`(DOM要素ベース)を使う。`pinIconType`は`preset`(文字アイコン/Material Symbols)、`custom`(画像をピン内に表示)、`illustration`(画像を台座なしで直置き)の3方式とし、カラーを含む見た目はMarkerに渡すDOM要素で切り替える
- SpotのカテゴリーはMap単位の`Category`マスタとのmany-to-many (`SpotCategory`)を正とし、旧`Spot.category`文字列へ戻さない。0件を許可し、公開絞り込みは複数選択ORとする
- Spotは位置未設定(`lat`/`lng`がともに`null`)で作成できるが、公開は位置設定済みだけに限定する。PINをSpotと別のentityとして作らない
- PINの表示優先度は`importance: normal | featured`で表し、rawなMapLibre zoom値を管理UIへ露出しない。ピンデザイン方式とは独立して扱う
- スタイリング: `@nuxtjs/tailwindcss`モジュールを使用する。CSS Modulesとの混在はしない
- フォーム: VeeValidate + zod でバリデーションする
- 状態管理: 複雑なグローバル状態が必要になるまでPiniaは導入せず、composablesで足りる範囲に留める

## コーディング規約

- スポットの位置は`lat`, `lng`という命名で統一する(`latitude`/`longitude`は使わない)
- ジオリファレンス(基準点A・Bから4隅を計算するロジック)は`lib/geo.ts`の`computeFloorCorners()`に集約し、コンポーネント側に計算ロジックを書かない。4隅そのものはDBに保存せず、基準点(ピクセル座標+緯度経度)から都度計算する
- ジオリファレンス設定有無の判定は`lib/geo.ts`の`isGeoReferenced()`、表示用4隅の取得は`getFloorCorners()`に集約する。未設定フロアは`computeFallbackCorners()`で画像の縦横比を保ったfallback coordinatesに表示できるが、実世界の位置ではないため現在地機能は有効にしない
- 公開側のAPI・画面は、必ず`isPublished === true`のデータのみを返す/表示する。非公開データの漏洩は最優先の防止事項
- コンポーネントは1ファイル1責務を意識する。`MapViewer.vue`のような大きなMapLibre関連コンポーネントは、内部ロジックを`app/composables/`・`lib/`のヘルパー関数に切り出す

## やってはいけないこと

- **Three.jsによる自前の擬似3Dビューア実装には戻さない。**傾き・回転・ズームは、すべてMapLibre GL JSの標準機能(`pitch`/`bearing`)で実現する
- **ジオリファレンスを「4隅を個別にドラッグする」方式や、実世界の緯度経度と対応させない座標だけで置き換える方式には戻さない。**実世界との対応づけには必ず「2点合わせ(相似変換)」方式を使う。未設定フロアを表示するためのfallback coordinatesはこの禁止に含まれないが、実世界座標として扱わない。過去に4隅個別ドラッグ方式と全体を疑似座標化する案を採用・検討し、運用上・事業上の問題(操作の難しさ、繰り返すバグ、将来の現在地機能が実現できなくなること)により見送った経緯がある。同じ提案が再度出た場合は、まずdesign.md 0章の経緯を確認すること
- `MapFloor`に屋内外フラグを再導入したり、フロア名・用途から現在地機能の可否を推測したりしない。基準点A・Bが未設定または不完全なフロアで`GeolocateControl`を追加しない
- MVPスコープ外の機能(CSV一括インポート、店舗オーナー編集フロー、ルート機能、お知らせ機能、多言語、クーポン、マップテンプレート、自由レイアウト/任意HTML/CSSのブランディング、custom PIN画像のcrop範囲editor)を先回りして実装しない。公開ヘッダーで許可する団体情報はMap単位の団体名・ロゴ・公式WebサイトURL・SNS URLに限定する。`docs/requirements.md` 2章のスコープを厳守する

## タスクの進め方

`docs/tasks.md`のタスクを上から順に、1タスク=1PR相当の粒度で進める。各タスクの完了条件を満たしたら次のタスクに進む。設計判断に迷った場合は`docs/design.md`を正とし、そこに記載がない場合は`docs/requirements.md`の要件に立ち返って判断する。
