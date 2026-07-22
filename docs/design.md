# Design: デジタルマップ作成プラットフォーム(MVP)
Ver.5 ― 2点合わせジオリファレンス方式(緯度経度ベース・現在地機能を維持)

## 0. Ver.5での変更点(重要・経緯)

- Ver.3:イラストの四隅を個別にドラッグして緯度経度に対応づける方式を採用したが、
  対角がねじれた歪んだ四角形や、日付変更線をまたぐ座標破損など、繰り返しバグが発生した
- Ver.4案(未実装のまま破棄):ジオリファレンスを丸ごと廃止し、実世界と対応しない
  「疑似座標」に切り替える案を検討したが、**現在地表示を将来的にマストで欲しい**という
  事業判断により採用しなかった
- **Ver.5(採用): ジオリファレンスの"やり方"だけを直す。** イラスト上と実地図上、それぞれで
  対応する目印を2箇所ずつクリックする「2点合わせ」方式に変更する。2点の対応関係から、
  位置・回転・縮尺を数学的に一意に計算する(相似変換/ヘルマート変換)。パラメータが
  2点(自由度4)しかないため、4隅個別ドラッグ(自由度8)のような歪んだ形は原理的に
  作れない
- 緯度経度ベースの設計・`GeolocateControl`による現在地表示(屋外フロアのみ)は
  Ver.3から維持する。変更が必要なのは、ジオリファレンス設定UIと、その裏側の
  座標計算ロジックのみ

## 1. アーキテクチャ概要

モノリシックなNuxt 4アプリケーション1つで、公開側・管理側・APIを完結させる。SaaS化を見据えて`tenant_id`を最初からスキーマに持たせるが、MVPでは単一テナント運用でも成立する設計とする。Nuxt 4のデフォルト構成に合わせ、フロント資産は`app/`配下に置く。

```
Nuxt 4
 ├─ app/pages/[mapSlug]/index.vue        … 公開マップ閲覧
 ├─ app/pages/admin/dashboard/index.vue  … 管理画面
 ├─ app/pages/admin/login.vue
 ├─ app/composables/                     … useMapViewer, useGeoReference 等
 ├─ app/layouts/
 ├─ server/api/                          … Nitroサーバールート(REST API)
 ├─ lib/                                 … 座標計算(相似変換)等の共通ロジック
 └─ prisma/                              … スキーマ・マイグレーション
```

## 2. 技術スタック

| 領域 | 選定 | 備考 |
|---|---|---|
| フレームワーク | Nuxt 4 (Vue 3, TypeScript, Composition API) | フロント/API/管理画面を1リポジトリで完結 |
| DB | PostgreSQL | |
| ORM | Prisma | |
| 地図/ビューア | **MapLibre GL JS** | イラストを`image`ソースとして緯度経度に対応づけ、`pitch`/`bearing`/`zoom`を活用する |
| ジオコーディング | Nominatim (OSM) | 基準点(目印)を実地図側で探す際の住所検索補助として使用 |
| 認証 | nuxt-auth-utils (セッションベース) | MVPは管理者ロールのみ |
| フォーム | VeeValidate + zod | |
| スタイリング | Tailwind CSS (`@nuxtjs/tailwindcss`) | |
| 画像ストレージ | 開発時はローカル、本番はS3互換(MinIO等) | |
| デプロイ(セルフホスト) | Docker Compose (app + postgres) | |

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
  imageWidth       Int     // アップロード時に読み取ったピクセル幅
  imageHeight      Int     // アップロード時に読み取ったピクセル高さ
  isOutdoor        Boolean @default(true) // false の場合、現在地機能を無効化(地下街等)

  // 基準点A: イラスト上のピクセル座標 + 対応する実世界の緯度経度
  refAPixelX       Float?
  refAPixelY       Float?
  refALat          Float?
  refALng          Float?
  // 基準点B: 同上(Aとは別の目印を選ぶ)
  refBPixelX       Float?
  refBPixelY       Float?
  refBLat          Float?
  refBLng          Float?

  spots            Spot[]
}

model Spot {
  id               String   @id @default(cuid())
  floorId          String
  floor            MapFloor @relation(fields: [floorId], references: [id])
  name             String
  category         String
  description      String?
  lat              Float
  lng              Float
  photosJson       Json     @default("[]")
  hoursText        String?
  holidayText      String?
  phone            String?
  pinIconType      String   @default("preset")
  pinIconId        String?
  pinIconImageUrl  String?
  pinColor         String   @default("#C7401F")
  isPublished      Boolean  @default(false)
}
```

**Ver.3からの変更点**
- `MapFloor`の四隅8カラム(`topLeft/topRight/bottomRight/bottomLeft`の緯度経度)を削除
- 代わりに、管理者が実際に指定する「基準点A・基準点B」(各点につきピクセル座標+緯度経度の4値、合計8カラム)を保持する。四隅の座標はこの2点から都度計算する(保存しない)
- `imageWidth`, `imageHeight`を追加(ピクセル⇔実距離の変換に必要)
- `Spot.lat, lng`はVer.3から変更なし

## 4. ジオリファレンスの設計(2点合わせ・相似変換)

### 4.1 なぜ2点合わせか

4隅を個別にドラッグできる設計(自由度8)は、理論上どんな歪んだ四角形も作れてしまう。
2点(自由度4:各点の緯度経度2つ×2点)だけを入力として受け取り、そこから「回転+
一様な拡大縮小+平行移動(相似変換)」を計算して4隅を導出する方式にすると、
**出力は常に正しい平行四辺形(実質的に長方形)にしかならない**。管理者は4隅は
おろか、回転や縮尺の数値も直接入力しない。

### 4.2 計算ロジック

```ts
// lib/geo.ts

// 小さい範囲を前提とした等距円筒図法での近似変換(メートル単位)
function lngLatToLocalMeters(lat: number, lng: number, originLat: number, originLng: number) {
  const R = 6378137; // 地球半径(m)
  const x = (lng - originLng) * (Math.PI / 180) * R * Math.cos(originLat * Math.PI / 180);
  const y = (lat - originLat) * (Math.PI / 180) * R;
  return { x, y };
}
function localMetersToLngLat(x: number, y: number, originLat: number, originLng: number) {
  const R = 6378137;
  const lat = originLat + (y / R) * (180 / Math.PI);
  const lng = originLng + (x / (R * Math.cos(originLat * Math.PI / 180))) * (180 / Math.PI);
  return { lat, lng };
}

export function computeFloorCorners(floor: {
  imageWidth: number; imageHeight: number;
  refAPixelX: number; refAPixelY: number; refALat: number; refALng: number;
  refBPixelX: number; refBPixelY: number; refBLat: number; refBLng: number;
}) {
  const origin = { lat: floor.refALat, lng: floor.refALng };

  // 実世界側のベクトル(A→B、メートル)
  const bMeters = lngLatToLocalMeters(floor.refBLat, floor.refBLng, origin.lat, origin.lng);
  // ピクセル側のベクトル(A→B。画像はy軸下向きなので符号に注意)
  const pxDx = floor.refBPixelX - floor.refAPixelX;
  const pxDy = floor.refBPixelY - floor.refAPixelY;

  const pixelDist = Math.hypot(pxDx, pxDy);
  const metersDist = Math.hypot(bMeters.x, bMeters.y);
  if (pixelDist < 50 || metersDist < 20) {
    throw new Error("基準点が近すぎます。もっと離れた目印を選んでください。");
  }

  const scale = metersDist / pixelDist; // メートル/ピクセル
  // ピクセル空間の角度(y下向き)と、実世界(メートル、y=北が正)の角度の差から回転を求める
  const pixelAngle = Math.atan2(-pxDy, pxDx); // y反転して「上が正」に揃える
  const metersAngle = Math.atan2(bMeters.y, bMeters.x);
  const rotation = metersAngle - pixelAngle;

  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  function pixelToMeters(px: number, py: number) {
    const dx = px - floor.refAPixelX;
    const dy = -(py - floor.refAPixelY); // y反転
    const mx = (dx * cos - dy * sin) * scale;
    const my = (dx * sin + dy * cos) * scale;
    return { x: mx, y: my };
  }
  function corner(px: number, py: number) {
    const m = pixelToMeters(px, py);
    return localMetersToLngLat(m.x, m.y, origin.lat, origin.lng);
  }

  return {
    topLeft:     corner(0, 0),
    topRight:    corner(floor.imageWidth, 0),
    bottomRight: corner(floor.imageWidth, floor.imageHeight),
    bottomLeft:  corner(0, floor.imageHeight),
  };
}
```

この関数はDBには保存されている生の基準点(A, B)だけから、表示のたびに4隅を再計算する。四隅を直接保存しないことで、計算式の改善やバグ修正を後からしても、管理者に再設定を強いる必要がない。

### 4.3 バリデーション

- 基準点AとBが、ピクセル距離・実距離ともに一定以上離れていること(近すぎると回転・縮尺の誤差が大きくなるため、`computeFloorCorners`内でエラーとする)
- 保存前に、計算結果(4隅)を実際の地図上にプレビュー表示し、管理者が目視で確認できるようにする

### 4.4 MapLibreへの反映

```ts
const corners = computeFloorCorners(floor);
map.addSource(`floor-${floor.id}`, {
  type: "image",
  url: floor.illustrationUrl,
  coordinates: [
    [corners.topLeft.lng, corners.topLeft.lat],
    [corners.topRight.lng, corners.topRight.lat],
    [corners.bottomRight.lng, corners.bottomRight.lat],
    [corners.bottomLeft.lng, corners.bottomLeft.lat],
  ],
});
```

### 4.5 傾き・回転・ズーム、ピン表示、フロア切替、現在地表示

Ver.3から変更なし。

- `pitch`/`bearing`/`zoom`はMapLibre標準オプション(`maxPitch`等)で制約する
- ピンは`maplibregl.Marker`(DOM要素ベース)、クリック判定も標準のDOMイベント
- フロア切り替え時は`image`ソースを差し替え、計算済みの4隅範囲へ`fitBounds`する
- 現在地表示は`GeolocateControl`を`isOutdoor === true`のフロアのみに追加する。地下街等、GPSの入らない`isOutdoor === false`のフロアには追加しない

### 4.6 屋内フロア(is_outdoor = false)は2点合わせを省略する

**背景**:ジオリファレンス(2点合わせ)の目的は、現在地(GPS)とイラストを対応づけることにある。しかし`is_outdoor === false`のフロアは、そもそも4.5節の通り`GeolocateControl`自体を表示しないため、**GPSと突き合わせる場面が存在しない**。この場合、管理者に実地図上での2点合わせを求めるのは無駄な手間でしかない。

**対応方針**:`is_outdoor === false`のフロアでは、⑤-2のジオリファレンス設定ウィザードを表示せず、画像の縦横比から機械的に算出した「実世界とは無関係な仮の座標範囲」を自動的に割り当てる。管理者は一切操作しない。

```ts
// lib/geo.ts
const INDOOR_PSEUDO_ORIGIN = { lat: 0, lng: 0 }; // 実世界のどこにも対応しない固定点
const INDOOR_PSEUDO_EXTENT_DEG = 0.01; // 見た目のズーム感が揃う程度の固定値

export function computeIndoorPseudoCorners(imageWidth: number, imageHeight: number) {
  const aspect = imageWidth / imageHeight;
  const halfLng = aspect >= 1 ? INDOOR_PSEUDO_EXTENT_DEG / 2 : (INDOOR_PSEUDO_EXTENT_DEG * aspect) / 2;
  const halfLat = aspect >= 1 ? (INDOOR_PSEUDO_EXTENT_DEG / aspect) / 2 : INDOOR_PSEUDO_EXTENT_DEG / 2;
  const { lat, lng } = INDOOR_PSEUDO_ORIGIN;
  return {
    topLeft:     { lat: lat + halfLat, lng: lng - halfLng },
    topRight:    { lat: lat + halfLat, lng: lng + halfLng },
    bottomRight: { lat: lat - halfLat, lng: lng - halfLat },
    bottomLeft:  { lat: lat - halfLat, lng: lng + halfLng },
  };
}
```

**呼び出し側の分岐**

```ts
const corners = floor.isOutdoor
  ? computeFloorCorners(floor)          // 屋外: 実世界の基準点2つから算出(4.2節)
  : computeIndoorPseudoCorners(floor.imageWidth, floor.imageHeight); // 屋内: 自動算出、管理者操作なし
```

**UI・運用上の扱い**

- ⑤マップ設定画面で「屋内」トグルをONにしたフロアには、「ジオリファレンスを設定する」ボタン自体を表示しない(不要なため)
- ⑥ピン配置エディタも、屋内フロアを開いた際は即座にイラスト全体が収まる表示になる(ジオリファレンス未設定の警告は出さない)
- フロアの屋外/屋内を後から切り替えた場合の扱い:
  - 屋外→屋内に変更:既存の基準点(refA/refB)は保持するが、表示計算では使用しない(いつでも屋外に戻せるようにするため、破棄はしない)
  - 屋内→屋外に変更:基準点が未設定であれば、通常通り⑤-2のウィザードへの案内を表示する

**この方式のトレードオフ(明示しておくべき点)**

- 屋内フロアの座標は完全に実世界と無関係なので、**将来「屋内フロアでも現在地相当の機能を使いたい」となった場合(屋内測位ビーコン等の導入)、この仮座標は使えず、あらためて座標体系を設計し直す必要がある**。ただし現時点でそのニーズはなく、対応外(3章のスコープ外項目を参照)としているため、実務上の影響はない

## 5. 画面一覧(参照)

`docs/wireframe-spec.md`(Ver.5)を正とする。実装順は`docs/tasks.md`を参照。

## 6. セキュリティ・認可

- 管理画面配下は全てNuxtのルートミドルウェア(`middleware/auth.ts`)でセッションチェックを通す
- 公開マップ画面・APIは認証不要だが、`isPublished === true`のマップ・スポットのみを返す

## 7. ディレクトリ構造

```
.
├── app/
│   ├── assets/css/tailwind.css
│   ├── components/
│   │   ├── admin/
│   │   │   ├── SpotForm.vue
│   │   │   ├── SpotList.vue
│   │   │   ├── PinDesignPicker.vue
│   │   │   ├── FloorManager.vue
│   │   │   └── GeoReferenceWizard.vue     … 2点合わせウィザード(⑤-2)
│   │   ├── map/
│   │   │   ├── MapViewer.vue
│   │   │   ├── SpotDetailCard.vue
│   │   │   ├── CategoryFilter.vue
│   │   │   └── FloorTabs.vue
│   │   └── ui/
│   ├── composables/
│   │   ├── useMapViewer.ts
│   │   ├── useGeoReference.ts             … 2点合わせの状態管理
│   │   └── useAuth.ts
│   ├── layouts/
│   │   ├── default.vue
│   │   └── admin.vue
│   ├── middleware/
│   │   └── auth.ts
│   ├── pages/
│   │   ├── [mapSlug]/index.vue            … ①
│   │   └── admin/
│   │       ├── login.vue                  … ③
│   │       ├── dashboard/index.vue        … ④
│   │       └── maps/[mapId]/
│   │           ├── settings.vue           … ⑤
│   │           ├── floors.vue             … ⑤
│   │           ├── georeference.vue       … ⑤-2
│   │           ├── editor.vue             … ⑥
│   │           ├── spots/
│   │           │   ├── index.vue          … ⑦
│   │           │   ├── new.vue
│   │           │   └── [spotId].vue
│   │           └── publish.vue            … ⑧
│   ├── app.vue
│   └── error.vue
├── server/
│   ├── api/
│   │   ├── auth/login.post.ts
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
│   │   │               ├── georeference.patch.ts  … 基準点A/Bの保存
│   │   │               ├── index.delete.ts
│   │   │               └── spots/
│   │   │                   ├── index.get.ts
│   │   │                   ├── index.post.ts
│   │   │                   └── [spotId].patch.ts
│   │   ├── public/[mapSlug]/index.get.ts
│   │   ├── geocode.get.ts                 … Nominatimラッパー(基準点検索補助)
│   │   └── uploads/image.post.ts          … アップロード時にimageWidth/imageHeightを計測
│   ├── utils/
│   │   ├── prisma.ts
│   │   └── session.ts
│   └── middleware/00.auth-check.ts
├── lib/
│   └── geo.ts                             … computeFloorCorners()等
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/uploads/
├── docker/postgres/
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── AGENTS.md
├── docs/
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── wireframe-spec.md
│   ├── feature-list.xlsx
│   └── platform-map-spec.xlsx
└── package.json
```
