# WU-69 final verdict — NOT COMPLETE

実装候補のUX polishとローカル検証は完了。PRの必須Verifyと提供環境での最終Acceptanceが成功するまで、WU-69を完了扱いにしない。

## 実施したこと

- 親WU本文・AC・Out of Scopeと69-01〜69-08を取得し、コード/内部仕様/Benchmarkの前に390×844で一般ユーザーとしてAS IS操作。16 Findingを固定。後続5 Findingを追加、F09は再現なしとして訂正。confirmed20件をcandidateで回収。
- Google Maps/Platinumapsの実画面比較、14軸の採用/不採用理由、UX Contract、モバイル反復、5幅/短高、keyboard/reduced motionの検証を保存。
- WU68 priority・Map-only recovery・spiderfy・initial0/20・overview0/0・Public/LIVE共通rendererを維持。

## Quality gates

| Gate | Result |
| --- | --- |
| tests（DBなし） | PASS、685 passed/18 skipped |
| tests（この作業のdisposable DB） | PASS、702 passed/1 skipped。skipは別before/after DBを要するWU65 migration equivalence。 |
| typecheck | PASS |
| build | PASS |
| Prisma validate / generate | PASS |
| existing migrations / tenant・IMAGE・Paper audits | PASS（disposable empty DB）。既存正本データの監査を装わない。 |
| audit --prod --audit-level high | FAIL、既存依存のHigh2。node-forgeとbraces。package/lockは未変更。 |
| PR Verify | 実行結果・URL・HEAD SHAはdelivery-status.jsonへ追記。 |

High advisories: [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv)、[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)。audit時点は両者Patched versions None。Verify workflowの閾値やdependency安全チェックを緩めない。

## 全Acceptance Criteria

Candidateはローカル修正を評価。Finalは、まだ旧SHAであるWindows提供環境と指定の実施順を含む最終Acceptance。未実施をPASSにしない。

| AC | 正本の基準 | Candidate | Final | 根拠・未了 |
| --- | --- | --- | --- | --- |
| 1 | 390pxでMapが常に画面の主役として認識できる | PASS | FAIL | 候補のMap探索面積を改善。WindowsはAS ISの小さいMap。 |
| 2 | 初見ユーザーが説明なしでS1〜S10を完遂可能 | PARTIAL | PARTIAL | 候補S1〜S10のpointer経路を実施。physical pinch/初見別人/Windows final未了。 |
| 3 | Public Map主要操作に既知P1/P2を残さない | PASS | FAIL | 候補のknown P1/P2を回収。Windows baselineは未反映。 |
| 4 | 再現可能なP3も、合理的に修正可能なものは残さない | PASS | FAIL | candidateのreasonable P3を回収。提供環境は未反映。 |
| 5 | Category UIの選択状態・横方向の追加項目・解除方法が明確 | PASS | FAIL | 固定解除・選択名/数・独立送り。Windows baselineは横送り後に解除が隠れる。 |
| 6 | PINのnormal / featured / selected / focusedが過剰でなく判別可能 | PASS | PARTIAL | selected/focused名と既存normal/featuredの形・priority。Windows最終比較未了。 |
| 7 | WU-68 collision / staged zoom / spiderfyが自然で、仕組みを意識させない | PASS | PARTIAL | dense +1段、near maxZoom、3本spiderfyから個別選択。Windows未了。 |
| 8 | Detail open/closeでMap contextを失わない | PASS | FAIL | 全5幅でClose camera一致、user Panは保持。Windows baselineは元cameraを失う。 |
| 9 | Map pan/pinch/zoomをfloating UIが不必要に阻害しない | PARTIAL | PARTIAL | pointer/keyboardとnative設定を確認、physical pinch未検証。 |
| 10 | Floor切替後の探索が自然 | PASS | PARTIAL | 2-floorでCategory保持、旧Detail閉じ、Floor0/20。Windows未了。 |
| 11 | Overview recoveryが見つけやすく、実行後の状態が予測可能 | PASS | FAIL | 「全体」/overview0/0。Windowsは発見しにくい記号のまま。 |
| 12 | Mobileで不要なZoom +/-等が操作を邪魔しない。必要性を実画面で判断 | PASS | FAIL | 実390画面でmobile +/-を隠し、Desktop/keyboardを維持。Windows未反映。 |
| 13 | controlsの位置・見た目・役割が統一されている | PASS | PARTIAL | 44px基本サイズ、下部controls、Category/Detail役割整理。Windows未了。 |
| 14 | touch targetは原則44px以上 | PASS | PARTIAL | candidateの主要button44px、PIN60px。Windows final未了。 |
| 15 | safe-area / browser chrome / short viewportで重要UIが欠けない | PARTIAL | PARTIAL | 390×400は画面内。safe-area実値/mobile browser chromeは未実測。 |
| 16 | 390 / 768 / 1024 / 1440 / 1440x700で主要操作PASS | PASS | PARTIAL | 要求5幅で探索→Detail→Escape/camera復帰。Windows final未了。 |
| 17 | keyboard/focus/Escapeの主要フローPASS | PASS | PARTIAL | Map、Category、PIN、Detail、Infoのkeyboard/focus/Escapeを実測。Floor完全keyboard/Windows未了。 |
| 18 | prefers-reduced-motionで操作可能 | PASS | PARTIAL | reduce=true、spiderfy/Enter/Detail0ms/Escapeを実測。Windows未了。 |
| 19 | Public Release / Authenticated LIVE Preview parity維持 | PARTIAL | PARTIAL | 同一rendererに適用。Authenticated LIVE実操作との比較は未了。 |
| 20 | Google Maps / PlatinumapsとのBenchmarkで、基本操作に明白な劣化UXがある場合は理由なく残さない | PASS | PARTIAL | 14軸比較と採用/不採用理由を記録。提供環境のrecheck未了。 |
| 21 | Benchmarkを真似た結果Digital Map固有のIllustration Map UXが悪化していない | PASS | PARTIAL | Illustration保持、写真PIN全面化/全文panel/新domain不採用。Windows未了。 |
| 22 | tests / typecheck / build / Prisma validate / Verifyの既存品質ゲートを通す | FAIL | FAIL | local tests702/1skip、typecheck/build/Prisma/3監査PASS。mandatory audit High2 FAIL。 |
| 23 | Production untouched | PASS | PASS | main/Production/Publicationは操作なし。Windows runtimeも未変更。 |

## 69-01〜69-08

| Subtask | 判定 |
| --- | --- |
| 69-01 AS IS | PARTIAL。初回S8専用group/S10 multi-floorは未実施。dead UAT URLの理由を記録し、後続candidate QAで補完。初見と偽らない。 |
| 69-02 Google benchmark | PASS、Chrome web版/表示制限の範囲を明記。 |
| 69-03 Platinumaps benchmark | PASS、公式demo/physical touch未測定を明記。 |
| 69-04 UX Contract | PASS |
| 69-05 Mobile polish | PARTIAL。候補Finding回収、physical touch/提供環境未了。 |
| 69-06 Responsive/a11y | PARTIAL。5幅と主要keyboard/reduce PASS、実safe-area/Floor keyboard/Windows未了。 |
| 69-07 PR/Verify/Windows | FAIL。mandatory security gate不合格。merge/post-merge/Windows exact SHA未了。 |
| 69-08 Black-box Final Acceptance | PARTIAL。Windowsのcandidate black-box S1〜S12と片手5分は未実施。 |

## 最終質問

「旅行中・施設内で片手でこのMapを5分使ったとき、少しでも使いづらさが残るか」→ **YES。現在のWindows提供版には、初見で確認したMapの小ささ・Category解除・Detail復帰などの摩擦が残る。** 修正候補では回収したが、指定順で反映できておらず、実機の片手5分/touch検証も済んでいない。候補をNOと断定しない。WU-69は未完了。

次の実施順は mandatory Verify成功→dev merge→post-merge Verify→Windows exact merge SHA→Public/LIVE parity→実機touchとblack-box S1〜S12→Final再判定。Production untouched。

実装commit: `d875fe39f712478a9def844ff30f41a85f8f2a5a`。証跡はそのcode treeに対するローカルQA。最終PR HEADとCIの実結果は `delivery-status.json` を参照。

最終code SHA: `4a0d80cd9eeeba13bbb1447bf78b78ffa6a54747`。LIVE背後の編集Mapへfocusを戻さないようvisitor内にselectorを限定。near spiderfy→Enter Spot02→Escapeでvisitor CANVASへ復帰を実測。最終codeでtypecheck/build/685 unit・702 integration（1 skip）PASS。

## PR Verifyの確定結果

[Draft PR #28](https://github.com/NAOKI-Ko/digital-map/pull/28)、[Verify 37090800163](https://github.com/NAOKI-Ko/digital-map/actions/runs/37090800163)、exact HEAD `1df511c8e20195135f7bd419c43cd393bd97fde3` はaudit High2でFAIL。CIが提示したnode-forge1.4.1/braces3.0.4は公式registryに存在せず直接URLも404、公式tagも未公開。詳しい矛盾と根拠は `SECURITY-GATE.md`。dev保護の必須verify/enforce_adminsを確認し、merge以降は未実施。

Windows SSHを再読取りしてdeployed SHAは `ad4f4bde269b16c5575b836add444b5e6fa88399` のまま。Production untouched。追加のCI証跡commitはcodeを変更しない。最新PR HEADに対する再実行結果はローカルoutput `delivery-status.json` に保存する。
