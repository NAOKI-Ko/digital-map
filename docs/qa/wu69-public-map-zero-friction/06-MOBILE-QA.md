# Mobile candidate QA

2026-10-03。390×844 Primary、追加390×400。Chrome web viewportに対して実際のclick/drag/Tab/Enter/Escapeを使用。CUAのread-only DOMは寸法・camera・focus・motionの裏付けのみ。公開fixtureは実rendererを通るが、Windowsデプロイ済みReleaseを装った検証ではない。

| Scenario | Candidate result | Evidence |
| --- | --- | --- |
| S1 Map/Floor理解 | PASS | 名称・Floor常時表示。2-floor fixtureでも読み取れる。initial bearing0/pitch20。 |
| S2 PIN→Detail | PASS | 寺社→有松天満社、近接/同一点のspiderfy→Spot02をclick/Enterで選択。 |
| S3 Close→context | PASS | camera JSON一致。Detail中の意図的Map drag後はそのcameraを維持。 |
| S4 Category | PASS | 寺社+グルメ7件、横送り後も2カテゴリと解除が可視。一操作clear。 |
| S5 Pan/Zoom | PARTIAL | mouse drag、double-click有効、canvas矢印と+は実操作。物理touch pinch/2fingerは未検証。 |
| S6 mixed dense | PASS | featured/normal混在36Spot。priorityロジック維持、名称は必要時だけ。 |
| S7 staged zoom | PASS | 15.7300018801→16.7300018801、Map上で1段回復、一覧/dialogを追加しない。 |
| S8 maxZoom/spiderfy | PASS | near fixtureはmaxZoom20.6097で3本にspread。coincident3本から個別Spotを選択。 |
| S9 Overview | PASS | 「全体」、bearing0/pitch0、Category保持、再探索可能。 |
| S10 Floor | PASS | Shop選択→Recovery2F、Category保持3Spot、旧Detail閉じ、0/20初期cameraへ。 |

Sheet反復: 長文は通常464px→expanded776px→header down115pxで464px/open維持→通常down101pxでclose。短文は内容高さ307pxで不必要なexpandなし。390×400は既存short-height policyでexpandedへ入り307px、Close/高さbutton各44pxが画面内。住所末尾もスクロールできる。

選択PINが上端にあるケースを追加修正し、name top130.6px、PIN top160.6pxを確認。Closeはcamera完全復元。通常Map/Category/controlsを覆う透明panelを作らない。

画像はfixture参照先のlocal uploadsがないためerror fallbackを確認。Windowsにある実画像の成功表示と読み込み速度のcandidate実測は未了。

`after-initial-390.png` / `after-detail-390.png` / `after-floor-390.jpg` / `after-dense-390.png` / `after-short-390x400.png` / `after-short-detail-390x400.png`。

実機の片手5分、屋外光、iOS/Android browser chrome実変化、実safe-area inset、physical pinchをPASSと扱わない。
