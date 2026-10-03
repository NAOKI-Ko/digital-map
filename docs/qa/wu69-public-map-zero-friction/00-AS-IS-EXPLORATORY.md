# Public Map AS IS exploratory QA

2026年10月3日 JST。WU-69親本文と69-01〜69-08を要求仕様として取得した後、製品コード、内部仕様、操作手順、Benchmarkを読む前に実施。対象は既存の非Production Public Map `https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon`。Chromeのviewportを390×844に設定。実機の片手タッチやpinchを再現した検証ではなく、マウス操作と画面観察である。実行SHAはまだ未特定。

初見でMapの操作は完遂できるものの、初期Mapが小さく、密集PINの反応と戻った後のカメラ位置に摩擦がある。回避できることは合格理由にしない。

## 実施した操作と観察

| シナリオ | 実操作と結果 |
| --- | --- |
| S1 | reloadで初期表示。Map名、Floor名は通常画面に見当たらず、情報ボタンを開いてMap名を確認。地図画像は約340×256pxで、上下に大きな空白。 |
| S2 | 初期のカフェPINを3回順に選択。最初の2回はカメラが拡大し、3回目でDetailが開いた。PINの外観に密集数や追加操作の目印は見当たらない。 |
| S3 | Detailの閉じるボタンを押す。Spotの画面位置は開く前の約y447から閉じた後の約y260へ変化し、元のカメラに戻らない。 |
| S4 | 次カテゴリ→寺社→次カテゴリ→グルメ。寺社とグルメが同時選択され、表示件数5→7に反応。寺社の選択状態と「すべて」は横送りで画面外になる。解除には前のカテゴリを2回押して「すべて」を押した。 |
| S5 | MapをPanすると地図が左上に寄り、画面の多くが空白。ダブルクリックはこの試行では明確なZoomを確認できず。Zoomボタンを連続5回押した時は押下回数に対応したZoom量を判断しづらい。一段ずつの操作はZoomする。 |
| S6 | normal／大きな四角PIN混在のMapを探索。大きなPINが非常に強く、同じ「観」のPIN同士はSpot名を開くまで区別できない。 |
| S7 | PINのクリックで段階的Zoomし、隠れていたPINが増えた。Map上だけで回復できる。複数クリックが必要な理由の見た目の説明はない。 |
| S8 | maxZoomで分離不能な専用groupは現行URLで未確認。spiderfy PASSとは記録しない。 |
| S9 | 「地図全体を表示」をAXラベルから見つけて実行。画面上は小さい四角の記号のみ。Categoryの選択は保持される。Infoのopen／closeで裏のMapが再び約340px幅に縮んだ。 |
| S10 | 既存multi-floor UATタブをreloadするとDNS_PROBE_FINISHED_NXDOMAIN。現行multi-floor URLが必要。未検証。 |

## Detailをさらに触った結果

カフェDetailの写真領域は最初の表示で灰色の大きな空白になった。再度開いた時には写真が表示された。読み込み中であることは画面から明確に分からなかった。

Detail拡大では約92%の高さを取り、内容末尾から画面下まで約230pxの空白が残る。拡大表示のハンドルを約y111からy390へドラッグすると、一段縮小を期待したが全体が閉じた。上部のCloseは片手で下部に置いた親指から遠い。

通常画面のInfo、Zoom、Overview、既存現在地は44×44px。Categoryも44px高。初期PINのクリック領域は60×60px。見た目の小ささと実際のhit areaは分けて評価する。Detail拡大ボタンの領域は別途測定が必要。

## 証跡と検証限界

- `as-is-initial-390.jpg` は初期表示。
- `as-is-detail-drag.jpg` は拡大Detailの下ドラッグ後。
- 正本の取得内容は `ASANA-AUTHORITY.json`。
- 初期カメラのbearing／pitch、collision priorityの実装、実行SHA、LIVE Preview parityは内部をまだ読んでおらず未確認。
- 実際の屋外光、手持ち操作、touch pinch、Windowsは未検証。


## 後続確認（初見観察とは分離）

Windows SSHの読み取りで、稼働SHAは `ad4f4bde269b16c5575b836add444b5e6fa88399` と確認した。古いWU-68 QA文書にある別SHAを実行SHAとは扱わない。F09はOverviewのanimation完了前にInfoを開いた観察であり、settled cameraを比較するとInfo open/closeで変更なし。F09を再現なしとして除外し、不要な修正はしない。

初回のAS IS画像2枚はOSのdataless状態で再読出しできないため、PRには空の画像を入れない。初見のテキスト記録はそのまま保持。未変更のWindows baselineを390×844で再撮影した `windows-baseline-recapture-390.png` は比較用の後続証跡であり、初回撮影の代替日時とは扱わない。
