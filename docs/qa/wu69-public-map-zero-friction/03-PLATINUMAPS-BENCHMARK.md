# Platinumaps benchmark

2026年10月3日。公式サイトのiframeから取得した[公式Mapデモ](https://platinumaps.jp/maps/demo/?nogesturehint=1&fullscreen=2)を390×844と1440×900で操作。観光→グルメ→画像PIN→Detail→Close→密集数badge→Zoom→Panを実行。デモ内容は架空施設であり、全導入先のUIを代表するとは断定しない。

| 観点 | 実観察 | Digital Mapへの判断 |
| --- | --- | --- |
| First impression | Mapが全面にあり、下部にCategory dock。 | Mapが基盤で、探索UIを下部に置く原則を採用。dockのブランドと形はコピーしない。 |
| Viewport utilization | 初期Mapはほぼ全高。Category dockは下部約90px。 | 初期の大きな余白を減らす。Illustrationの縦横比を保ちつつ探索開始倍率を調整。 |
| Controls | 上部Menu／Search、下部現在地／全画面、Desktopで右下+/−。 | 操作群の役割をまとめる。Search、全画面、現在地の新規追加はしない。 |
| Category | グルメから子Categoryに入り、同じ下部位置に「戻る」がある。MapのPINが切り替わる。 | 文脈と解除／戻るを同じ場所で見つける原則を採用。新たな階層Category domainは作らない。 |
| PIN | 写真PINとSpot名、密集数badgeが混在。 | 密集数の小さな手掛かりを採用候補。写真PIN全面導入はIllustrationを隠すので不採用。 |
| Progressive disclosure | 全体で数badge、Zoomで個別PINと名前、選択でDetail。 | WU-68の段階的Zoomを保持し、反応の理由を見せる。 |
| Pan／Zoom | Map dragは反応。数3badgeを押すとZoomし個別PINが増える。touch pinchの実測なし。 | Map-only回復を維持。余計な別一覧への遷移は追加しない。 |
| Selection feedback | 選択PINのサイズとSpot名が強まり、同じMap上にDetailが出る。 | selectedを強調するが、normalとfeaturedを見づらくしない。 |
| Detail | 写真、名称、操作、説明がBottom Sheetで表示。Closeが写真右上にある。読み込み／遷移中にSheet位置が変わり、最初のClose clickでは閉じなかった。 | Sheetの位置とhit targetを安定させる。写真優先による名称の押し下げや動くCloseは不採用。 |
| Context preservation | CategoryはClose後も保持。選択によるカメラ移動はClose後も残った。 | Category保持は採用。camera非復元をWU-69の合格根拠にしない。 |
| Recovery | 子Categoryの「戻る」は明確。全画面記号はあるがIllustrationの全体回復の同等機能ではない。 | 「全体」を言葉で発見可能にし、Floorとfilterの状態は維持する。 |
| One hand | Category／現在地が下部に集まる。DetailのCloseは半高Sheet右上。 | 片手で頻用操作に届く配置を採用。低頻度Infoまで大きな常設chromeにしない。 |
| Desktop | 下部Categoryは横幅を広げ、+/−は右下。Mapを広く使う。 | MobileとDesktopで同じ探索原則を保つ。 |
| Accessibility | AXでは多くのPINが汎用「Map marker」、Categoryがcontainer。2回のTabでは明確なCategory focusを確認できない。全keyboardフローは未検証。 | 自製品ではSpot固有ラベル、pressed／checked状態、focus／Escape復帰を必須にする。汎用ラベルと非semantic controlsは不採用。 |

公式サイトが説明する画像PINと表示レベル調整は[Platinumaps公式](https://platinumaps.jp/)でも確認できる。上表の動作は実画面の観察に基づく。詳細画像の追加、混雑表示、Ranking、Routing、音声機能は今回の採用範囲外。

証跡は `platinum-category-390.jpg`、`platinum-detail-390.jpg`、`platinum-map-1440.jpg`。
