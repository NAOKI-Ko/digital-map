# WU-66｜Public Indoor Map Quality / Official Benchmark

Source: https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1218967193969145
Retrieved: 2026-09-29
Completed: false

WU-66 — Public Indoor Map Quality / Official Benchmark

目的
名古屋港水族館の既存公式パンフレット・公式Web館内案内・現行公式デジタルマップを品質Benchmarkとして、Digital MapのPublic Visitor UIを実施設向け品質へ引き上げる。390pxのスマホ利用をPrimaryとし、AQUA-007を閉じる。

背景
管理画面側のAquarium UAT課題はWU-63〜65で主要項目をCLOSED済み。次は来館者向けPublic Mapの器を仕上げ、その後にProduction-quality Floor Illustrationを制作する。
既存Aquarium UAT Map（5 Floors / 37 Spots / 37 PIN / 6 Categories）を実データAcceptance fixtureとして使用し、再構築しない。

品質基準
「動く」「現UATより良い」では不十分。
最低基準は名古屋港水族館の既存公式パンフレット／館内案内。
Digital Mapは最終的に、
- 空間把握・視認性: 同等以上
- 展示・設備発見: 上回る
- Mobile / Filter / interactive discovery: 明確に上回る
ことを目標とする。
公式デザイン・イラスト・アイコンをコピー／トレースしない。情報階層・Wayfinding・密度・操作設計のBenchmarkとして利用する。

Primary Acceptance Criteria
1. AQUA-007 CLOSED。
2. 390pxで全5Floorが初回／切替直後から有用な全体表示になる。
3. 前Floorのcamera状態により新FloorのPINや主要領域が不適切に画面外へ出ない。
4. Floor切替時は新Floorを適切にfitし、その後ユーザーがpan/zoomしたら勝手にfitしない。
5. fitは実map viewport、UI chrome、safe padding、illustration aspect ratioを考慮する。
6. 37 PIN / 6 Category規模でFloor・Category・PIN・Spot Detailが実用的。
7. Desktopで不合理な巨大余白がなく、MapがVisitor UIの主役。
8. 390 / 768 / 1024 / 1440 / short desktopで主要フローPASS。
9. Public ReleaseとWU-64 authenticated LIVE Previewが同じVisitor Rendererを使用し、Preview専用の見た目修正を作らない。
10. Spot Detailを開閉しても空間コンテキストを失わず、自然にMapへ戻れる。
11. touch前提のtap target / pan / zoom / Floor / Category操作を確認。
12. 公式Benchmarkを実装前後で作成し、各観点を BELOW / COMPARABLE / ABOVE / NOT-YET-COMPARABLE で厳格に評価する。
13. Floor Illustration自体の品質問題とPublic UIの問題を分離する。
14. Windows QAの既存Aquarium Mapで最終Acceptanceを実施。
15. tests / typecheck / build / Prisma validate / Verify PASS。
16. Production untouched。

Official Benchmark観点
- floor recognition
- building recognition
- exhibit discovery
- toilet/facility discovery
- category discovery
- spatial orientation
- viewport utilization
- visual hierarchy
- marker readability
- information density
- mobile usability
- desktop usability
- interaction cost
- current-location support
- route guidance
- multilingual capability
未実装のrouting/current location/multilingualはCompetitive Gapとして記録し、WU-66へ自動追加しない。

Target behavior — Floor Fit
INITIAL LOAD → active Floorを適切にfit
FLOOR CHANGE → 新Floorを適切にfit
USER PAN/ZOOM → 以後はユーザー操作を尊重
「地図全体を表示」は回復操作として残してよいが、Floor切替ごとに押す必要があってはならない。

Public IA確認
来館者がすぐ答えられること:
- どの館／何階を見ているか
- 主要展示は何か
- 目的展示はどこか
- トイレ・設備はどこか
- Spotをどう見るか
- Floorをどう切り替えるか
- 全体表示へどう戻るか

Out of Scope
- Production-quality Floor Illustration本制作
- AQUA-006 multi-floor content model
- Paper Renderer
- routing / indoor navigation graph
- current location / indoor positioning
- multilingual architecture
- Placement entity
- Building entity
- 管理画面再設計
- Production deployment

実施工程
Official Benchmark / AS-IS → Target Contract → 実装 → Regression/Accessibility → PR → merge → post-merge Verify → Windows backup/deploy → Aquarium Acceptance。

実装前にTarget Contractをdocs/qa/wu66-public-indoor-map-quality/へ確定する。
新しい重大Product Decisionが必要な場合、P0/P1、安全に処理できないschema/migration要求が出た場合のみ停止。それ以外は通しで進める。

Evidence
docs/qa/wu66-public-indoor-map-quality/
最低:
00-AS-IS-VERDICT.md
01-OFFICIAL-BENCHMARK.md
02-VIEWPORT-MATRIX.md
03-MOBILE-UX-AUDIT.md
04-DESKTOP-UX-AUDIT.md
05-FLOOR-SWITCH-AUDIT.md
06-CATEGORY-PIN-AUDIT.md
07-SPOT-DETAIL-AUDIT.md
08-FINDINGS.md
09-TARGET-CONTRACT.md
10-IMPLEMENTATION-PLAN.md
WINDOWS-QA.md
AQUARIUM-ACCEPTANCE.md
FINAL-VERDICT.md

Final report
- Verdict
- base/final/Windows SHA
- benchmark
- findings
- AQUA-007 disposition
- 390px全5Floor
- Desktop viewport
- Category/PIN/Spot Detail
- Public/Preview parity
- tests/build/Verify
- Windows acceptance
- competitive gaps
- remaining Public Map debt
- whether Production-quality Floor Illustration work may begin
- Production status

---

# 66-01｜Official Benchmark / AS-IS Audit

Source: https://app.asana.com/1/1217082051589915/task/1218967137313505
Retrieved: 2026-09-29
Completed: false

公式パンフレット、公式Web館内案内、現行公式デジタルマップと現Digital Map Aquariumを比較。390/768/1024/1440/1440×約700でAS-ISを記録。著作物はコピー／トレースせずBenchmarkとして使用。

---

# 66-02｜Target Visitor Contract

Source: https://app.asana.com/1/1217082051589915/task/1218967360724937
Retrieved: 2026-09-29
Completed: false

Floor初期fit・Floor切替・user pan/zoom・Floor selector・Category filter・PIN・Spot Detail・Mobile/Desktopの期待動作を09-TARGET-CONTRACT.mdへ固定。重大な新Product Decisionがなければそのまま実装へ進む。

---

# 66-03｜Mobile Floor Fit / AQUA-007

Source: https://app.asana.com/1/1217082051589915/task/1218967324133212
Retrieved: 2026-09-29
Completed: false

390px Primary。初回とFloor切替時に新Floor全体を実viewport＋safe paddingで適切にfit。前Floor cameraを不適切に継承しない。ユーザーpan/zoom後は勝手にfitしない。全5FloorでAcceptance。

---

# 66-04｜Public Layout / Desktop

Source: https://app.asana.com/1/1217082051589915/task/1218967194009855
Retrieved: 2026-09-29
Completed: false

Desktopの巨大余白疑惑を実測。MapをPublic UIの主役にし、1440pxとshort viewportを最適化。単なる100vw化や過剰zoomで誤魔化さない。

---

# 66-05｜Visitor Controls / Spot Detail

Source: https://app.asana.com/1/1217082051589915/task/1218967277977404
Retrieved: 2026-09-29
Completed: false

37 PIN・6 Category・5 FloorでFloor/Category/PIN/Spot Detailの視覚階層、tap target、開閉、空間コンテキスト維持を改善。Floor Illustrationの品質不足をUIで誤魔化さない。

---

# 66-06｜Regression / Accessibility

Source: https://app.asana.com/1/1217082051589915/task/1218967360875502
Retrieved: 2026-09-29
Completed: false

Public ReleaseとWU-64 LIVE Previewのrenderer parity、keyboard/focus、selected state、contrast、Escape、responsiveを検証。390/768/1024/1440/short desktop。

---

# 66-07｜PR / Windows QA Deployment

Source: https://app.asana.com/1/1217082051589915/task/1218967278039152
Retrieved: 2026-09-29
Completed: false

tests/typecheck/build/Prisma/diff check→PR→Verify→merge→post-merge Verify→Windows pre-deploy backup→exact SHA deploy→local/public health。Production untouched。schema changeが必要ならscope driftとして停止。

---

# 66-08｜Aquarium Acceptance / Benchmark Recheck

Source: https://app.asana.com/1/1217082051589915/task/1218967324177199
Retrieved: 2026-09-29
Completed: false

Windows上の既存Aquarium 5 Floor / 37 PIN / 6 Categoryで最終Acceptance。全5Floorを390pxで確認。公式BenchmarkをBELOW/COMPARABLE/ABOVE/NOT-YET-COMPARABLEで再評価。AQUA-007 closureと次のProduction-quality Floor Illustration着手可否を判定。

