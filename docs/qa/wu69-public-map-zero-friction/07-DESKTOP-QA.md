# Responsive / desktop candidate QA

| Viewport | Actual flow | Result |
| --- | --- | --- |
| 390×844 | Category→PIN→Detail→Escape、Floor、recovery | PASS（touch固有検証を除く） |
| 768×1024 | 寺社→有松天満社→Detail→Escape | PASS、camera完全復元 |
| 1024×768 | 同じ探索→Detail→Escape | PASS、camera完全復元 |
| 1440×900 | 同じ探索→Detail→Escape | PASS、camera完全復元 |
| 1440×700 | 同じ探索→Detail→Escape | PASS、panel画面内・camera完全復元 |
| 390×400 | Category→Detail→Escape | PASS、Closeを欠かさず住所まで確認 |

768px panelはwidth512、画面内でMapと並置。1440×700はpanel top188/height322、上下切れなし。Desktop controlsがpanelに隠れないよう位置を変える。

Desktop rapid +3はzoom15.4211191416→18.4211191416、差3を観測。390→768→390のresizeは再fitでcameraを奪わずCategoryが再表示される。最後のCategory observer修正後、同じresize/選択/送り/解除でResizeObserver警告再発なし。

証跡 `after-detail-768.jpg`（写真ロード状態を含む）/ `after-detail-1024.jpg` / `after-detail-1440.jpg` / `after-detail-1440x700.jpg`、定量値は `interaction-results.json`。画像はfullPage captureでviewport寸法をDOMで確認。

Public/Previewは同じcomponent/render pathに変更を適用。Authenticated LIVEの実ブラウザーと公開Releaseの並行比較は未了であり、構造確認のみで実操作parity PASSとはしない。
