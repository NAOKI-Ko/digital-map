# Paper Map — Astra Design v2 最終報告

2026-09-22。**RECOMMEND-PARTIAL-ADOPT**。有松の実データによる設計・実装・QAを完了し、Draft PR #7でレビューできる状態にした。全面採用・マージ・リリースは推奨しない。前回の「読みやすい自動レポート」から、地域の写真・カテゴリー・ロゴを使う配布用紙面へ改善したが、実顧客評価・実機印刷・山岳/レジャーの実データ検証は残る。

## 1–4. 判定・基準・ブランチ・PR

1. **RECOMMEND-PARTIAL-ADOPT**。共有rendererと出所分離を採用候補とし、有松デザインは限定導入。ドメインテーマ全体の一般提供は保留。
2. Base dev: `abddcb4b8262a2b4cd3a52b8703dfb4b155ff697`。
3. Branch: `experiment/astra-paper-map-product-pass-20260922`。前回head `7218f755d9dc0d2cb9f1ae19ec17dc1bdd6b2da8`。今回の実装SHA: `1dd5482b8d75baed5ff00c3632eb260acde45a30`。証跡commitはPRと最終チャットに記録。
4. [Draft PR #7](https://github.com/NAOKI-Ko/digital-map/pull/7) を継続。Draftを維持し、mergeしていない。

## 5. 前回から変更した点

「読みやすい文字＋2列」で配布したくなる品質を作れるという仮説が足りなかった。茶色の番号丸・細い罫線・小さい写真の汎用レポートを、藍/暖色紙・明朝見出し・実写真・カテゴリー画像・強い地図構成へ変更。レジャーは大きな写真と丸いカード、山岳は地図60%とガイド下の写真にした。

固定slot、Source不変、LIVE/PUBLISHED再取得、stale PDF拒否、物理ptの文字、全件改ページ、Preview先行のモバイルは継承。新デザインはtemplateVersion3。既存v1/v2を開く・保存するだけでは出力を変更しない。

## 6. 構造とテーマの判断

**組み合わせを制限するhybrid catalog**。構造・theme token・source・Paper編集は内部で分離し、顧客には検証済み6デザインだけを提示する。全面的に結合したテンプレートは改ページ/出所処理が重複し、自由な全組合せは視覚QAが増えすぎる。構造ごとの例外も必要であり、単なる色差替えで全ドメインを賄えるとはしない。

configVersion2は継続。templateVersion3 / themeVersion1 / systemVersion1。新デザインへの明示的な変更でのみ移行する。Prisma/migration、依存パッケージ変更なし。

## 7. カタログ

| 顧客向けデザイン | 構造 / theme | 初期用紙 |
|---|---|---|
| 藍のまち案内 | map-classic / heritage | A3横 |
| まちの小さな読本 | photo-story / heritage | A4縦 |
| カラフル・スポットガイド | photo-story / leisure | A3横 |
| マウンテン・アトラス | map-classic / alpine | A3横 |
| すっきり地図案内 | map-classic / neutral | A3横 |
| 読みやすい地域ガイド | spot-guide / neutral | A4縦 |

6種類×2用紙×2方向を自動試験。推奨は明示されたカテゴリー名と件数に基づく。写真適合性は写真付きSpot率で説明する。曖昧なドメインはneutral。runtime LLMは使わない。

## 8–11. 成果物とSource Inventory

| 対象 | PDF / 全ページ画像 / Inventory | 頁 | 容量 | PDF生成 |
|---|---|---:|---:|---:|
| 有松A3・実QAデータ | [PDF](../docs/qa/astra-paper-map-product-pass-v2/heritage-A3-landscape/heritage-A3-landscape.pdf) · [画像](../docs/qa/astra-paper-map-product-pass-v2/heritage-A3-landscape/all-pages.jpg) · [出所](../docs/qa/astra-paper-map-product-pass-v2/heritage-A3-landscape/source-inventory.json) | 1 | 3.316 MB | 831 ms |
| 有松A4・同じ実QAデータ | [PDF](../docs/qa/astra-paper-map-product-pass-v2/heritage-A4-editorial/heritage-A4-editorial.pdf) · [画像](../docs/qa/astra-paper-map-product-pass-v2/heritage-A4-editorial/all-pages.jpg) · [出所](../docs/qa/astra-paper-map-product-pass-v2/heritage-A4-editorial/source-inventory.json) | 4 | 4.464 MB | 952 ms |
| レジャー・架空QA | [PDF](../docs/qa/astra-paper-map-product-pass-v2/leisure-synthetic/leisure-synthetic.pdf) · [画像](../docs/qa/astra-paper-map-product-pass-v2/leisure-synthetic/all-pages.jpg) · [出所](../docs/qa/astra-paper-map-product-pass-v2/leisure-synthetic/source-inventory.json) | 2 | 1.864 MB | 385 ms |
| 山岳・架空QA | [PDF](../docs/qa/astra-paper-map-product-pass-v2/alpine-synthetic/alpine-synthetic.pdf) · [画像](../docs/qa/astra-paper-map-product-pass-v2/alpine-synthetic/all-pages.jpg) · [出所](../docs/qa/astra-paper-map-product-pass-v2/alpine-synthetic/source-inventory.json) | 1 | 0.954 MB | 169 ms |

ここは最終artifact生成時の1回値。下の性能比較は3回中央値。全PNGはタスクの`outputs/design-v2/`の各対象フォルダーに保存。

有松は許可範囲内でWindows QA `有松マップ｜ふぉん` のDTOと参照assetだけをread-only取得。20公開・配置済みSpot、6カテゴリー、16写真付きSpot、13assetをhash管理。Windows deployed SHAは `75ebb766ffb4d3052fc81788326707d5928e7aa9`、コード比較baseは指定SHAのまま。ユーザー・認証・private field・AuditEvent・Revision等は取得しない。

元の5種類の写真が複数Spotに再利用されている。現地で撮った正しい店舗写真だと独自に保証しない。PIN座標も既存QA位置で、地理的に検証済みではない。LIVEの20件と現在の公開snapshotは別で、QRの有効性は内容の同期を保証しない。Synthetic2対象は全てQAと明示し、実ブランドや外部写真を使わない。

## 12. 写真・カテゴリー

同一Spotの登録済みmanaged写真のみ選択。別Spotの写真は保存APIで422。画像は中央crop・上限240dpiへ縮小・拡大補間なし。写真なしは必要な文字高のカード。消えた選択写真は現在の同Spot写真へfallbackし警告。地図画像欠損は422でPDFを止める。

Category画像を凡例/カードに使用。Kanji presetは元の記号、Material presetは元presetの日本語文字バッジにfallbackする。Material glyphの完全再現は未実装。ロゴと既存Decoration/geometryもSourceのまま。紙面の番号は位置参照であり経路ではない。

## 13. 編集UX

完成Preview→必要なslotだけ調整。タイトル/サブタイトル/導入/案内見出し/お知らせ/QR案内/フッターがPAPER_ORIGINAL。Spotの紹介だけがPAPER_OVERRIDE。出所の文章表示とresetを用意。写真選択、hide/show、順番、用紙、視覚的viewportを制約内で変更できる。自由配置、自由フォント、任意HTML/CSSはない。

DesktopはInspectorとPreviewを並べ、選択slot/Spotを枠で示す。MobileはPreviewを先にし、固定PDF/保存bar、拡大、文章表示、名前付き操作を用意。初期デザインの作成ボタンは6択の下までスクロールせず使える位置へ移した。

## 14. Preview/PDF

共通document plan → 共通SVG。PreviewはPNG150dpi、PDFはJPEG94/4:4:4/240dpi。版・Source・configからfreshness tokenを作り、確認後に内容が変わればPDF APIは409。画像化PDFなので完全に同一画素ではない。最終8頁のPDFラスタ/Preview比較PSNRは25.54–31.92dB（解像度・アンチエイリアス差を含む）。改ページ・内容・位置の検証とは分けて評価する。

## 15. 性能

同じ有松20件/A3横/同一マシン、各3回中央値。Current devは指定baseの別checkoutで実行。

| | Current dev | 前回Astra | 今回Astra |
|---|---:|---:|---:|
| PDF | 3.164 MB | 20.561 MB | 3.316 MB |
| PDF生成 | 357 ms | 2053 ms | 755 ms |
| Server Preview | 対象外・client描画 | 374 ms | 469 ms |
| PDF画像 | 4961×3508 | 4961×3508 | 3969×2806 |

前回比で容量83.9%減、生成63.2%短縮。Current dev比では容量4.8%増、生成2.1倍。本文9.5ptは維持。Preview転送量と6サムネイル生成、サーバーmemoryは残る費用。memoryの取得値は連続処理のcacheを含むため、v3単独peak改善を主張しない。

## 16. Automated QA

**91 files / 619 tests PASS**。全組合せ、全件掲載、境界、Source不変、同一Spot写真、欠損fallback、長い日本語、version、reactive draft変更、determinism等を含む。typecheck/build/Prisma validate PASS。Paper/geometry/Tenant/default fields監査PASS。依存auditは既知脆弱性0。

API回帰23チェック＋新版15assertions。RBAC/Tenant拒否、LIVE/PUBLISHED、READY固定、公開停止時QR省略、stale拒否、paper編集後Source digest一致。全てローカル専用DB。既存v1 PDFは指定baseと同じSource/configで150dpi画像が画素一致。v2 rendererは前回headから変更なし。

## 17. Browser QA

1440×900 / 1280×800 / 1024×768 / 390×844 / 430×932で作成前Preview、実出力6サムネイル、作成、編集、写真、順番、hide/show、reset、keyboard viewport、保存再読込、Source/デザイン切替、PDF downloadを確認。横overflow0、最終console/network error0。途中で発見したVue reactive draftのDataCloneErrorは修正し、回帰試験を追加。

## 18. Visual QA

有松A3:第一印象4/可読性4/印刷4/出所5。A4:4/4/4/5。レジャー:3/4/4/5。山岳:3/4/4/5。12項目全評点・複数passの批評は[QA.md](../docs/qa/astra-paper-map-product-pass-v2/QA.md)。全4対象で2回以上の改善と最終全8頁のPDF visual確認。観測範囲でP0/P1の重なり・意図しない切れなし。

A4の地図はA3より小さく、map readability3。実データ写真の反復、synthetic素材、山岳の弱い独自性は減点した。QRはA4全頁150dpi、A3は300dpiのPDF画像からSource URLへdecode成功。A3の150dpiではdecodeできず、実機カメラ成功率は未検証。

## 19. Accessibility

Preview画像のtitle/page label、named slot、keyboard選択、ページ操作、画像外の文章/Spot一覧を実装。main領域のaxe WCAG2A/AA/2.1AAは5サイズで違反0。pixel clickは必須でない。タグ付きPDF・音声読み上げPDF・検索可能なPDF文字は未対応。実機Safari/スクリーンリーダー認証ではない。

## 20. Current dev / 前回Astra / 今回Astra

| 観点 | Current dev | 前回Astra | 今回Astra |
|---|---|---|---|
| 初回作成体験 | 作成後に簡易Preview | 保存前の完成Preview | 実データ6サムネイルと理由付き推奨、保存前Preview |
| 紙面デザイン品質 | 小さい本文、別SVGのdesign targetとの乖離 | 物理文字で読みやすいが汎用レポート | 実写真・藍/明朝・category/logo、全8頁検証。ドメイン成熟度は限定 |
| 操作量 | 最短2操作、出力後の修正負担 | 最短2操作 | 推奨なら2操作維持、任意でデザイン選択+1。削減を実測したとはしない |
| 出所の明確さ | 三分類はある、切替Sourceの再取得不足 | 実Source再取得/token | 同左＋same-Spot写真選択、文章表示、asset hash inventory |
| 編集自由度 | slot/紙文/選択/viewport | 同枠組み、名前付きInspector | notice/見出し/写真/順序/クリックslot。DTP化なし |
| Preview/PDF一致度 | 別描画・文字/overflow差 | 共通SVG＋lossless raster | 共通plan/SVG、JPEGにより容量削減。画素完全一致ではない |
| モバイル | 設定が先 | Preview先・固定bar | 同左＋文書テキスト/keyboard/写真。5幅QA |
| 実装複雑性 | 小さいが描画重複 | legacy＋新版renderer | さらにversion3と6限定designを追加。新renderer・slot連携・catalog契約・回帰testsによりコードとQA負担は増加 |
| 将来の保守性 | Preview/PDF別々の修正 | plan共有、物理寸法 | bounded catalogと契約tests。ただし3世代renderer、font/codec/負荷維持が必要 |

## 21. 採用すべき範囲

共通plan/renderer、物理文字、Sourceの明示/不変、実Source再取得、stale拒否、全件改ページ、same-Spot写真制約、Preview先行と画像外の文章。今回の軽量PDFとheritage2形式は限定的な顧客確認へ進める価値がある。枠組みの全面置換ではなくversion3 opt-inとして評価する。

## 22. まだ採用すべきでない範囲

山岳・レジャーを実顧客で検証済みの専門テンプレートとして一般提供すること、全組合せtheme/layout UI、旧版自動移行、runtime文章生成、任意画像URL入力、自由DTP、現地未検証のQA写真/PINを配布用の正確な地理情報として扱うこと。

## 23. 残るリスク

実データ写真が5種に集中、元画像解像度の制約、A4地図密集、host font差、未タグPDF、Server Preview容量/CPU/memory、実機印刷/QR未検証、6択の認知負荷とサムネイル待ち時間。今回の評点は作者による検証であり顧客評価ではない。LIVEと公開snapshotの更新時点差と一時QR URLは運用上の確認が必要。

## 24. 保護対象

`dev`は指定SHA、`main`は`a58b4353bd108e6586f329080c772f69b8aaffda`のまま。merge/deployなし、Production変更なし。Windows QAはread-only、PIN/geometry/Source更新なし。ローカル隔離fixtureでのみ作成・公開・編集・削除を試験した。成果物確定後、一時DTO・13素材のコピー・ローカル公開snapshot・隔離Mapを削除済み。空のQA組織とappend-onlyのローカル監査記録は保護を維持して残した。cleanup証跡を保存。
