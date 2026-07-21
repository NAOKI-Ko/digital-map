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
- MapLibreの初期化は`onMounted`、破棄(`map.remove()`)は`onUnmounted`で行う。ロジックは`app/composables/useMapViewer.ts`に切り出す
- ピン表示: `maplibregl.Marker`(DOM要素ベース)を使う。ピンデザイン(プリセット/カラー/カスタム画像)は、Markerに渡すDOM要素の見た目を切り替えることで実現する
- スタイリング: `@nuxtjs/tailwindcss`モジュールを使用する。CSS Modulesとの混在はしない
- フォーム: VeeValidate + zod でバリデーションする
- 状態管理: 複雑なグローバル状態が必要になるまでPiniaは導入せず、composablesで足りる範囲に留める

## コーディング規約

- 緯度経度は必ず`lat`, `lng`という命名で統一する(`latitude`/`longitude`は使わない)
- イラストのジオリファレンス矩形(左上・右下の緯度経度と、MapLibre用4隅座標への変換)に関する処理は`lib/geo.ts`に集約し、コンポーネント側に計算ロジックを書かない
- 公開側のAPI・画面は、必ず`isPublished === true`のデータのみを返す/表示する。非公開データの漏洩は最優先の防止事項
- コンポーネントは1ファイル1責務を意識する。`MapViewer.vue`のような大きなMapLibre関連コンポーネントは、内部ロジックを`app/composables/`・`lib/`のヘルパー関数に切り出す

## やってはいけないこと

- 緯度経度・住所ジオコーディングを使わない旧設計(イラスト内の独立座標系のみで位置管理する方式)には戻さない。現行設計は必ず緯度経度をベースにする
- **Three.jsによる自前の擬似3Dビューア実装には戻さない。**傾き・回転・ズーム・現在地表示は、すべてMapLibre GL JSの標準機能(`pitch`/`bearing`/`GeolocateControl`等)で実現する
- MVPスコープ外の機能(CSV一括インポート、店舗オーナー編集フロー、ルート機能、お知らせ機能、多言語、クーポン、テンプレート/ブランディング設定)を先回りして実装しない。`docs/requirements.md` 2章のスコープを厳守する
- 地下街等、`MapFloor.isOutdoor === false`のフロアで`GeolocateControl`(現在地機能)を追加しない

## タスクの進め方

`docs/tasks.md`のタスクを上から順に、1タスク=1PR相当の粒度で進める。各タスクの完了条件を満たしたら次のタスクに進む。設計判断に迷った場合は`docs/design.md`を正とし、そこに記載がない場合は`docs/requirements.md`の要件に立ち返って判断する。
