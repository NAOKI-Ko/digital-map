# Design: デジタルマップ作成プラットフォーム(MVP)
Ver.5 ― 2点合わせジオリファレンス方式(現行実装同期版)

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
- Ver.5策定時は`MapFloor.isOutdoor`で現在地表示を切り替える設計だった。その後、屋内外を
  システム上で分類せず、**基準点A・Bが揃ってジオリファレンス済みか**で切り替える方式へ変更した。
  `isOutdoor`カラムは廃止済みであり、現行のPrisma schema・公開API・画面型には存在しない
- 現行実装では、基準点A・Bが未設定でも画像寸法から`computeFallbackCorners()`で表示用の
  fallback coordinatesを算出し、イラスト表示とピン配置を利用できる。この座標は実世界の位置を
  表さず、現在地機能の有効判定には使わない。これはVer.4で破棄した「システム全体を疑似座標へ
  置き換える案」とは異なる

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
| 画像ストレージ | ローカルファイルシステム | 開発時は`public/uploads/`、本番は`NUXT_UPLOAD_DIR`で永続化先を指定 |
| デプロイ(セルフホスト) | Docker Compose (app + postgres) | |

## 3. データモデル

完全な定義は`prisma/schema.prisma`を正とする。主要entityと境界は次の通り。

| Entity | Scope / responsibility |
|---|---|
| `Tenant`, `User` | 認証主体と所有境界。Tenantは複数MapとMediaAssetを持つ |
| `Map` | Tenant配下のIllustration Map shell、slug、公開状態、限定branding、Category、Spot Field Definitions |
| `MapFloor` | Map配下のillustration asset/寸法、順序、任意の2点georeference。SpotとDecorationを持つ |
| `Spot` | Floor配下の情報entity。正本位置はnullableな正規化`x/y`、PINはtype/color/size/importanceを独立保持 |
| `Category`, `SpotCategory` | Map単位CategoryとSpotのmany-to-many。Category 0件を許可 |
| `MediaAsset`, `SpotPhoto` | Tenant単位assetと用途別relation。Spot写真は順序付き |
| `SpotFieldDefinition`, `SpotFieldValue` | Map単位の表示/validation定義と、Spotごとのcustom value |
| `FloorDecoration` | Floor配下のIMAGE相対visual object。MediaAsset、`x/y/width/rotation/order`を保持 |

重要な不変条件:

- IMAGE Spotは`x/y`が両方`null`（未配置）または両方`0..1`（配置済み）。Spot-level `lat/lng`は保持しない。
- Floor georeferenceは正規化画像点A/Bと対応する実世界lat/lngだけを保持し、四隅は計算する。追加・変更・解除でSpot/Decorationを更新しない。
- MediaAssetはTenant単位でMap/用途をまたいで再利用する。legacy URL列は安全なread compatibilityのため残すが、新しいmanaged uploadはasset relationを使う。
- 標準Spot値は通常列を維持し、Field Definitionがlabel/enabled/public/required/orderを決める。custom値だけを`SpotFieldValue.valueJson`に保存する。
- DecorationはSpotではなく、PINより下の専用layerに描画する。
- `pinSize = small | medium | large`、`importance = normal | featured`。サイズと表示優先度を混同しない。
- `Map`の団体情報は団体名・ロゴ・公式Webサイト・SNS URLだけで、任意HTML/CSSを保存しない。

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
  refAImageX: number; refAImageY: number; refALat: number; refALng: number;
  refBImageX: number; refBImageY: number; refBLat: number; refBLng: number;
}) {
  const origin = { lat: floor.refALat, lng: floor.refALng };

  // 実世界側のベクトル(A→B、メートル)
  const bMeters = lngLatToLocalMeters(floor.refBLat, floor.refBLng, origin.lat, origin.lng);
  // 正規化座標を元画像ピクセルへ戻す。画像はy軸下向きなので符号に注意
  const refAPixelX = floor.refAImageX * floor.imageWidth;
  const refAPixelY = floor.refAImageY * floor.imageHeight;
  const refBPixelX = floor.refBImageX * floor.imageWidth;
  const refBPixelY = floor.refBImageY * floor.imageHeight;
  const pxDx = refBPixelX - refAPixelX;
  const pxDy = refBPixelY - refAPixelY;

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
    const dx = px - refAPixelX;
    const dy = -(py - refAPixelY); // y反転
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

MapLibreによる表示方式はVer.3から維持し、現在地の有効判定は現行実装へ同期する。

- `pitch`/`bearing`/`zoom`はMapLibre標準オプション(`maxPitch`等)で制約する
- ピンは`maplibregl.Marker`(DOM要素ベース)。プリセット、カスタム画像入りピン、イラスト直置きをDOMの見た目で切り替え、クリック判定も標準のDOMイベントを使う
- フロア切り替え時は`image`ソースを差し替え、計算済みの4隅範囲へ`fitBounds`する
- 現在地表示は`isGeoReferenced(floor)`が`true`のフロアだけに`GeolocateControl`を追加する。判定対象は基準点A・Bの8項目で、屋内外という分類は使わない
- GPSで得た位置が、フロア4隅を含む円と許容マージン300mの外側なら現在地マーカーを表示せず、エリアから離れている旨を表示してフロア範囲へ視点を戻す

### 4.6 ジオリファレンス未設定フロアのfallback表示

`getFloorCorners()`は、`isGeoReferenced(floor)`が`false`の場合に`computeFallbackCorners()`を使う。
画像の縦横比を保ち、緯度0・経度0を中心とした固定範囲へ4隅を割り当てるため、基準点A・Bが
未設定でもイラスト表示・`fitBounds`・ピン配置を利用できる。

```ts
const corners = isGeoReferenced(floor)
  ? computeFloorCorners(floor)
  : computeFallbackCorners(floor.imageWidth, floor.imageHeight)
```

fallback coordinatesは実世界の位置を表さない。したがって、次の扱いを必須とする。

- fallback表示に成功しても「ジオリファレンス設定済み」とは判定しない
- `GeolocateControl`は追加しない
- フロア管理とピン配置エディタには、現在地機能を使うには2点合わせが必要である旨と設定導線を表示する
- すべてのフロアで2点合わせを設定・調整できる。屋内外トグルによる導線の出し分けは行わない

### 4.7 旧仕様: `isOutdoor`による屋内外分岐(廃止済み)

一時期、`MapFloor.isOutdoor`を持ち、屋外フロアは`computeFloorCorners()`、屋内フロアは
`computeIndoorPseudoCorners()`へ分岐する設計・実装を採用していた。屋内フロアでは2点合わせの
導線を隠し、屋外/屋内の切り替え時には保存済み基準点を保持する想定だった。

この方式はその後廃止され、`isOutdoor`カラムと屋内外トグル、`computeIndoorPseudoCorners()`は削除済み。
疑似座標計算は「屋内用」ではなく「ジオリファレンス未設定時のfallback」として
`computeFallbackCorners()`へ改名・一般化された。現在仕様として屋内外分岐を再導入しない。

### 4.8 Spot lifecycle・意味的PIN密度・モバイル公開UI

- Spotは情報を先に作成し、`x`/`y`を後からエディタで設定できる。公開APIは位置未設定Spotを返さず、公開操作も拒否する。PINを独立entityにはしない
- CategoryはMap単位で管理し、Spotとのmany-to-many relationを`categoryIds`で更新する。公開絞り込みは複数選択ORとし、未使用Categoryだけを削除できる。表示順は`Category.order`を使う
- Floor画像のupload前にはfilenameと画像previewを表示し、cancelまたは差し替えができる。既存Floorの画像差し替えではSpotの`x`/`y`と基準点A・Bを自動変更せず、再確認が必要な旨を警告する
- cameraはFloor切り替え・初期表示でFloor全体へfitする。通常のMap clickやPIN配置ではfitせず、Spot登録画面との往復ではcenter/zoomを復元する
- PIN visibilityは`selected > active category-filter match > featured > normal`の順で、表示/非表示を離散的に決める。selectedとfilter matchは通常のzoom抑制を回避し、featuredはnormalより遠方で残す。opacity fadeや管理者向けraw thresholdは使わない
- Markerの位置基準は3方式ともbottom-center接地点とする。`pinSize`の`small`/`medium`/`large` scaleや選択状態で接地点をずらさない
- custom PIN画像のcrop範囲editorは実装せず、PdM判断によりMVP対象外とする。画像の見え方に関する不具合修正と、新しいcrop編集機能の追加は区別する
- mobile公開画面はMap操作を主とし、Categoryチップをsafe area対応の下部操作列、Spot詳細をcollapsed/expandedのBottom Sheetとして表示する。背景レイヤーはpan gestureを奪わない。desktopは右側dialogを維持する
- 公開ヘッダーは団体名・ローカルuploadロゴ・http/httpsの公式Webサイト/SNSリンクだけを任意表示し、未設定時は従来表示を維持する

### 4.9 Media・Spot Field・CSV・Decoration

- 共通Media pickerは新規uploadとTenant Libraryを同じUIで扱い、最近使用/このMap/すべて/用途filterを提供する。filterは再利用を禁止する境界ではない
- MediaAsset削除前に全consumerの参照を集計し、1件でも使用中なら拒否する。featureから外す操作はrelationだけを外し、asset bytesを削除しない
- Spot Field Definitionの標準semantic keyは`description/address/phone/website/hours/holiday`。表示名は変更できるがsemantic keyは不変。custom型は`single_line_text/multiline_text/number/url/boolean`だけ
- v1 CSV templateは現在有効なField Definitionsからstable keyで生成し、従来どおり全行を未配置・非公開Spotとして新規作成する。v2 Exportは1 Floorの全Spotを対象とし、`__csvVersion/__schemaVersion/__spotId/__rowVersion`を予約system列として付与する
- v2の`__spotId`は唯一の更新identityとし、空欄はCREATE、値ありはUPDATE。同名はwarningに留め、未知・重複・別Floor ID、構造/型/Category error、schema/row conflictが1件でもあれば全件0 writeとする。UPDATEはCSV編集可能項目だけを変更し、位置・公開・PIN・Media・Decoration等を保持する
- `__schemaVersion`はlabel/orderを除くField Definition identity/type/enabled/requiredとlocale構成、`__rowVersion`は有効な標準/Custom値、ja/en翻訳、Category集合をcanonical SHA-256 token化する。applyはfresh stateをserializable transaction内で再hashし、Spot/relations/liveVersion/auditをatomic更新する。現在の公開Snapshotはpublishまで不変とする
- Floor DecorationはMediaAssetを参照し、正規化IMAGE位置・相対幅・回転・layer順を保持する。base illustrationの上、すべてのSpot PINの下に非対話で描画する

### 4.10 管理feedbackと重複

- Spot名はidentityではなく、同一Map内の同名も合法。create/update前にFloor/Category/配置状態を含むwarningを出し、利用者が明示的に続行できる。別Mapと編集中record自身は対象外
- core save flowは共通`SaveFeedback`でsaving/success/errorを区別し、status/alert live semanticsを使う。送信中は該当submitを無効化する
- dirtyな管理formの内部遷移はapplication dialogでstay/discardを選ぶ。refresh/tab closeだけは`beforeunload`を使用できる

## 5. 画面一覧(参照)

`docs/wireframe-spec.md`(Ver.5)を正とする。実装順は`docs/tasks.md`を参照。

## 6. セキュリティ・認可

- 管理画面配下は全てNuxtのルートミドルウェア(`middleware/auth.ts`)でセッションチェックを通す
- 公開マップ画面・APIは認証不要だが、`Map.isPublished === true`のマップだけを返し、その中でも`Spot.isPublished === true`かつ`x`/`y`設定済みのスポットだけを返す
- Category CRUD、Spot relation更新・一括操作、Map branding更新はすべてセッションの`tenantId`とMap ownershipを検証する。Category relationはSpotと同じMapに属するものだけを許可する

## 7. ディレクトリ構造

```
.
├── app/
│   ├── assets/css/tailwind.css
│   ├── components/
│   │   ├── admin/                          … 管理フォーム・2点合わせ・公開共有UI
│   │   └── map/                            … MapViewer・詳細カード・絞り込み・フロアタブ
│   ├── composables/
│   │   ├── useMapViewer.ts
│   │   ├── useGeoReference.ts             … 2点合わせの状態管理
│   │   └── useAuth.ts
│   ├── layouts/admin.vue
│   ├── middleware/auth.ts
│   ├── pages/
│   │   ├── [mapSlug]/index.vue            … ①
│   │   └── admin/
│   │       ├── login.vue                  … ③
│   │       ├── dashboard/index.vue        … ④
│   │       └── maps/[mapId]/
│   │           ├── settings.vue           … ⑤
│   │           ├── floors.vue             … ⑤
│   │           ├── floors/[floorId]/georeference.vue … ⑤-2
│   │           ├── editor.vue             … ⑥
│   │           ├── spots/
│   │           │   ├── index.vue          … ⑦
│   │           │   ├── new.vue
│   │           │   └── [spotId].vue
│   │           └── publish.vue            … ⑧
│   ├── utils/marker-element.ts
│   └── app.vue
├── server/
│   ├── api/auth/                           … ログイン・ログアウト
│   ├── api/maps/                           … マップ・フロア・スポット管理API
│   ├── api/public/[mapSlug]/index.get.ts   … 公開マップAPI
│   ├── api/geocode/index.get.ts            … Nominatimラッパー
│   ├── api/uploads/image.post.ts           … 画像寸法を計測して保存
│   ├── middleware/00.auth-check.ts
│   ├── routes/uploads/[filename].get.ts
│   └── utils/                              … Prisma・認可・公開条件・アップロード等
├── shared/                                 … 共通schema・型・定数・utility
├── lib/geo.ts                              … 2点合わせ・fallback・現在地エリア判定
├── prisma/                                 … schema・migration・seed・seed-assets
├── tests/
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── AGENTS.md
├── docs/                                   … requirements・design・tasks・wireframe-spec
└── package.json
```
