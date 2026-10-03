# Final benchmark recheck

先にDigital Map AS ISを探索してFindingを固定し、その後Google Maps/Platinumapsを実操作した。両者ともChrome web版390×844/1440×900。mobile app/physical pinchを検証した比較ではない。Googleは表示制限通知、Platinumapsは公式デモという制約。

| Axis | Google Maps observed | Platinumaps observed | Digital Map candidate / 採用・不採用理由 |
| --- | --- | --- | --- |
| First impression | 全面Map＋上部探索 | 全面Map＋下部dock | Map-first採用、Map名/Floorは小さいchip。ブランドUIはコピーしない。 |
| Map viewport utilization | 390の結果/Detailはほぼ全面 | dock約90px、Detail半高 | 初期探索倍率を改善、短文は307px Sheet。Illustrationを残すため全文panel不採用。 |
| Control discoverability | 文言/下部Zoom明確 | Menu/下部controls | 「全体」を明記、頻用controls下部。Search/Fullscreen等は新設しない。 |
| Category discovery | chip/次ページ/Close | 子Categoryに戻る | 固定解除、選択名・数、独立44px送りを採用。階層domain/結果一覧は不採用。 |
| PIN readability | 記号と一部名前 | 写真PIN/名前/数badge | 数badge、selected/focus時の名前。写真PIN全面化はIllustrationを隠すため不採用。 |
| Progressive disclosure | 結果→概要→Detail | 数→個別PIN→Detail | WU68段階Zoom/spiderfy→短Sheet→必要時expand。レビュー/予約/ランキング追加なし。 |
| Pan/zoom feel | Desktop drag/下部Zoom | drag/数badge Zoom | native gestures、連続+入力差3、Map-only+1回復。physical pinchは比較とも未検証。 |
| Selection feedback | Spot名称とDetail | 選択サイズ/名称強調 | 既存selected/focused階層＋必要時名称。priorityは維持。 |
| Detail transition | 写真/名称/概要 | 写真先頭、遷移中Close移動 | 名称/Close先頭、load/error、content height。動くClose/写真による名称押し下げ不採用。 |
| Context preservation | 戻るでCategory結果 | Category保持、cameraは残る | Detail前camera復帰を優先、user Panは維持。benchmarkの非復元を合格理由にしない。 |
| Recovery | BackとCloseの役割 | 子Category戻る | Detail close / 全体 / Floor / clearの役割分離。overview0/0。 |
| One-hand mobile | Zoom下、Close上 | Category下、半高Close | Category/Overview下、expanded down→collapse、短Sheet。実機5分は未検証。 |
| Desktop responsiveness | 約400px側面panel | 横長bottomdock、右下Zoom | 5幅でMap＋Detail、短高1440×700も欠けない。小画面へ固定widthを持ち込まない。 |
| Accessibility | 名前/roles、公式keyboard案内 | 汎用marker/container多い | 固有PIN名、pressed、Tab1入口、Enter/Escape、reduced motion。汎用ARIAコピー不採用。 |

採用は操作原則と情報階層。Illustrationを地図基盤として維持し、normal/featured図柄を置換せず、Base Map/配置/domain変更なし。静的な巨大panelで説明を押しつけない。Benchmarkより弱いcamera復帰は明示契約で改善した。実機・公開/LIVE実測不足は理由なくPASSにしない。

出典と個別観察は02/03。Google公式keyboard参考: https://support.google.com/maps/answer/6396990?co=GENIE.Platform%3DDesktop&hl=en 。Platinumaps公式: https://platinumaps.jp/ 。
