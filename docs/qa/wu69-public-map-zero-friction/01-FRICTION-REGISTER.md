# Public Map friction register

AS IS実操作から得たFinding。コードを読む前の観察を固定し、原因の推定と実装後の検証を混ぜない。初回はすべてOPEN。以下の原観察に、後続の実装・検証結果を追記する。P3も合理的に改善可能なら回収する。

| ID | Severity | 再現操作 | ユーザーのストレス | 合格条件 |
| --- | --- | --- | --- | --- |
| F01 | P2 | 390×844でreload | 地図画像が約340×256pxで上下が空白。Mapを小さく感じ、すぐ探索するにはZoomが必要。 | 0°／20°初期姿勢を保持し、390pxで読みやすい開始倍率とMap利用面積にする。全体回復は0°／0°を保持。 |
| F02 | P2 | 初期画面を見る | 現在のMap名／Floorが通常画面から読み取れない。 | 邪魔にならない常時文脈表示でS1を説明なしに完遂。 |
| F03 | P2 | 初期カフェPINを順に押す | Detailを期待するPINがZoomだけを行う。追加操作の理由と隠れたSpotの存在が外観から分からない。 | Map-only staged Zoomを維持し、密集状態と押下後の反応を自然に伝える。 |
| F04 | P2 | PIN→Detail→Close | カメラがDetail表示のため移動し、Close後も元の位置に戻らない。 | Detail前のMap contextを保つ。Detail中の意図的Panは奪わない。 |
| F05 | P2 | 寺社選択→Categoryを右へ送る | 選択済みCategoryが見えなくなり、絞り込み状態の全容が分からない。 | 横送りしても選択状態を理解できる。 |
| F06 | P2 | 寺社＋グルメ→解除 | 「すべて」へ戻るため横送りを2回戻す必要がある。 | 解除を常に一操作で発見・実行できる。 |
| F07 | P3 | Categoryを右へ送る | 末尾項目が途中で切れ、矢印が上に重なる。選択範囲の確認に余分な操作がいる。 | 追加項目の存在と末尾が明確で、操作領域が重ならない。 |
| F08 | P2 | MapのOverviewを探す | 四角の記号から「地図全体」が分からず、他の操作と見分けにくい。 | 一般ユーザーが説明なしに全体回復を発見できる。 |
| F09 | P2 | Overview→Info open→Info close | Infoを触っただけで裏の地図が再度縮み、見ていた倍率が変わる。 | 非探索パネルのopen／closeでcameraを変えない。 |
| F10 | P3 | 片手でZoom／Overview／Infoを探す | 操作群が右上に固まり、親指から遠く、Mapに縦長のchromeが重なる。 | 必要性を実画面で判断し、頻用操作を片手で届く位置に置く。 |
| F11 | P3 | 多数の「観」PINを探索 | 名前を開くまで同カテゴリのSpotを識別しにくい。大きな四角PINの優先度が強い。 | normal／featured／selected／focusedを節度ある階層にし、必要時に識別情報を段階表示する。 |
| F12 | P3 | 初めてカフェDetailを開く | 写真の読み込みで約210pxの灰色領域が残り、処理中か欠損か分からない。 | loading／errorの状態を明確にし、情報確認を不必要に遅らせない。 |
| F13 | P3 | 少量のDetailを拡大 | 末尾に大きな空白があり、Mapがほぼ消える。Closeが画面上方へ遠ざかる。 | 内容量と利用目的に合う高さで、Map復帰を片手で行える。 |
| F14 | P2 | 拡大Sheetのハンドルを下へドラッグ | 一段縮小を期待する動作で全Closeになる。 | 下ドラッグの段階と距離が予測可能。縮小／Closeを容易に使い分けられる。 |
| F15 | P3 | Zoomを短時間に連続押下 | 押した回数と拡大量の関係が見えにくい。 | 連続入力で反応が安定し、過剰animationや入力欠落を感じない。実装原因は未調査。 |
| F16 | P3 | 既存現在地／attributionを支援技術で読む | Find my location／Toggle attributionなど一部操作だけ英語。 | 使用言語に合う操作ラベルをそろえる。現在地機能の新規追加はしない。 |

F15の定量再現、S8、S10、実touch pinchは追加検証が必要。未検証項目を完了扱いにしない。

## 後続Findingと再評価

| ID | Severity | 再現・ユーザーへの影響 | UX Contract / 回収結果 |
| --- | --- | --- | --- |
| F17 | P3 | 短いDetailで拡大を押しても意味のある情報増加がない。F13の追加ケース。 | 内容が通常高さに収まると拡大を出さない。307pxの短いSheetで確認。 |
| F18 | P1 | coincident/maxZoomのspiderfyから個別PINを押してもDetailが開かない。 | 省略されたoptional ghost/dimmedがDOMのtoggleで付与されていた。Booleanへ正規化。3本のspread、Spot02 click/Enter→Detailを実操作。Map-onlyアルゴリズムは維持。 |
| F19 | P3 | CategoryからTabでMapへ入る際、操作できない外側regionとcanvasに2回停止する。 | visitorのみ外側regionをTab順から除き、canvasへ1回で移動。日本語でkeyboardの役割を説明。hidden PINからEscape時もcanvasへ復帰。 |
| F20 | P2 | 上端付近のPINを選択するとselected名とPIN上部がviewport外に切れる。 | visible chrome＋PIN/name分の上端余白だけ最小Pan。PIN top160.6、name top130.6の可視性とClose後camera完全一致を確認。 |
| F21 | P3（技術QA） | CategoryのresizeでResizeObserver loop警告が出る。一般ユーザーに持続的な障害は未確認だがlayout再計測の不安定要因。 | observer内のDOM反映をRAFへ分離。Category選択/送り/解除、390→768→390で再発なし。警告を単に抑制していない。 |

| ID | Candidate status | 検証・結果 |
| --- | --- | --- |
| F01 | FIXED | 初期0/20。画像の垂直範囲約123〜587px、開始zoom15.6097。従来約256pxから探索面積を増やす。 |
| F02 | FIXED | Map名とFloorを小さく常時表示。2-floorでFloor buttonとの重なりなし。 |
| F03 | FIXED | group数badge、周辺PINを表示という固有ラベル。denseで1段Zoomし一覧/dialogなし。 |
| F04 | FIXED | 全5幅でDetail close前後camera JSON一致。Detail中にuser Panした場合はPan後cameraを保持。 |
| F05 | FIXED | 選択名と固定のカテゴリ数/結果件数を表示。寺社・グルメ2カテゴリ7件。 |
| F06 | FIXED | 固定解除から1操作で全Categoryへ。横送りの位置に依存しない。 |
| F07 | FIXED | 44pxの独立送りbutton、fadeはpointerを奪わない。focus時にchipを可視範囲へ。 |
| F08 | FIXED | 「全体」と日本語ARIA名。overview0/0、Category保持。 |
| F09 | NOT REPRODUCIBLE | settled cameraではInfo open/close変更なし。観察訂正を残す。 |
| F10 | FIXED | visitor頻用controlsを下部、mobile +/-非表示。Infoは小さい44pxで上部。 |
| F11 | FIXED | 既存PIN階層を維持し、selected/focused時にだけ名前を表示。 |
| F12 | FIXED | loading/error表示、名称とCloseを先に表示。local fixture写真はmissing assetとしてerror表示を確認。実画像成功経路の最終Windows検証は未了。 |
| F13 | FIXED | 内容高さで307pxまで短縮。長文は通常464px→拡大776px。 |
| F14 | FIXED | 拡大から115px下dragで464pxへ縮小しopen維持、通常から101px下dragでclose。 |
| F15 | FIXED | Desktopで3回連続+、settled zoom差が正確に3。 |
| F16 | FIXED | visitorの既存現在地/attribution名を日本語へ。新規機能なし。 |
| F17〜F21 | FIXED | 上記個別証跡とregression tests。 |

候補では21件のconfirmed Findingを回収し、F09を除外した。これはWindowsへの反映完了を意味しない。未変更baselineには初見で記録した摩擦が残る。実機touch pinch、safe area実値、片手5分、Authenticated LIVEの実ブラウザー比較は未検証として残す。

## F22 — Floor切替後のcanvas読み上げ名

P2。keyboardでRecovery2Fへ切替後、外側regionとFloor buttonは2Fだが、Map canvas名は有松・桶狭間のまま。画面は正しいのに支援技術へ旧Floorを伝える。visitor canvas labelをprops.label変更へ追従させた。1F→2FをTab/Enterで実操作し、canvas名がRecovery2Fへ更新、Category保持、Floor focus復帰を確認。FIXED in candidate。

## 追加要求の反復QA（2026-10-03）

| ID | Severity | Finding | Candidate disposition |
| --- | --- | --- | --- |
| F23 | P2 | 全6カテゴリ選択名を省略せず表示した初版でMap controlsがchip列に重なった。 | FIXED。dock実測104pxに追従しcontrols下端684／dock上端708、24px間隔。390x400もcontrols下端240／dock上端264。camera維持。 |
| F24 | P2 | 768px stageの内枠canvas766pxをMobileと誤認し、Desktopより深い初期zoomを適用。 | FIXED。stage幅でbreakpoint判定。768px初期zoom15.879695、whole-floor fit比+0.2、Desktop上限+0.65以内。border境界回帰テストPASS。 |

追加後のFinding IDは24件、F09はNOT REPRODUCIBLE、confirmed23件はcandidateでFIXED。既存F07の送り矢印は追加ユーザー要求により廃止、native横スクロールへ更新。

## 69-09 iteration F25

F25 P3: 初期pitch25°なのに「向きを戻す」が表示され、向きが異常なのか迷う。homePitchを初期jumpTo前に設定し、pitch event時点から初期姿勢を基準にする。390px reloadで不要なNが消えたことを確認。全jump時点のbaseline回帰テストPASS。Finding ID25件、F09はNOT REPRODUCIBLE、confirmed24件はcandidateでFIXED。

## Codex review Findings F26–F31

F26 P2 Preview multi-floor banner overlap;F27 P2 retained-photo loading overlay;F28 P1 mobile zoom safety cap regression;F29 P2 repeated count badges on connected-chain visible winners;F30 P3 zero-category stale dock height;F31 P2 English MapLibre labels. All corrected and verified in11-69-09-VERIFICATION.md. Finding IDs31, F09 NOT REPRODUCIBLE, confirmed30 FIXED in candidate.

F32 P2: 言語変更前にZoomするとMapが初期cameraへ戻る。pending locale取得中は直前の有効responseとMapを保持し、Zoom後のJA→ENでcamera JSON一致を実測。Finding IDs32、F09 NOT REPRODUCIBLE、confirmed31 FIXED in candidate。

F33 P2: locale refresh後、同IDフロアの新画像／georeferenceがrendererへ同期されない。描画用fieldだけを監視し、画像のみの変更ではcamera維持、座標変更ではPIN／現在地controlも再同期。実390と7回帰tests PASS。

F34 P2: ENのOverviewが全体／日本語aria名のまま。All／Show whole mapに変更しruntime言語追従、camera維持を実390で確認。non-visitor表示は維持。Finding IDs34、F09 NOT REPRODUCIBLE、confirmed33 FIXED in candidate。
