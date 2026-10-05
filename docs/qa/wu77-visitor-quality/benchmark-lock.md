# WU-77 Benchmark Lock v1.0

固定日時: 2026-10-05 11:42 UTC。実装前に固定。変更は比較をやり直すProduct Decisionとして扱い、失敗した項目を後から対象外にしない。

## 参照対象

| ID | 正確な対象 | 用途 |
| --- | --- | --- |
| B1 | https://nagoyaaqua.smartmap-pro.com/maps/574bp3oN/parcels/1/ja | 責任者指定JERA系・名古屋港水族館公式。同じ製品を二重採点しない。館内マップ2Fを開始状態にする。 |
| B2 | https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon | 現行Digital Map Public。有松の実データを維持する。 |
| B3 | Digital Mapの同一公開snapshotを使用するAuthenticated LIVE Preview | Public/LIVE parity。認証方法は既存Windows devの通常認証、秘密情報は証拠に含めない。 |
| F1 | dev限定 `__qa_wu77_visitor` / baselineモード | 同じ自作館内図・2フロア・36配置の比較。実在の施設データではない。後述の固定データを使用する。 |

B1の同定根拠: 名古屋港水族館公式 https://nagoyaaqua.jp/news/news/29647/ の公式マップリンクは同じmap ID/parcel/langへ到達する。 https://nagoyaaqua.jp/news/event/31234/ と https://www.jera.co.jp/news/notice/20260918_2513 はJERA協力・MapPenguinを記載。実画面の「名古屋港水族館 × JERA」ロゴと協力説明も確認済み。別のJERA製品を推測で追加しない。

B2/B3 baseline source/dev/Windows deployed SHA: `9403d32fff4f5d0a84f3ba2c1212391ddf6c1f9d`。Windows観測2026-10-05T11:21:20Z、3011の既存サービス/API ready確認。ドメイン変更時は同じsnapshot・source SHAを照合してアクセス先だけ記録する。

## 固定条件

Chrome同版・同PC・日本語・通常motion。viewport CSS pxは390×844、430×932、768×1024、1024×768、1440×900。スクリーンショット毎にDOM clientWidth/clientHeightを照合。Overview初回5秒を観察し、導入画面がある場合は導入と「マップを見る」後を別記録する。viewportは390から順に同一map cameraを保持して変更し、candidateでも同じ順序を使う。taskごとは全体/開始フロア/フィルター解除/Detail閉へ戻す。新規選択の前後camera、count、focusを記録する。

実データの数・位置・背景画像は製品間で違う。B1とB2のtask intentとviewportを揃え、数量差を明記する。F1のbaseline/candidateは背景・配置数・座標・名称・カテゴリ・重要度・サイズ・内容・cameraを完全に揃え、施設用に明示設定したpreset IDの表示文法だけを比較する。B1のasset・文章・コードを複製しない。

## 固定task

| Task | 共通の意図 / 実行 |
| --- | --- |
| T1 | 初見5秒で地図・フロア・目的地・設備・地図操作を区別する。何が分からないかも記録。 |
| T2 | 現在フロアのトイレと多目的トイレを探す。B1は2F、F1は北側トイレ/多目的トイレ。B2に対象が無い場合はNAと明記し、成功にしない。 |
| T3 | 飲食カテゴリを選び、対象を探し、他カテゴリも選択して解除する。B1はショップ・レストラン、B2はグルメ、F1は飲食。外部OR挙動は未確認ならunknown。 |
| T4 | 目的地を選択→Detail→戻る。B1はフードテラス・トータス、B2はカフェ庄九郎、F1は海の展示A。selectionと位置の連続性を観察。 |
| T5 | 2F→3F→2Fで設備/目的地/カテゴリ状態を理解する。B2は1フロアのためNA、F1/B3で回帰確認。 |
| T6 | 密集代表count→段階zoom→最大zoomの展開→任意メンバー選択→戻る。外部に同じ機構が無い場合は同意図の密集探索を観察。F1と既存WU68/70 fixtureでoffscreen/protected/member reachabilityを確認。 |
| T7 | 片手想定でカテゴリ→Detail→閉→フロア→全体を操作。実機評価とviewport模擬を区別する。デスクトップは地図の可視面積とcontrols/Detailの重なりを確認。 |
| T8 | Tab/Enter/Escapeの一巡、focus復帰、200%文字/zoom、reduced motion。スクリーンリーダー実機結果とDOM/axe結果を混同しない。 |
| T9 | 同一fixtureのpan/zoom/selection/floor切替を連続実施。cold/warm、操作時間・画面安定性を分けて記録。性能計測は他taskの重処理停止を確認した枠だけ。 |

F1固定構成: 自作1200×800の館内図、2F24配置（12目的地+12設備）、3F12配置（6+6）。施設はwc/accessible-wc/elevator/stairs/escalator/nursing/aed/informationを含む。4カテゴリ（展示/飲食/ショップ/設備）、選択は複数OR。2組の3配置重なりを含む。重要度・サイズはbaseline/candidateで同一。旧material/kanji/custom/illustrationも混在させ、旧データの自動再分類が無いことを検証。fixtureの位置/名称の正本は追加するfixture JSON、実装開始後は比較対象として改変しない。

## 14評価軸と採点

1. first-glance clarity（T1）
2. destination / facility distinction（T1,T2）
3. facility findability（T2）
4. category understanding（T3）
5. selected state clarity（T4）
6. dense marker readability（T6）
7. collision recovery（T6）
8. background / marker hierarchy（T1,T2,T6）
9. Detail / Map continuity（T4）
10. one-hand mobile usability（T7）
11. Desktop Map-first balance（T7）
12. visual coherence / polish（T1,T4,T5）
13. accessibility（T8）
14. performance / motion stability（T9）

各軸・各viewportを1〜5点: 1=task不成立、2=説明が必要、3=自力で完了するが迷いが残る、4=安定して完了し小さな摩擦のみ、5=速く一貫して完了。得点と根拠の画面/操作/所要時間を対にする。unknown/NAは未評価でありPASSや満点にしない。平均点で低い軸を隠さない。

Acceptance: 評価可能な共通taskでB1以上の軸別品質、全14軸の自己品質4以上、既存契約全PASS、独立black-box QAのP0/P1/P2未解消0。非対応の外部大型機能（Search/Routing/positioning等）の有無は追加機能要求に変換しない。B1にしかないtaskは原則/principleとF1の意図で評価し、同一実データとは主張しない。明確な見劣りまたは未評価の必須項目があればWU-77はComplete不可。

## 現在のbaseline観察

- B1: 写真入り目的地PINと青い小型設備ピクトグラムを分離。フロア選択と一覧のフロア行にも設備記号がまとまる。Search/Route等のナビは参考観察のみ。匿名リンク/画像alt無しをDOMで観測したが、ATの実動作は未評価。
- B2: 地図/Category/controlsは既存契約を満たす構造。設備専用文法が無く、選択前の名称は隠れる。実マップは20spot・1フロアで施設探索を比較できない。広い余白、密集代表count19を初期cameraで観測。
- overview実画像5サイズ×2製品、公式facility/category/floorの実画像を保存。公式T4は一覧選択から3F mapへの移動を観測した段階でDetail sheetは未確認。`official-390x844-detail.jpg` は選択先mapの証拠でありDetail完了証拠として使わない。
- B3/F1のbaseline、14軸の数値採点、実機片手/AT、性能比較はまだ未実施。提案や実装報告を独立QAのPASSに代用しない。
