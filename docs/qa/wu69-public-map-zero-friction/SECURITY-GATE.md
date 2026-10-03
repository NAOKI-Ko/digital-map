# Mandatory Verify blocker

PR #28 targets dev, is Draft/OPEN and GitHub mergeStateStatus is BLOCKED. dev requires `verify`, enforced for admins. No merge was attempted and no security condition was weakened.

[PR Verify run 37090800163](https://github.com/NAOKI-Ko/digital-map/actions/runs/37090800163) at HEAD `1df511c8e20195135f7bd419c43cd393bd97fde3`: frozen install PASS, `pnpm audit --prod --audit-level high` FAIL, 2 High. Remaining Prisma/audits/typecheck/tests/build steps are skipped in CI, not claimed PASS. Those gates passed locally at code `4a0d80cd9eeeba13bbb1447bf78b78ffa6a54747`. Push Verify 37090767076 failed on the same gate.

| Dependency | Locked | CI suggested patched | Official registry check | Official latest tag |
| --- | --- | --- | --- | --- |
| node-forge | 1.4.0 | >=1.4.1 | node-forge@1.4.1: no matching version; direct version URL HTTP404; version list ends1.4.0 | v1.4.0 |
| braces | 3.0.3 | >=3.0.4 | braces@3.0.4: no matching version; direct version URL HTTP404; version list ends3.0.3 | 3.0.3 |

2026-10-03に公式registry `https://registry.npmjs.org` と公式GitHub tagを実取得した。pnpm cacheに依存しないcurlでも404。CI advisoryの推奨versionだけで公開済みと判断しない。ローカルaudit/公式GitHub advisory web表示はPatched versions Noneであり、異なる結果をすべて残す。公式releaseのないGitHub latest-release endpointの404も、tagチェックで補完した。

Primary references: [forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [forge tags](https://github.com/digitalbazaar/forge/tags), [braces tags](https://github.com/micromatch/braces/tags).

利用可能な修正版を確認できず、package/lock/Verify workflowは未変更。audit ignore、version偽装、未release/unverified fork、保護解除で通過させない。別WUの安全な依存対処または公式修正版が必要。ここでWU-69完了・Windows deploy完了と報告しない。

最終UI code `6a4f9369e230057765f97a4963dfbfae0c221429` に対するlocal typecheck/build/full integration 702 PASS・1 SKIPを再確認。最後のlabel変更は依存・schema・Productionを変更しない。最新PR Verifyはこのcodeを含む証跡HEADで再確認する。
