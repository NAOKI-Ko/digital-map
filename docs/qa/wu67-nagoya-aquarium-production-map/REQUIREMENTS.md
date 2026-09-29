# WU-67｜Nagoya Aquarium Visitor Map Art Direction & Production

Source: https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1218968565641552
Retrieved: 2026-09-29
Completed: false

WU-67 — Nagoya Aquarium Visitor Map Art Direction & Production

目的
既存の「【非公式UAT】名古屋港水族館 館内マップ」をQA fixtureから、エンドユーザーへ提示できる完成品へ引き上げる。
最低品質基準は、名古屋港水族館の現行公式パンフレット／公式館内案内。単に「綺麗」「動く」「以前より良い」では不合格。

最終ゴール
名古屋港水族館の公式パンフレットとDigital Map版を横に並べたとき、施設担当者がDigital Map版を劣化版だと感じないこと。
特にスマートフォン上では、Digital Mapのインタラクティブ性により紙より使いやすい状態を狙う。

制作物
- 北館2F
- 北館3F
- 南館1F
- 南館2F
- 南館3F
の5 Floorについて、Production-qualityのオリジナルVisitor Mapを制作し、既存Aquarium UAT Mapへ投入する。
現在の4区画／十字通路型の模式図はQA fixtureとしてのみ保持し、本制作のベースデザインとして使用しない。

重要原則
1. 公式資料を徹底的にReferenceとして利用してよい。
2. 公式パンフレット、公式Web館内案内、現行公式デジタルマップから、実際の空間トポロジー、展示ゾーン、通路、上下階接続、館間接続、入口、設備等を読み取る。
3. 公式画像そのもののコピー、直接トレース、色替え、公式イラスト／アイコンの無断再利用は禁止。
4. 「正確性を捏造しない」と「架空の単純な構造にする」を混同しない。不明な寸法はschematicに抽象化するが、公開情報から確認できる位置関係・接続関係は反映する。
5. 地図をAI画像生成へ丸投げしない。館内図は構造化された編集可能なvector/layout sourceを優先する。生成AIは装飾素材等の補助に限定してよい。
6. Floor Illustration単体ではなく、Digital Map上でPIN・Category・Public UIを重ねた最終成果物をAcceptance対象とする。

品質契約
必須評価軸:
- Spatial fidelity
- Wayfinding
- Information hierarchy
- Visual design
- Typography
- Iconography
- Spacing / geometry / line weight
- Digital PIN compatibility
- Mobile readability
- Facility/service discoverability
- Exhibit discoverability
- Cross-floor continuity

最低ライン:
公式パンフレットとの比較で以下3項目のどれかがBELOWならREJECT:
- 空間把握
- Wayfinding
- Visual polish

その他の主要項目も原則COMPARABLE以上。
Mobile / filtering / interactive discoveryは紙よりABOVEを目標とする。

Wayfinding acceptance
初来館者が地図を見て少なくとも、
- 今どの館／何階を見ているか
- 主要展示がどこか
- トイレ／案内／飲食等がどこか
- 上下階へどこから移動するか
- 北館／南館の接続方向
を理解できること。
「展示名が4つ並んでいる」だけの図は地図として不合格。

制作順序 — HARD GATE
いきなり5枚作らない。

STEP 1:
北館2FのみProduction Masterを制作。

STEP 2:
公式北館2FとのSide-by-Side Benchmarkを実施。

STEP 3:
北館2Fが全必須項目COMPARABLE以上になるまで修正。
公式よりBELOWの必須項目が1つでも残る間は残り4Floor制作禁止。

STEP 4:
北館2F ACCEPT後、そのDesign Systemを残り4Floorへ展開。
統一するのは色・Typography・Iconography・線・ゾーン表現・設備表現・ラベル規則。
Floor形状や通路を同一テンプレート化してはならない。

STEP 5:
5FloorをDigital Mapへ投入し、PINとの合成状態を調整。

STEP 6:
390px PrimaryでVisitor Previewを反復し、Desktopも確認。

STEP 7:
主要Spotの写真・説明・PINとの最終合成品質を確認。

Reference research
現行公式情報を一次情報として確認し、source URL / access date / extracted factual relationshipを記録。
第三者素材を使う場合はlicense/author/attributionを記録。
公式著作物はReferenceとUpload assetを明確に分離。

Art Direction
独自のMarine visual identityを設計する。
ブランド模倣ではなく、案内図としての読みやすさを最優先。
色数、装飾、ラベルを増やしすぎず、Digital PINのためのvisual breathing roomを確保。
設備アイコン体系を統一。
5Floor間で上下階接続や館間接続の位置関係を可能な限り連続的に理解できるようにする。

Mobile Primary
390pxの実Public/Preview上で、
- Floor全体の大構造が分かる
- 主要ゾーンが識別できる
- PINが背景に埋もれない
- Floor Illustration内の過剰な小文字に依存しない
- UI + PIN + Illustrationが一体として成立
を満たす。

Desktop
大画面でも粗いQA fixtureに見えない。
Illustrationの解像度／vector-derived出力を適切に保つ。

Asset quality
主要展示には必要に応じて高品質写真を使用。
設備Spotは無理に写真を要求しない。
フリー素材はlicenseを確認。公式写真を無断流用しない。
生成素材はGENERATEDとしてmanifestへ記録。

Evidence
docs/qa/wu67-nagoya-aquarium-production-map/
最低:
00-ART-DIRECTION.md
01-OFFICIAL-REFERENCE-AUDIT.md
02-SPATIAL-TOPOLOGY.md
03-DESIGN-SYSTEM.md
04-NORTH-2F-PRODUCTION-MASTER.md
05-NORTH-2F-BENCHMARK.md
06-FIVE-FLOOR-PRODUCTION.md
07-ASSET-MANIFEST.md
08-MOBILE-VISITOR-REVIEW.md
09-DESKTOP-VISITOR-REVIEW.md
10-FINAL-OFFICIAL-BENCHMARK.md
11-FINAL-ACCEPTANCE.md

Acceptance Criteria
- 北館2F Production Masterが公式Benchmarkの必須項目すべてCOMPARABLE以上
- そのGate前に残り4Floorを量産していない
- 5Floorすべて固有の空間構造を持つ
- 5Floorすべて統一Design System
- 公式画像コピー／直接トレースなし
- 空間トポロジーは公式一次情報に基づく
- Digital PINとの重なりを考慮
- 390px Visitor Previewで成立
- Desktopで成立
- 主要設備・展示を発見可能
- 上下階／館間接続が理解可能
- 現在のQA模式図より「少し良い」ではなく、公式パンフレットと比較可能な商用品質
- 最終Benchmarkで空間把握 / Wayfinding / Visual polishがBELOWでない
- 既存Aquarium Spot/PIN/Categoryデータを不用意に破壊しない
- Production untouched

Out of Scope
- AQUA-006のContent/Placementドメイン再設計
- indoor routing engine
- live indoor positioning
- Paper Renderer本改修
- Production deployment
ただしこれらの不足が完成品質を制限する場合はCompetitive/Product Gapとして記録する。

停止条件
- 北館2Fを公式Benchmark以上にするために重大な新Product Decisionが必要
- 公式情報だけでは重要な空間関係を合理的に確定できず、虚偽のWayfindingを作る危険がある
- P0/P1
上記以外は途中確認で停止せず、Gateに従って進行。

最終質問
「もし明日、このDigital MapのQRが名古屋港水族館入口に置かれ、自分が制作会社として名前を出されても、この品質で納品を承認するか？」
YESになるまで完成扱いにしない。

---

# 67-01｜Official Reference & Spatial Topology

Source: https://app.asana.com/1/1217082051589915/task/1218968565693737
Retrieved: 2026-09-29
Completed: false

公式パンフレット／公式Web館内案内／現行公式デジタルマップを一次Referenceとして調査。5Floorの展示ゾーン、通路、上下階接続、館間接続、入口、主要設備を抽出。コピー／直接トレースは禁止。01-OFFICIAL-REFERENCE-AUDIT.md と 02-SPATIAL-TOPOLOGY.mdを作成。

---

# 67-02｜Art Direction / Design System

Source: https://app.asana.com/1/1217082051589915/task/1218968580343631
Retrieved: 2026-09-29
Completed: false

Marine visual identity、Typography、色、線、ゾーン、設備アイコン、ラベル規則、PIN用余白を設計。公式ブランドの模倣ではなく商用品質の独自Design System。00-ART-DIRECTION.md / 03-DESIGN-SYSTEM.mdを正本化。

---

# 67-03｜北館2F Production Master — HARD GATE

Source: https://app.asana.com/1/1217082051589915/task/1218968506029304
Retrieved: 2026-09-29
Completed: false

北館2FだけをProduction Masterとして制作。構造化された編集可能なvector/layout sourceを保持。Wayfinding可能な実施設向け案内図にする。現QAの4区画／十字テンプレートは禁止。残り4Floorはまだ制作しない。

---

# 67-04｜北館2F Official Side-by-Side Benchmark

Source: https://app.asana.com/1/1217082051589915/task/1218968565693997
Retrieved: 2026-09-29
Completed: false

公式北館2FとDigital Map版を空間把握・Wayfinding・Visual polish・情報階層・設備発見・展示発見・Mobileで比較。必須3項目のどれかがBELOWならREJECTして67-03へ戻す。全必須COMPARABLE以上になるまで残り4Floor制作禁止。

---

# 67-05｜Remaining 4 Floors Production

Source: https://app.asana.com/1/1217082051589915/task/1218968565734529
Retrieved: 2026-09-29
Completed: false

北館2F ACCEPT後のみ着手。北館3F／南館1F／南館2F／南館3FへDesign Systemを展開。Floor固有の実際の空間構造を反映し、同一テンプレート化禁止。5Floorの上下階・館間連続性も確認。

---

# 67-06｜Digital Map Integration / PIN Composition

Source: https://app.asana.com/1/1217082051589915/task/1218968491592184
Retrieved: 2026-09-29
Completed: false

Production Illustration 5枚を既存Aquarium UAT Mapへ投入。既存37 Spot / 37 PIN / 6 Categoryを保持しつつ、PINとの重なり、視覚階層、設備発見、主要展示発見を調整。公式著作物をUploadしない。Asset Manifestを更新。

---

# 67-07｜390px Mobile Visitor Production Review

Source: https://app.asana.com/1/1217082051589915/task/1218968505799375
Retrieved: 2026-09-29
Completed: false

WU-66で整えたVisitor UI＋Production Illustration＋PINを390px Primaryで全5Floorレビュー。大構造、主要ゾーン、PIN視認性、Floor切替、Spot Detailを実際のVisitor Previewで確認。必要ならIllustration側を修正して再投入。

---

# 67-08｜Desktop / Final Official Benchmark / Acceptance

Source: https://app.asana.com/1/1217082051589915/task/1218968491600753
Retrieved: 2026-09-29
Completed: false

Desktopも含め最終成果物を公式パンフレット／公式案内と再比較。空間把握・Wayfinding・Visual polishがBELOWなら完成扱い禁止。最終質問『制作会社として名前を出されても明日納品承認するか』にYESを要求。Production untouched。

