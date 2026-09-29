# WU-66 Final Verdict

**PARTIAL — 実装・PR・merge・post-merge Verify・Windows QA deployment・既存Aquarium Public Acceptanceまで実施。AQUA-007 CLOSED。Production untouched。**

親WU本文・AC・Out of Scope・66-01〜08の原文をREQUIREMENTS.mdに保存し、監査→Contract確定→実装→QA→PR→merge→Verify→backup/deploy→Acceptanceの順で実施。P0/P1、新しい重大Product Decision、schema変更なし。

## Acceptance Criteria

| # | Acceptance Criteria | 判定 | 証跡／制限 |
|---|---|---|---|
| 1 | AQUA-007 CLOSED | PASS | Windows全5Floorで初回／切替fitを確認 |
| 2 | 390pxの全5Floor全体表示 | PASS | 11/11・4/4・6/6・9/9・7/7 PIN矩形が画面内 |
| 3 | 前Floor cameraの不適切な継承なし | PASS | pan/zoom後の切替でreset、bearing/pitch単体テスト |
| 4 | 切替fit後のuser pan/zoom尊重 | PASS | filter・detail開閉でcamera維持、passive resize回帰テスト |
| 5 | viewport/chrome/padding/aspect ratio | PASS | 実測padding、全体contain、6サイズの境界テスト |
| 6 | 37 PIN / 6 Categoryの主要操作 | PASS | 既存fixture保持、Floor/Category/PIN/Detail操作 |
| 7 | Desktopの合理的なMap領域 | PASS | 全幅stage、画像比率由来の余白は維持、凡例を隠さない |
| 8 | 390/768/1024/1440/short desktop | PASS | local・Windowsで主要フロー実施 |
| 9 | Public/LIVE Preview共通Renderer | PASS | 両routeが同一componentを使用、専用修正なし。認証済み実画面は未確認 |
| 10 | Spot Detail後の空間context維持 | PASS | close前後のmarker transform一致、PINへfocus復帰 |
| 11 | touch前提の操作確認 | PARTIAL | 44px targets・pointer pan/zoom・Floor/CategoryはPASS。実機multitouch未実施 |
| 12 | 厳格な前後公式Benchmark | PASS | 全16観点を評価、ABOVE断定なし、未検証を明示 |
| 13 | Illustration/UI問題の分離 | PASS | real topology・密度・ラベル・空間表現は別負債 |
| 14 | Windows既存Aquarium Acceptance | PASS | 既存Map/Release不変、5Floor/37PIN/6Category |
| 15 | tests/typecheck/build/Prisma/Verify | PASS | local/Windows 678 PASS・1 optional SKIP、PR/merge Verify PASS |
| 16 | Production untouched | PASS | mainへmerge/deployなし、QAだけ切替 |

**15 PASS / 1 PARTIAL / 0 FAIL。** WU全体を無条件完了扱いにはしない。実端末touchの残確認が必要。認証済み既存Aquarium LIVE Previewの手動確認も残る（コード共有・auth/analytics回帰はPASS）。

## SHAs and CI

- base: `d4e4df3a1acc4565e6fc1afee1218e4e6bb8ccf0`
- pre-implementation Contract: `5810a9c`
- implementation: `d5440ce751b7db8661eb99313da28236d1a4f9f1`
- final product / Windows: `4a90be0186666a0e2007029da85e5a0846539e2a`
- PR: https://github.com/NAOKI-Ko/digital-map/pull/23
- PR Verify: https://github.com/NAOKI-Ko/digital-map/actions/runs/36515717882
- post-merge Verify: https://github.com/NAOKI-Ko/digital-map/actions/runs/36516007556
- Production/main baseline: `a58b4353bd108e6586f329080c772f69b8aaffda`

後続は証跡のみのcommit。Windowsは上記の検証済みproduct SHAを保持する。

## Benchmark / residual debt / next work

Floor認識・Category発見・viewport利用・Desktop操作は改善。実空間orientation、建物間関係、展示ラベル／PIN密度、情報密度は公式よりBELOW。公式Mobileの同条件比較・時間計測はNOT-YET-COMPARABLE。ルート、屋内測位、多言語の差をWU-66へ勝手に追加していない。詳細16観点はAQUARIUM-ACCEPTANCE.md。

Production-quality Floor Illustration制作は着手可。ただし実際の通路・階接続・建物関係・ラベル視認性を別途検証し、この模式図を実施設案内として流用しない。Production公開承認を意味しない。

Evidence: 11-LOCAL-QA.md、WINDOWS-QA.md、AQUARIUM-ACCEPTANCE.md、01-OFFICIAL-BENCHMARK.md、09-TARGET-CONTRACT.md。
