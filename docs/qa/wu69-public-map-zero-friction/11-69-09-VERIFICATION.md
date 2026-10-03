# WU-69 / 69-09 implementation verification — 2026-10-03

Canonical: [WU-69](https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219125292154655) (modified 05:18:13.683Z), [69-09](https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219127061551714). Parent AC24–32 is the current Product Decision. Raw authority is ASANA-69-09-AUTHORITY.json. Original AS IS / benchmark findings remain preserved in 00–09. This is a candidate verification; WU-69 final delivery remains NOT COMPLETE while required Verify fails.

## 390×844 before / comparisons / after

Before was replayed from visitor sources at 52a397b30c3fb76ccff9e4e526a6e8fe93a84f52, on the same Arimatsu fixture and local browser. No branch reset, Windows deployment or canonical DB writes. Final candidate sources were restored before regression QA. Screenshots are real browser captures (JPEG), not mockups. Nuxt dev chrome / expired external fixture logo or photos are development-fixture limitations, not a claim about delivered Production assets.

- Category: no left/right buttons; native horizontal scrolling with partial next chip, 16px edge fade and thin scrollbar. All/clear stays fixed outside scroller, 44px target. Selection is pressed state plus all names and counts, wrapping without truncation. Scroll to end → clear needs one activation and leaves camera unchanged. Dynamic dock height keeps controls 24px clear when all names wrap.
- Collision: quiet 20px white badge uses the existing screen-space group count. Arimatsu representative tap advances +1 zoom and exposes individual spots. Near3 reaches maxZoom20.6097076464, then exposes three Map PINs, no list dialog. Coincident3 retains existing WU-68 proven-inseparable shortcut. Enter opens Spot02; Escape preserves camera and returns focus to the canvas when its PIN is hidden. Priority and recovery algorithms are unchanged.
- Camera comparison: same center / zoom15.7597076464 / bearing0, pitch20 versus25. 20° image extent≈512px;25°≈489px, a modest 4.5% perspective tradeoff. 25° gives a clearer slant while labels/PINs stay readable; selected25. Before20° at zoom15.6097076464 had≈463px extent, so the +0.15 zoom compensates and gives a larger initial Map. Whole-floor caps remain Mobile+1.3, Desktop+0.65; fallback offsets Mobile+1.15 and Desktop+0.2. Overview stays0°/0°.
- Background: compared white#ffffff, cool#eef1f2, warm#eeeae4. Warm neutral blends with illustration paper, separates white chips naturally and stays subordinate to art/PINs. Selected flat warm tone. Strong pattern/gradient/shadow rejected; no texture needed because illustration already has fine linework.
- F25 P3: initial25° incorrectly exposed heading recovery while already at its initial pose. Set homePitch before first jumpTo/pitch events. Initial heading control now absent; regression test covers the baseline observed during every initial jump.

These choices follow Platinumaps continuous category exploration and Google Maps named selection chips. Brand UI, Search/Routing and new category hierarchy were not copied. Original benchmarks and adoption/rejection reasoning remain in02/03/09.

## Regression evidence

- Tests702 PASS /1 SKIP,106 files PASS /1 SKIP. DB integration tests use new digital_map_test_wu65_wu69_09_20261003 in existing local Compose Postgres. Skip is WU65 separate before/after migration equivalence. Canonical digital_map DB unchanged.
- typecheck PASS; build PASS; Prisma validate PASS; diff whitespace PASS. No package/lock/workflow/schema/migration changes.
- 390×844 /768×1024 /1024×768 /1440×900 /1440×700: actual inner dimensions checked; no document horizontal overflow; final camera0°/25°. (An initial viewport pass targeted a second tab; invalid measurements were removed and all widths repeated with measured dimensions.)
- Authenticated LIVE Preview and Public Release rendered in isolated local DB/storage with an Arimatsu-derived20-spot fixture. Login uses a disposable fictitious account, no existing credential modifications. Same camera JSON at all five widths; Category Space→PIN Enter→Escape preserves camera on both routes. Chip names/states, badges, background and controls match, except the intentional Preview banner. QA release is a fixture snapshot, not a test of the publish pipeline or a Windows deployment.
- Chrome Rendering panel set prefers-reduced-motion:reduce; DOM confirmed reduce=true at390×844. Representative Enter finishes immediately with moving=false; Overview returns0°/0°. Override reset afterward. Native touch/pinch, real phone safe area/browser chrome and an actual five-minute one-handed walk remain unverified.

## All acceptance criteria

Candidate describes local evidence; Final includes Windows exact SHA / black-box acceptance and is not upgraded on the basis of local testing.

| AC | Canonical criterion | Candidate | Final | Evidence / remaining limit |
| --- | --- | --- | --- | --- |
| 1 | Category UI | PASS | FAIL | 候補のMap探索面積を改善。WindowsはAS ISの小さいMap。 |
| 2 | Collision marker count | PARTIAL | PARTIAL | 候補S1〜S10のpointer経路を実施。physical pinch/初見別人/Windows final未了。 |
| 3 | Initial camera | PASS | FAIL | 候補のknown P1/P2を回収。Windows baselineは未反映。 |
| 4 | Outside-map background | PASS | FAIL | F25 P3 also fixed;25 Finding IDs, F09 not reproducible,24 confirmed fixed locally; Windows unmodified. |
| 5 | frictionを優先順に修正 | PASS | FAIL | Native chip scroller, partial chip/fade, fixed one-action clear, wrapped names; Windows unmodified. |
| 6 | 390px反復QA | PASS | PARTIAL | selected/focused名と既存normal/featuredの形・priority。Windows最終比較未了。 |
| 7 | responsive/accessibility回帰 | PASS | PARTIAL | dense +1段、near maxZoom、3本spiderfyから個別選択。Windows未了。 |
| 8 | PR / Verify / merge | PASS | FAIL | 全5幅でClose camera一致、user Panは保持。Windows baselineは元cameraを失う。 |
| 9 | Windows exact SHA | PARTIAL | PARTIAL | pointer/keyboardとnative設定を確認、physical pinch未検証。 |
| 10 | Black-box Final Acceptance | PASS | PARTIAL | 2-floorでCategory保持、旧Detail閉じ、Floor0/25。Windows未了。 |
| 11 | Overview recoveryが見つけやすく、実行後の状態が予測可能 | PASS | FAIL | 「全体」/overview0/0。Windowsは発見しにくい記号のまま。 |
| 12 | Mobileで不要なZoom +/-等が操作を邪魔しない。必要性を実画面で判断 | PASS | FAIL | 実390画面でmobile +/-を隠し、Desktop/keyboardを維持。Windows未反映。 |
| 13 | controlsの位置・見た目・役割が統一されている | PASS | PARTIAL | 44px基本サイズ、下部controls、Category/Detail役割整理。Windows未了。 |
| 14 | touch targetは原則44px以上 | PASS | PARTIAL | candidateの主要button44px、PIN60px。Windows final未了。 |
| 15 | safe-area / browser chrome / short viewportで重要UIが欠けない | PARTIAL | PARTIAL | 390×400は画面内。safe-area実値/mobile browser chromeは未実測。 |
| 16 | 390 / 768 / 1024 / 1440 / 1440x700で主要操作PASS | PASS | PARTIAL | 要求5幅で探索→Detail→Escape/camera復帰。Windows final未了。 |
| 17 | keyboard/focus/Escapeの主要フローPASS | PASS | PARTIAL | Map、Category、PIN、Detail、Info、Floorのkeyboard/focus/Escapeを実測。Windows未了。 |
| 18 | prefers-reduced-motionで操作可能 | PASS | PARTIAL | reduce=true、spiderfy/Enter/Detail0ms/Escapeを実測。Windows未了。 |
| 19 | Public Release / Authenticated LIVE Preview parity維持 | PASS | PARTIAL | Authenticated local LIVE vs Public Release, camera JSON identical at all5 widths; Windows final pending. |
| 20 | Google Maps / PlatinumapsとのBenchmarkで、基本操作に明白な劣化UXがある場合は理由なく残さない | PASS | PARTIAL | 14軸比較と採用/不採用理由を記録。提供環境のrecheck未了。 |
| 21 | Benchmarkを真似た結果Digital Map固有のIllustration Map UXが悪化していない | PASS | PARTIAL | Illustration保持、写真PIN全面化/全文panel/新domain不採用。Windows未了。 |
| 22 | tests / typecheck / build / Prisma validate / Verifyの既存品質ゲートを通す | FAIL | FAIL | Latest local tests702/1skip, typecheck/build/Prisma PASS; required Verify/security audit remains FAIL. |
| 23 | Production untouched | PASS | PASS | main/Production/Publicationは操作なし。Windows runtimeも未変更。 |
| 24 | 左右矢印に依存せずCategoryをtouch scrollで探索できる。 | PARTIAL | PARTIAL | Native horizontal scroll and CSS touch scroller verified; actual finger swipe not performed. |
| 25 | 「すべて/クリア」はCategory scroll位置に関係なく1操作で到達できる。 | PASS | PARTIAL | Local browser/automated evidence above; Windows exact-SHA acceptance pending. |
| 26 | collision representative PINにgroup件数が分かる最小badgeが表示される。 | PASS | PARTIAL | Local browser/automated evidence above; Windows exact-SHA acceptance pending. |
| 27 | badge付きrepresentative tapでstaged zoom / maxZoom spiderfyが既存契約どおり動く。 | PASS | PARTIAL | Local browser/automated evidence above; Windows exact-SHA acceptance pending. |
| 28 | 390x844初期cameraはpitch 20〜25°の比較結果に基づき、現行よりMap-firstに見える。 | PASS | FAIL | Actual390 before/after and comparison confirm candidate; Windows still old view. |
| 29 | 初期zoomは安全上限を守りつつ、開いた直後に探索可能な密度になる。 | PASS | FAIL | Actual390 before/after and comparison confirm candidate; Windows still old view. |
| 30 | Map領域外背景が白ベタより完成度を上げ、Illustration/PIN/controlの視認性を悪化させない。 | PASS | FAIL | Actual390 before/after and comparison confirm candidate; Windows still old view. |
| 31 | 上記変更後もPublic Release / Authenticated LIVE Preview parityを維持。 | PASS | PARTIAL | Actual authenticated local Preview/Public five-width camera equality and context; Windows pending. |
| 32 | WU-68 collision / spiderfy / overview / context-preservation契約を壊さない。 | PASS | PARTIAL | Local browser/automated evidence above; Windows exact-SHA acceptance pending. |

## Delivery and final question

PR#28 stays Draft. Never merge while Verify FAIL. Security audit threshold/protection unchanged. Latest remote run and Codex review status are recorded separately in delivery-status-69-09.json. Production untouched. Windows exact SHA, post-merge Verify and black-box Final Acceptance have not happened.

「旅行中・施設内で片手で5分使ったとき、少しでも使いづらさが残るか」: current Windows YES (candidate not deployed). Candidate has no remaining confirmed reasonable Finding in the browser checks; actual phone five-minute operation has not been performed, so NO is not certified. WU-69 remains NOT COMPLETE.
