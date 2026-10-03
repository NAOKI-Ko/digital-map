# Windows exact SHA QA

2026-10-03、SSH read-onlyで `C:\DigitalMap\runtime\deployed-sha.txt` を確認した現在のruntimeは `ad4f4bde269b16c5575b836add444b5e6fa88399`。既存QA Public `https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon` で最初の390px exploratory QAを実施し、未変更画面も再撮影した。

| Stage | State |
| --- | --- |
| PR / Verify | 実CIの結果を追記する。ローカルauditはHigh2でFAIL。 |
| dev merge | 未実施。必須Verifyを回避しない。 |
| post-merge Verify | merge未実施のため未実施。 |
| Windows exact merge SHA deploy | 未実施。candidateを旧SHAで検証済みと偽らない。 |
| Windows Public / Authenticated LIVE parity | candidateの実操作は未実施。 |
| Windows final S1〜S12 black-box | 未実施。ローカル実装者QAを代替としてPASSにしない。 |

停止する理由は既存mandatory quality gateの失敗。Production、Windows runtime、公開Publication、Windows secretsを変更していない。修復版を先に非ProductionへdeployしてVerify条件を飛ばすこともしない。

再開順: High advisoryの修正版または別WUの安全な依存対処→Verify成功→dev merge commit→post-merge Verify成功→Windows exact merge SHA deploy→Public/LIVE parity→実touch/片手5分を含むblack-box final acceptance。

実装commit: `d875fe39f712478a9def844ff30f41a85f8f2a5a`。証跡はそのcode treeに対するローカルQA。最終PR HEADとCIの実結果は `delivery-status.json` を参照。

最終code SHA: `4a0d80cd9eeeba13bbb1447bf78b78ffa6a54747`。LIVE背後の編集Mapへfocusを戻さないようvisitor内にselectorを限定。near spiderfy→Enter Spot02→Escapeでvisitor CANVASへ復帰を実測。最終codeでtypecheck/build/685 unit・702 integration（1 skip）PASS。

## PR Verifyの確定結果

[Draft PR #28](https://github.com/NAOKI-Ko/digital-map/pull/28)、[Verify 37090800163](https://github.com/NAOKI-Ko/digital-map/actions/runs/37090800163)、exact HEAD `1df511c8e20195135f7bd419c43cd393bd97fde3` はaudit High2でFAIL。CIが提示したnode-forge1.4.1/braces3.0.4は公式registryに存在せず直接URLも404、公式tagも未公開。詳しい矛盾と根拠は `SECURITY-GATE.md`。dev保護の必須verify/enforce_adminsを確認し、merge以降は未実施。

Windows SSHを再読取りしてdeployed SHAは `ad4f4bde269b16c5575b836add444b5e6fa88399` のまま。Production untouched。追加のCI証跡commitはcodeを変更しない。最新PR HEADに対する再実行結果はローカルoutput `delivery-status.json` に保存する。
