# Paper Map — QA証跡と再現条件

2026-09-22。対象コード `612efd0`。基準 `abddcb4b8262a2b4cd3a52b8703dfb4b155ff697`。**技術QA PASS / 実データ最終受入 PENDING**。

## 検査範囲

指定baseのPaper UI、Prismaモデル/SQL、API全経路、source loader、一般Map PDF、Paper Preview/PDF、schema/config migration、WU-57/WU-58設計・product contract・QA記録・生成PNG/PDF・テストを調査した。61ファイルのbase内容hashは `evidence/base-surface-inventory.json` に記録。現在のworking-tree inventoryと混同しない。

WU-57の既存PDFは地図未設定placeholderと番号を含む。WU-58の3 targetは生成済みPNG/PDFと専用SVGスクリプトを確認し、製品renderer経由でないこと、PINなし/任意の件数の見本であることを確認した。これらの既存PASSを新しい製品品質の証明として再利用していない。

## 自動検証

| 検証 | 結果 | 証跡 |
|---|---|---|
| full tests | 90ファイル、602件PASS、skip 0 | full-tests-final.log |
| typecheck | PASS | typecheck-final.log |
| build | PASS | build-final.log |
| Prisma validate | PASS | prisma-validate.log |
| migration deploy | 既存31 migrationを新しい2つのQA DBへ適用成功。新規migrationなし | current-migrations.log |
| Tenant境界audit | 未解決anomaly 0 | audit-tenant-final.log |
| IMAGE空間audit | 不正floor/reference/partial/outside/published-unpositioned 0 | audit-spatial-final.log |
| Paper audit | orphan 0、invalid request/config 0 | audit-paper-final.log |
| default fields audit | PASS | audit-fields-final.log |
| dependency audit | pnpm audit --prod --audit-level high: 既知脆弱性0 | audit-dependencies.log |
| git diff --check | PASS | commit時・証跡作成時に確認 |

buildには既存規模のchunk size、plugin timing warningがある。エラー0。「warningも0」とは主張しない。

full testsが作るpublication fixtureは標準Spot fieldsを作らないため、そのままdefault fields auditへ掛けた最初の実行はFAILした。使い捨てQA DBの全Mapへ既存のensureDefaultSpotFieldDefinitionsを適用後、再実行PASS。canonical DBの修復やSource変更ではない。

新規回帰テストは、明示版切替、500 Spot/3 floorの欠落なし、A4/A3×縦横×3形式のbounds、guide非表示、紹介文の出所、Unicode、既存PIN/crop、空Source、同一描画、300dpi寸法、freshness token、地図欠損を対象とする。座標を作る単体テストfixtureは合成幾何テストであり、事実として配布する紙面には使用していない。

## API QA — 23項目PASS

実際のHTTP APIを使用。匿名401、割当editor200、未割当member/Spot editor/別Tenant404。Paper作成、Preview、PDF、保存、複製、削除を検証。Source全体を前後比較し、Paper作成・編集・Preview・PDFでSource不変を確認。foreign references/未知templateを422で拒否。

使い捨てDBにREADYを作成し、ローカルQAの説明文だけを一時変更したうえで、LIVEは変更後、PUBLISHEDはsnapshotのままであることを確認。Preview後のSource変更はPDF409。公開停止中もREADYは使用可能だが、新版のQRは省略。説明文を元に戻した。リモート/Productionで公開状態を操作していない。

`api-qa.json` は結果一覧。freshness tokenは認証ではなく、読み取ったSource/configが最新かを検出するhashである。権限は既存requireMapAccessとmapId付きPaper取得が担う。画像URLの参照先バイトだけを同名で上書きした場合までは検知しない。

## Browser QA

Current devを指定baseから別ディレクトリへ展開し、依存を独立install、別QA DB/3019番で実行した。Astraは3018番。Chromeをagent-browserで実操作し、Playwrightスクリプトで再現可能な証跡を保存した。

- 新規完成Preview→作成、Paper Original保存/再読込、Spot override保存/再読込/非表示/復帰/reset、custom viewport操作/保存、LIVE/PUBLISHED再取得、実PDFダウンロード。
- 1440×900、1280×800、1024×768、390×844、430×932。全てdocument scrollWidthがviewport幅と一致。
- Current dev/Astraとも最終実行のconsole/page error 0。
- Astraは完成ビルドのNode serverでも同じ11チェックを再実行PASS。`NUXT_DEPLOYMENT_ENVIRONMENT=development`、local HTTP、fake mailを使うQA設定。最初の起動は既存のProduction HTTPS必須guardにより停止し、そのguardは変更していない。
- screenshotの最終版は `evidence/browser-built/`。Current devは `evidence/current-browser/`。実機Safari、支援技術、視覚障害者による利用性は未検証。

検証中に見つけて修正したもの: mobile操作バーがbackdrop-filterの包含ブロックに入る問題、SVGのpt指定による二重DPI拡大、guideで10件が2ページに分かれる初期配分。最終版で再検証した。PlaywrightのSSR hydration待ち不足による初期ログイン失敗は検査側の待機処理を修正した。

## PDF visual QA / 一致

3形式×2版の製品PDFを同一のQA Source DTOから生成し、pdftoppmで全6ページをレンダリングして目視した。Astraは3形式とも1ページ、欠け・重なり・枠外流出なし。写真がないのでphoto-storyは文字fallbackのみ。これを写真レイアウト合格とは扱わない。

Current devの文字の小ささ、Astraの名称11pt/本文9.5pt、地図と案内番号の対応、crop、余白を確認。Astraの和文改行は簡易幅計算で、行頭句読点が残る。印刷完成度の未解決点として記録する。実寸試し刷りは未実施。

3形式ともPDF内の唯一の画像を抽出し、同一Source/configを共通rendererで300dpi出力したPNGとRGB画素が完全一致。A4横3508×2480、縦2480×3508。画面Previewは同じplanを150dpiで描くので、解像度・アンチエイリアス差はある。`preview-pdf-equality.json` に結果。

## データの扱い

技術QAには既存 `team-demo-arimatsu` の10 Spot/6 category/1 floorを用いた。元の名称・説明・既存x/yを維持し、QA複製内で公開可能にした。元seedのダミー写真URLは除去した。写真・PIN・道路・経路を新規生成していない。実在情報として再確認したデータではないため、成果物フォルダも `qa-fixtures-not-customer-data` と明示する。

両DBのcategory/field定義IDはseedで別々に採番される。これらのIDだけを除くと全DTOが一致する。PDF6種はAstra QA DBから取得した同じ1つのDTOを両rendererへ渡して比較している。ハッシュと数量は `04-source-inventory.md`。

## 再現と互換性

既存のローカルPostgres内に新しい使い捨てDBを作り、DATABASE_URLをそこへ限定してinstall/migrate/seed/test/auditする。canonical `digital_map` に破壊的テストを向けない。再現補助スクリプトはQA evidence bundle内。ブラウザー補助はこのタスクのローカルパスを前提とするので、他端末ではパス・Chrome・DB名を調整する。

templateVersion 1のrendererは旧関数名のみ変更して保持。configVersion 2のJSONにtemplateVersion 2を追加し、新規を2にする。旧保存物は自動移行しない。**旧コードはtemplateVersion 2を読めないため、共有DBで新版保存後のcode-only rollbackは安全ではない。** 導入時は2のPaperレコードを保全して戻す運用が必要。今回は使い捨てDBだけを変更した。

## 未完了の受入条件

Windows QAの実データ・実写真の読み取り複製許可、実データPNG/PDFの全ページQA、実写真/ロゴ/装飾の組合せ、Windows rendererのフォント差、実機mobile、実寸印刷、顧客の配布可否、負荷・容量改善。これらをPASSと表示しない。
