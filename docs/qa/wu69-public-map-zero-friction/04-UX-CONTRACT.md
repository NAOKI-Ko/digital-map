# Public Map UX Contract

WU-69親Acceptance Criteriaと69-01〜69-08を正本とし、AS ISのF01〜F16およびBenchmarkから改善の判定条件を定める。未検証をPASSにしない。実装で新たなFindingが生じた場合も回収する。

## Mapと探索文脈

- 390×844でMapを基盤として見せる。初期の巨大な上下余白を減らし、最初からSpotを探索できる倍率にする。全画像を完全に収めることだけを初期cameraの目的にしない。
- 初期cameraはbearing0°／pitch20°、Overviewは0°／0°を維持する。
- Map名と現在Floorを小さく、読める文脈表示にする。Floorを切り替えると古いDetailを閉じ、選んだFloorへ予測可能に移る。Categoryの条件は保持し、結果なしは分かるようにする。
- 非探索のInfo open／closeでcameraを変えない。Detail前のcameraを保存し、Closeで復元する。ただしDetail中にuserが明示的にPan／Zoomしたときはその意図を優先する。

## Categoryと操作群

- Categoryは名称付き44px以上の操作領域。選択、複数選択、横方向の追加項目が分かる。
- 横送りしてもfilter中であることと解除方法を見失わない。解除は常時見つかる一操作。選択件数だけでなく、必要な選択文脈を伝える。
- 390pxの頻用Overviewは下部の親指の届く場所へ置き、「全体」のラベルで意味を伝える。Mobileの+/−は実touch gestureとkeyboard経路を確認して必要性を判断。隠す場合もkeyboardでZoomできる経路を残す。
- 同じ種類のcontrolはサイズ、形、spacing、focusをそろえる。safe area、short viewportを考慮し、地図へのpointer入力を大きな透明overlayで奪わない。

## PINと密集回復

- selected > active Category > featured > normal > viewport-center > stable ID のpriorityを保持。
- collision回復はMap-only。段階的Zoom／maxZoom spiderfyを維持。
- 密集していることが小さなbadge等から分かる。個別PINを期待して押したuserが「何が起きたか」を理解できる。
- normal／featured／selected／focusedを節度あるサイズ、outline、focus-ringで区別。Spot名は選択／focus等の必要時に段階表示し、常時表示でIllustrationやcollisionを悪化させない。
- PINのhit targetは原則44px以上。見た目の小ささとクリック領域を分けて検証する。

## Detailと動き

- 名称、Category、Closeを即座に読める。画像loading／error時も必要情報を確認できる。
- MobileはMapを残す短いSheetから必要時に拡大。内容が少ない場合に不要な空白を大きく作らない。
- 拡大から下ドラッグは一段縮小、通常から十分な下ドラッグでCloseなど、段階を予測可能にする。gestureを使わないkeyboard／button経路も維持。
- Closeとcameraの位置は読み込みやanimationで不自然に移動しない。連続Zoom入力は欠落感なく反応する。
- reduced motionではcamera／Sheet／Categoryの動きを抑え、操作結果は同じにする。

## 検証と範囲

PublicとAuthenticated LIVE Previewは共通rendererを使う。390／768／1024／1440／1440×700で主要操作を確認する。Tab、Enter／Space、Map矢印Pan、Zoom、Floor、Category、PIN、Detail、Escapeとfocus復帰を実操作する。

Search、Routing、Current-location新規機能、Admin、Paper、domain、schema、Base Map、Productionは変更しない。Google Mapsの全文パネルやPlatinumapsの画像PIN全面導入はコピーしない。tests、typecheck、build、Prisma validate、Verifyを通し、PR→Verify→merge→post-merge Verify→Windows exact SHA→Windows black-box acceptanceまで完了を判定しない。

## 反復QAからの追加契約

optional PIN flagsが省略されたときはfalseとし、spiderfyの個別PINを必ずpointer/keyboardで選択可能にする。MapへのTab入口は1つとし、hidden PINからClose/Escapeで戻す先も操作可能なcanvasにする。selected PINと名前は表示中chromeより下に保ち、必要最小のPanのみ行う。resize observerの再計測を同一frame内でlayout更新のloopにしない。
