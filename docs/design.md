# Design: デジタルマップ作成プラットフォーム(MVP)

## 1. アーキテクチャ概要

モノリシックなNuxt 4アプリケーション1つで、公開側・管理側・APIを完結させる。SaaS化を見据えて`tenant_id`を最初からスキーマに持たせるが、MVPでは単一テナント運用でも成立する設計とする。Nuxt 4のデフォルト構成に合わせ、フロント資産は`app/`配下に置く。

```
Nuxt 4
 ├─ app/pages/[mapSlug]/index.vue        … 公開マップ閲覧
 ├─ app/pages/admin/dashboard/index.vue  … 管理画面
 ├─ app/pages/admin/login.vue
 ├─ app/composables/                     … useMapViewer 等、MapLibre/状態管理のロジック
 ├─ app/layouts/
 ├─ server/api/                          … Nitroサーバールート(REST API)
 ├─ lib/                                 … ジオリファレンス変換等の共通ロジック(サーバー/クライアント両方から参照)
 └─ prisma/                              … スキーマ・マイグレーション
```

## 2. 技術スタック

| 領域 | 選定 | 備考 |
|---|---|---|
| フレームワーク | Nuxt 4 (Vue 3, TypeScript, Composition API) | フロント/API/管理画面を1リポジトリで完結。資産は`app/`配下に配置 |
| DB | PostgreSQL | 将来PostGIS拡張の余地を残す |
| ORM | Prisma | `server/`配下のNitroルートから利用。スキーマ管理・マイグレーション |
| 地図/ビューア | **MapLibre GL JS** | イラスト画像を`image`ソースとして緯度経度に対応づけ、`pitch`(傾き)・`bearing`(回転)・`zoom`をそのまま活用する。自前の3Dレンダリングは行わない |
| 認証 | nuxt-auth-utils (セッションベース) | MVPは管理者ロールのみ。Credentials方式 |
| フォーム | VeeValidate + zod | バリデーション |
| スタイリング | Tailwind CSS (`@nuxtjs/tailwindcss`) | |
| 画像ストレージ | 開発時はローカル、本番はS3互換(MinIO等) | presigned URLは次フェーズでも可、MVPはNitro API経由アップロードで十分 |
| ジオコーディング | Nominatim (OSM) | 商用高頻度利用には不向きなので、SaaS化時に有償APIへの切替を想定 |
| デプロイ(セルフホスト) | Docker Compose (app + postgres) | 非エンジニアが `docker compose up` だけで動かせることを最優先 |

## 3. データモデル

```prisma
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  users       User[]
  maps        Map[]
}

model User {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  email        String   @unique
  passwordHash String
  role         String   @default("admin")
}

model Map {
  id          String     @id @default(cuid())
  tenantId    String
  tenant      Tenant     @relation(fields: [tenantId], references: [id])
  name        String
  slug        String     @unique
  isPublished Boolean    @default(false)
  floors      MapFloor[]
}

model MapFloor {
  id               String  @id @default(cuid())
  mapId            String
  map              Map     @relation(fields: [mapId], references: [id])
  name             String
  illustrationUrl  String
  order            Int     @default(0)
  // ジオリファレンス: 軸に沿った矩形の左上・右下のみを保持する。
  // MapLibreへ渡す右上・左下は表示時に算出する。
  topLeftLat       Float?
  topLeftLng       Float?
  bottomRightLat   Float?
  bottomRightLng   Float?
  isOutdoor        Boolean @default(true) // false の場合、現在地機能を無効化(地下街等)
  spots            Spot[]
}

model Spot {
  id               String   @id @default(cuid())
  floorId          String
  floor            MapFloor @relation(fields: [floorId], references: [id])
  name             String
  category         String
  description      String?
  lat              Float?  // 下書きでは未設定可。公開時はlat/lngの両方が必須
  lng              Float?
  photosJson       Json     @default("[]")
  hoursText        String?
  holidayText      String?
  phone            String?
  pinIconType      String   @default("preset") // 'preset' | 'custom'
  pinIconId        String?
  pinIconImageUrl  String?
  pinColor         String   @default("#C7401F")
  isPublished      Boolean  @default(false)
}
```

## 4. 地図ビューアの設計(MapLibre GL JS)

前提が変わった経緯: プラチナマップの実装調査により、`maplibre-gl`を採用していることが判明した。デフォルメイラストを緯度経度に対応づけた上で、MapLibreの`image`ソース・`pitch`/`bearing`・`GeolocateControl`など標準機能をそのまま使えば、Three.jsによる自前の擬似3D実装は不要になる。以降、この方針で統一する。

### 4.1 イラストのジオリファレンス(image source)

MapLibreの`image`ソースへは画像の四隅を渡す必要があるが、永続化するのは軸に沿った矩形の左上(`topLeft`)・右下(`bottomRight`)の2点だけとする。右上・左下は表示時に算出し、回転・台形・ねじれを許可しない。

```ts
const topRight = {
  lat: floor.topLeftLat,
  lng: floor.bottomRightLng,
};
const bottomLeft = {
  lat: floor.bottomRightLat,
  lng: floor.topLeftLng,
};
```

```ts
map.addSource(`floor-${floor.id}`, {
  type: "image",
  url: floor.illustrationUrl,
  coordinates: [
    [floor.topLeftLng, floor.topLeftLat],
    [topRight.lng, topRight.lat],
    [floor.bottomRightLng, floor.bottomRightLat],
    [bottomLeft.lng, bottomLeft.lat],
  ],
});
map.addLayer({
  id: `floor-${floor.id}-layer`,
  type: "raster",
  source: `floor-${floor.id}`,
});
```

管理画面では、住所検索またはパン・ズームで対象地域へ移動し、地図中央に表示した赤い矩形をドラッグして移動、四隅のハンドルでリサイズする。矩形内にはイラストを半透明でリアルタイム表示する。初期矩形は現在の表示範囲の中央40%を目安に生成し、最大緯度差・経度差がそれぞれ2度を超えないようクランプする。

保存時は次を検証する。

- 2点が有限値かつ緯度`-90〜90`、経度`-180〜180`の範囲内である
- `topLeft.lat > bottomRight.lat`かつ`topLeft.lng < bottomRight.lng`である
- 緯度差・経度差が0より大きく、それぞれ2度以下である
- 日付変更線をまたぐ矩形はMVPでは扱わない。経度を周回させず、住所検索で対象地域側へ移動してから配置する

#### 設計判断の記録: 4隅個別方式の廃止

当初は左上・右上・右下・左下を個別にドラッグできる方式だったが、ねじれ・台形など数学的に不正または意図しない形を作成でき、日付変更線付近の経度正規化も複雑化した。また、非エンジニアに4対応点を合わせてもらう操作は直感的でなかった。MVPのデフォルメイラストは厳密な測地補正を目的としないため、位置と大きさだけを調整する軸沿い矩形へ単純化し、回転は導入しない。

### 4.2 傾き・回転・ズームの制約

MapLibreの標準オプションで制御する。自前のカメラクランプ処理は不要。

```ts
const map = new maplibregl.Map({
  container: "map",
  style: mapStyle, // ベースの地図タイルは非表示にし、illustrationレイヤーのみ見せる運用も可
  center: [floor.centerLng, floor.centerLat],
  zoom: 17,
  pitch: 45,
  maxPitch: 70,   // 真横に寝かせすぎない
  minPitch: 0,
  dragRotate: true,
});
```

ズーム範囲は`map.setMinZoom()` / `map.setMaxZoom()`で、フロアごとのイラスト解像度に応じて設定する。

### 4.3 ピンの表示・タップ判定

`maplibregl.Marker`(DOM要素ベース、HTML/CSSでデザイン自由)を使う。ピンデザイン機能(プリセットアイコン/カラー/カスタム画像)は、Markerに渡すDOM要素の見た目を`Spot.pinIconType`等に応じて切り替えるだけで実現できる。クリックイベントは`Marker`の`element`に対する通常のDOM `click`で拾えるため、Raycasterのような自前の当たり判定は不要。

スポット数が多くなった場合の重なり対策(衝突集約)は、`kdbush`のような空間インデックスライブラリで近傍のピンをグルーピングし、集約マーカーに切り替える(次フェーズ、プラチナマップの「衝突集約」相当)。

### 4.4 フロア切り替え

フロアタブが切り替わったら、現在の`image`ソース・レイヤーを`removeLayer`/`removeSource`し、新しいフロアの`image`ソースを追加する。左上・右下から得た矩形を`fitBounds`/`cameraForBounds`へ渡し、`map.easeTo()`で矩形全体が収まる視点へ滑らかに移動する。ピン配置エディタの初回表示でも同じ矩形へ自動的に合わせる。

### 4.5 現在地表示

MapLibー標準の`GeolocateControl`を追加するだけで実現できる。

```ts
if (floor.isOutdoor) {
  map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }));
}
```

`isOutdoor === false`(地下街等)のフロアでは、このコントロールを追加しない。

## 5. 画面一覧(参照)

`platform-map-spec.xlsx`の「画面一覧」「画面詳細」シートを正とする。実装順は`tasks.md`を参照。

## 6. セキュリティ・認可

- 管理画面配下は全てNuxtのルートミドルウェア(`middleware/auth.ts`)でセッションチェックを通す
- 公開マップ画面・APIは認証不要だが、`isPublished === true`のマップ・スポットのみを返す。座標未設定のスポットは公開不可とし、公開APIにも含めない

## 7. ディレクトリ構造

```
.
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── admin/
│   │   │   ├── SpotForm.vue
│   │   │   ├── SpotList.vue
│   │   │   ├── PinDesignPicker.vue        … ⑥-2 ピンデザイン選択
│   │   │   ├── FloorManager.vue
│   │   │   └── GeoReferenceEditor.vue     … イラスト矩形の移動・リサイズUI
│   │   ├── map/
│   │   │   ├── MapViewer.vue              … MapLibre本体(公開側・エディタ両方から使う)
│   │   │   ├── SpotDetailCard.vue
│   │   │   ├── CategoryFilter.vue
│   │   │   └── FloorTabs.vue
│   │   └── ui/                            … 汎用UIパーツ(Button, Modal等)
│   ├── composables/
│   │   ├── useMapViewer.ts                … MapLibre初期化・破棄・pitch/bearing制御
│   │   ├── useGeoReference.ts             … ジオリファレンス矩形の編集ロジック
│   │   └── useAuth.ts
│   ├── layouts/
│   │   ├── default.vue                    … 公開側レイアウト
│   │   └── admin.vue                      … 管理画面レイアウト(サイドナビ等)
│   ├── middleware/
│   │   └── auth.ts                        … 管理画面ページの認証ガード
│   ├── pages/
│   │   ├── [mapSlug]/
│   │   │   └── index.vue                  … ① 公開マップ閲覧
│   │   └── admin/
│   │       ├── login.vue                  … ③
│   │       ├── dashboard/
│   │       │   └── index.vue              … ④
│   │       └── maps/
│   │           └── [mapId]/
│   │               ├── settings.vue       … ⑤ マップ設定・イラストアップロード
│   │               ├── floors.vue         … ⑤ フロア管理
│   │               ├── editor.vue         … ⑥ ピン配置エディタ
│   │               ├── spots/
│   │               │   ├── index.vue      … ⑦ スポット一覧
│   │               │   ├── new.vue
│   │               │   └── [spotId].vue   … ⑦ 編集フォーム
│   │               └── publish.vue        … ⑧ 公開設定
│   ├── app.vue
│   └── error.vue
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login.post.ts
│   │   ├── maps/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [mapId]/
│   │   │       ├── index.get.ts
│   │   │       ├── index.patch.ts
│   │   │       ├── publish.post.ts
│   │   │       └── floors/
│   │   │           ├── index.get.ts
│   │   │           ├── index.post.ts
│   │   │           └── [floorId]/
│   │   │               ├── index.patch.ts
│   │   │               ├── index.delete.ts
│   │   │               └── spots/
│   │   │                   ├── index.get.ts
│   │   │                   ├── index.post.ts
│   │   │                   └── [spotId].patch.ts
│   │   ├── public/
│   │   │   └── [mapSlug]/
│   │   │       └── index.get.ts           … 公開側専用API(isPublishedのみ返す)
│   │   ├── geocode.get.ts                 … Nominatimラッパー
│   │   └── uploads/
│   │       └── image.post.ts
│   ├── utils/
│   │   ├── prisma.ts
│   │   └── session.ts
│   └── middleware/
│       └── 00.auth-check.ts               … 管理API用の認可チェック(admin配下のAPIに一括適用)
├── lib/
│   └── geo.ts                             … 矩形2点の検証・MapLibre用4隅座標への変換等の共通ロジック
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── uploads/                           … 開発時のローカル画像保存先(本番はS3等に切替)
├── docker/
│   └── postgres/
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── AGENTS.md                              … ルート直下必須(Codexが自動参照)
├── docs/
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── wireframe-spec.md                  … デザイナー向けワイヤー仕様書
│   ├── feature-list.xlsx
│   └── platform-map-spec.xlsx
└── package.json
```

**設計上のポイント**

- **公開APIと管理APIを`server/api/public/`と`server/api/maps/`で明確に分離**している。`isPublished`のフィルタ漏れによる非公開データの露出を防ぐため、公開側が参照できるエンドポイントを物理的に別ディレクトリへ隔離する
- **Nitroのファイル名規約**(`index.get.ts`, `index.post.ts`, `[id].patch.ts`)にそのまま従う。HTTPメソッドをファイル名に持たせることで、1エンドポイント1ファイルの見通しを保つ
- **`MapViewer.vue`は公開側とピン配置エディタの両方から使い回す**前提にしている(閲覧用は読み取り専用、エディタはクリックでピン追加・ドラッグ移動を有効化、という差分をpropsで切り替える)
- `lib/geo.ts`はサーバー(ジオコーディング結果の検証等)とクライアント(GeoReferenceEditorでの入力チェック)の両方から参照するため、Nuxtの自動importに依存しない素のTypeScriptモジュールとして`app/`の外に置いている
