HISTORICAL first69-09 iteration. **11-69-09-VERIFICATION.md supersedes the mobile+1.3 safety claim, repeated badges and first QA counts below. Final whole-floor cap is+.65 at all widths.**

# WU-69 追加要求の実装・検証記録

2026-10-03。対象は未mergeのDraft PR #28にある修正候補。Windows／Productionはこの作業で変更していない。最終Deliveryは必須Verifyを通過するまで完了としない。

## 追加要求

| 要求 | 候補の実装とbrowser検証 | 判定 |
| --- | --- | --- |
| Category | 送り矢印を除去。native横スクロールchip列、端に覗く次chip、fade、薄いscrollbar。左に「すべて」／「クリア」を固定。選択chipは色＋pressed、選択名は省略せず折り返し、カテゴリ数／結果数を表示。 | PASS（browser） |
| Collision count | 既存の小さな20pxbadgeを維持。19／36／3件を実画面で確認。Cluster entityを追加せずgroup件数。dense36は代表押下で+1 zoom、near3はmaxZoomで3本Spiderfy、個別EnterでDetail。 | PASS（browser） |
| Initial camera | 明示的追加要求により以前の0°／20°を0°／25°へ更新。Mobile広域fallbackはwhole-floor fit+1.15（以前+1）。Desktop fallbackは+0.2。上限Mobile+1.3／Desktop+0.65は維持。Overview0°／0°。 | PASS（browser） |
| Outside-map background | visitor共通rendererだけ#eeeae4の淡い暖色neutral。Illustration内の色・画像を変更しない。texture／強い模様／gradientは線画と競合し、PIN以外の視覚的情報を増やすため不採用。 | PASS（browser） |

PlatinumapsからMapを基盤にした下部探索dockと連続したカテゴリ操作、控えめな件数手掛かりを採用。Google Mapsから名称付きchipと選択状態の明示を採用。ブランド表現・写真PIN全面化・Search／Routing／新Category階層は採用しない。前回の実操作Benchmark資料02／03／09に基づく判断で、追加作業で他製品を再操作したとは報告しない。

## 反復Finding

- F23 P2: 全6カテゴリの選択名を折り返す初版でMap controlsとchip列が重なった。dock実測高さに追従するCSS配置へ修正。390x844でdock上端708、controls下端684、間隔24px。390x400は264／240で同じ間隔。
- F24 P2: 768px stage内のcanvasが枠線で766pxになりMobile初期zoomを選んだ。stage幅判定へ修正。768pxでwhole-floor fit+0.2を実測し、境界回帰テストもPASS。
- 追加後のFinding ID24件、F09はNOT REPRODUCIBLE、confirmed23件はcandidateでFIXED。既存F07の矢印方式はユーザー追加要求で再設計。

## QA

390x844: 初期camera bearing0／pitch25／zoom15.7597076464。以前候補15.6097076464から+0.15。横スクロールはnative右scrollでscrollLeft0から末尾へ動作、固定クリアは1clickで全解除。6カテゴリの全名称はAXとscreenshotで確認。keyboard Tabで隠れた先頭chipが表示される。Category変更・クリアはcameraを変えない。寺社Detail→Escapeでcamera保持、元PINへfocus復帰。Overviewはbearing0／pitch0／zoom14.6097076464。

768x1024／1024x768／1440x900／1440x700: 最終修正後の初期camera0／25、fallback zoomは各whole-floor fit+0.2。Category→寺社Detail→Escapeでcamera JSON一致。interaction-results.json内のFINAL responsiveが最終確認結果。初回768結果は修正前の履歴として残す。

Dense36: +1.0000000000 zoom、recovery中のdialog0。Near3: 分離不能なgroupへZoom-inでmaxZoomまで進み、EnterでSpiderfy3本、別一覧dialog0。Spot02をEnterでDetail、Escapeで操作可能canvasへfocus復帰。Floor: Spaceでショップ選択、Enter/Tab/Enterで2Fへ切替、Category保持、canvas名2F、初期0／25。

全テスト685 PASS／18 SKIP。今回の全実行はDB接続なしで、integration等のskipをPASSに含めない。前回の使い捨てDBで702 PASS／1 SKIPは別SHAの履歴。typecheck／build PASS、diff whitespace check PASS。

PublicとLIVE PreviewはともにVisitorMapExperience→MapViewerを利用。今回の4点はこの共通経路へ実装し、Preview固有UI／Admin editorを変更していない。認証LIVEの実操作parityと実機touch／pinch／片手5分／safe-area／browser chromeは今回未実施。reduced-motionの既存経路を変更せず、Categoryはnative scroll＋instant focus reveal、dock配置にanimationを追加していない。追加後のreduce環境での実操作再検証は未実施。

interaction-results.json内のselectedTextフィールドは広いrole=statusのprobeがpage titleを拾った箇所がある。選択名の検証根拠はAXの「歴史・文化・有松絞り・寺社・交通・ショップ・グルメ 6カテゴリ · 20件」とcategory-multiple-390.png／short-390x400.png。誤probeを実測の選択名として扱わない。

## 最終Acceptance

候補の18 PASS／4 PARTIAL／1 FAILと、現行Windowsの1 PASS／14 PARTIAL／8 FAILを混同しない。全23ACの最終delivery判定は前回FINAL-VERDICT.mdのまま（Windows未反映）。今回のcamera契約は最新ユーザー要求に従う25°へ更新。

「旅行中・施設内で片手で5分使ったとき、使いづらさが残るか」: 現行WindowsはYES。追加修正候補も実機5分を未実施のためNOとは判定しない。WU-69全体は未完了。
