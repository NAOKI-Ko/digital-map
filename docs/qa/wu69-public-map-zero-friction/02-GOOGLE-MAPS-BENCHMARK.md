# Google Maps benchmark

2026年10月3日。Digital MapのAS ISを記録した後、[Google Maps](https://www.google.com/maps)のChrome web版を390×844と1440×900で実操作した。viewport変更のみであり、モバイルアプリやmobile UAでの検証ではない。今回のweb版には「表示が制限されています」の通知がある。この制約を含めて観察結果と採用判断を分ける。

| 観点 | 実観察 | Digital Mapへの判断 |
| --- | --- | --- |
| First impression | 地図は画面全体に敷かれ、検索とCategoryが上に重なる。 | Mapを画面基盤にする原則を採用。検索UIは範囲外。 |
| Map viewport utilization | 初期は地図の大半が見える。390pxのCategory結果／Detailでは白いパネルがほぼ全面を占める。 | 全面パネルのコピーは不採用。Illustration Mapを探索の文脈として残す。 |
| Control discoverability | 検索文言、Category名、右下のZoomが明確。 | 頻用操作の意味をラベルで伝える。 |
| Category discovery | 名称付きchip、横方向の次ページ。Category選択は結果と明示的なCloseへつながる。 | 追加項目の手掛かり、解除の発見しやすさを採用。結果リスト機能は追加しない。 |
| PIN readability | 地図上にカテゴリ別記号と一部Spot名がある。 | 必要な名前を段階表示する原則を採用。常時全Spot名表示はcollisionを悪化させるため不採用。 |
| Progressive disclosure | Category→結果→Spot概要／詳細情報の階層。 | PIN→短いDetail→拡大Detailの階層を採用。クチコミ、予約、保存等は範囲外。 |
| Pan／Zoom feel | 1440pxでMapをドラッグでき、操作群は右下にまとまる。touch pinchは未検証。 | Mapの操作面とfloating UIを分け、cameraの入力を滑らかにする。 |
| Selection feedback | Spot選択で名称付きDetailが出る。 | selectedとfocusedを区別し、選択Spotの名称を明確にする。 |
| Detail transition | 写真、名称、概要、基本情報を順に表示。 | 名称と必要情報を優先。大量の操作ボタン列は不採用。 |
| Context preservation | Detail→戻るで同じCategory結果に戻る。CloseでCategoryを解除できる。cameraは選択時に変わるため完全復元の実例とは扱わない。 | 探索条件とカメラを保存し、戻る操作で迷わせない。WU-69のcontext契約を優先する。 |
| Recovery | 戻るとCloseが異なる役割で現れる。 | Detail CloseとOverviewの役割を明確に分ける。 |
| One hand | Zoomは下部。検索／Closeは上部。390px web版の全文Detailをそのまま片手向けと評価しない。 | OverviewとCategoryは下部へ。Closeにも片手で使える代替gestureを用意。 |
| Desktop responsiveness | 1440pxでは約400pxの左パネルと残りのMapが並ぶ。 | DesktopでMapとDetailを並置。小画面に同じ固定パネル幅を持ち込まない。 |
| Accessibility | AXに名称、役割がある。公式資料にはMapの矢印Panと+/−Zoom等のkeyboard操作が記載。 | keyboardでMap／PIN／Category／Detailを完遂できるようにする。独自の番号探索機能は今回追加しない。 |

Accessibilityの仕様参考は[Google Maps公式Help](https://support.google.com/maps/answer/6396990?co=GENIE.Platform%3DDesktop&hl=en)。これは資料確認であり、全keyboardフローの実測PASSではない。

証跡は `google-detail-390.jpg` と `google-map-1440.jpg`。UI、ブランド、配色、記号の形をコピーすることは採用判断に含めない。
