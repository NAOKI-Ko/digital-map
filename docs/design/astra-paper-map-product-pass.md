# Paper Map — 顧客・完成紙面からの設計

基準: `NAOKI-Ko/digital-map`, `origin/dev @ abddcb4b8262a2b4cd3a52b8703dfb4b155ff697`。2026-09-22。実装前の設計判断。顧客調査の実測と、仕様・コード・成果物からの仮説を区別する。

## 1. 現状の構造と評価

PrismaのPaperMapはMap配下の独立したversioned JSON。PaperDesignRequestは制作相談。APIは既存requireMapAccessを使用し、recordをmapIdで限定する。LIVEは公開用途に許可された現在データ、PUBLISHEDはcurrent READY PublicReleaseのsnapshot。SOURCE / PAPER_OVERRIDE / PAPER_ORIGINALを分離し、選択・順序・viewport・slot表示を保存する。この境界は維持する価値がある。

入口は一覧→3テンプレート選択→保存済みレコードのeditor。テンプレートはmap-classic / spot-guide / photo-story。紙専用のタイトル・本文・Spot紹介文を変更でき、任意配置はない。既存の強みは安全なsource分離、固定template、明示保存、座標の共通化、既存権限の再利用。

実装と証跡の検査で見つかった問題:

| 所見 | 製品への影響 | 証拠 |
|---|---|---|
| WU-58 targetは専用手描きSVGであり製品rendererを通らない | 見本の品質が実際の出力を保証しない | scripts/qa/render-wu58-targets.ts |
| Previewは96dpi座標に固定pxの文字・marker、PDFは300dpiに別の固定px | PDFはPreviewより文字が小さく、行数・折り返しも異なる | PaperMapPreview.vue / paper-map-pdf.ts |
| Previewの切抜きは画像全体を小さく置き、PDFはextractする | custom cropとPINの背景上の位置が一致しない | 同上 |
| PreviewにDecorationなし、QRはダミー図形 | 完成品確認として信頼できない | 同上 |
| Previewは最初の7/12項目、PDFは別の容量で追加ページ | 掲載漏れや枚数を出力前に把握できない | 同上 |
| overflowは追加1ページだけ、その中でもslice | 大量データで選択したSpotが消え得る | renderOverflowPage |
| LIVE/PUBLISHEDの選択変更で表示sourceを取り直していない | 公開版のつもりで現在データを確認する恐れ | editor / source loader |
| editorはmobileでも設定がPreviewより先に並ぶ | まず完成紙面を見る目的に逆行 | editor grid |
| missing logo等を警告しつつmissing mapでもPDFが出る | 重要度が逆転し、配布可否の判断を妨げる | warnings / PDF fallback |

WU-57/58の既存PASSは、その時点の検査範囲の記録として尊重する。実データによる完成品質・Preview一致・印刷時文字サイズの証明とは扱わない。既存WU-58の16件baselineは座標・写真がなく、見本では任意の先頭6/8/10件を使用する。新比較では同一source・同一selectionを固定し、製品rendererから全ページを生成する。

## 2. 顧客理解 / JTBD（仮説）

対象は既存要件にある商店街組合、観光・旅館組合、施設管理者の非デザイナー担当者。利用者は窓口・店舗・施設で紙を受け取る来訪者。直接のインタビュー、業務観察、支払意思の検証は未実施。

**主JTBD:** 「窓口で渡す案内が必要になったとき、管理済みの地図情報を使い、デザインや転記をやり直さず、間違いなく読める紙を用意したい」。

| 場面 | 既存作業の仮説 | 不満の仮説 | 完成品で満たすこと |
|---|---|---|---|
| 観光窓口で日常配布 | 店舗情報収集→コピー→レイアウト→確認→印刷 | 二重更新、差し替え忘れ、見た目の判断が難しい | 1枚目だけでも地域・地点対応がわかる |
| 店頭・宿で目的に合う案内 | 全体地図から対象を選び説明を補足 | 小さすぎる文字、情報過多、不要な施設 | 元の事実を読みやすく選択・組版 |
| 写真で場所の魅力を紹介 | 写真依頼→選定→トリミング→配置 | 写真不足、毎回の配置作業 | 既存写真を地点と結び、ない写真は省略 |
| 改訂・担当交代 | 前任者のファイルを探す→更新箇所確認 | 最新版と元情報が分からない | 保存された用紙設定、出所、全ページ確認 |

成功の目安（今後の顧客検証用）: 内容が整ったsourceから無編集で完成紙面→PDFに到達できる、作成後の必須入力0、文字組・PIN移動の手作業0、選択Spotの消失0、初回利用者5名中4名が3分以内に配布可否を判断。最後の指標は今回の自動QAでは検証できない。

## 3. 代替手段との比較

| 手段 | 強み | 想定される負担 | Paper Mapが勝つべき部分 / 譲る部分 |
|---|---|---|---|
| Canva | 豊富な素材と任意の視覚表現、地図デザインを印刷物へ利用可能 | 自社Spotの転記、正確性・配置・更新の管理 | データ再利用と自動組版で勝つ。表現自由度は譲る |
| PowerPoint | familiarな編集、用紙・印刷設定、図と文章の調整 | 地図と番号の対応、ページごとの手動整形 | 無編集での完成度と継続更新で勝つ。手直しの自由は譲る |
| デザイン会社 | ブランド表現、取材・入稿・複雑な折り加工まで相談可能（契約による） | 発注・素材収集・校正・変更依頼 | 日常改訂の速さで勝つ。独自意匠と印刷入稿保証は譲る |
| Web地図を印刷 | すぐ出せる、画面上の位置関係を利用 | 画面UIが紙面に残る、説明と地図の編集関係が弱い | 読む順序、番号索引、説明、余白、全ページ確認で勝つ |

確認した一次情報: [Canva Map Maker](https://www.canva.com/create/maps/)、[PowerPointのサイズ変更](https://support.microsoft.com/en-us/powerpoint/change-the-size-of-your-powerpoint-slides)、[PowerPoint印刷](https://support.microsoft.com/en-au/powerpoint/training/print-your-powerpoint-slides-handouts-or-notes)、[Google Mapsの印刷](https://support.google.com/maps/answer/11471036)。作業負担・優劣は機能の転記ではなく本タスクでの分析。価格・所要日数は推定しない。

## 4. Product Thesis

**Paper Mapは、既存Digital Mapを配布用の完成紙面へ組版する機能。利用者の主な仕事は、完成形を見て配るか判断すること。**

Sourceの量・画像比率に合う初期値を決定的に選ぶ。足りない事実は補完しない。写真不足は空欄の装飾枠にせず、文字の組版へ戻す。地図画像がない場合は配布可能と扱わない。テンプレート選択より先に実データ入り完成形が見える。画面には枚数・用紙・掲載数・source・紙専用変更の有無を示し、紙面には来訪者が読む内容を置く。

成功は設定数では測らない。文字が読める、番号で地図と説明を往復できる、必要な地点が落ちない、PDFを見て驚かないことを優先する。CMYK、裁ち落とし、折り、自由配置、runtime LLM、事実生成は対象外。

## 5. 最終紙面の3パターン

| パターン | 読む順序と紙面 | 初期値 | 欠損時 |
|---|---|---|---|
| 地図を主役に / map-classic@2 | タイトル→大きな地図→対応番号の簡潔な索引→Web案内。横用紙の左右構成 | A4横、全体viewport、名前中心。17件以上ならA3 | 地図未読込は出力不可。ロゴなしは余白。写真不要 |
| スポットガイド / spot-guide@2 | タイトル→地図→2列の番号・名称・説明カード→Web案内。説明は固定長切捨てでなく幅に合わせ改行 | A4縦、17件以上ならA3、detail。入りきらない分は全て続きのページ | 説明なしはカテゴリーのみ。営業時間などを勝手に説明へ転用しない |
| 写真で紹介 / photo-story@2 | 地図で位置を把握→実写真と番号・名称・説明を同じカード内で読む | A4/A3縦。写真があるSpotのみ写真を使う | 写真なしのSpotは文字カード。写真が乏しいsourceにはguideを推薦 |

共通品質: 本文原則9pt以上、タイトル最大2行、物理寸法ベースの余白、全ての選択Spotを紙面planに含める、写真と名称の対応を保つ、番号はdocument全体で安定、フロアごとに地図を持つ。複数ページはPreviewで切替可能。文章短縮があれば編集UIに件数を示す。

## 6. Source Inventory

| 紙面情報 | データ元 | 使用パターン | 欠損 / 編集規則 |
|---|---|---|---|
| タイトル | Map.nameを初期値とするPaper Original | 全て | 紙専用入力。Sourceへwriteしない |
| サブタイトル / 導入 / フッター | Paper Original明示入力。未入力時の組織名はSource | 全て | 導入・フッターは空なら省略。生成copyなし |
| 地図の線・道路・背景 | MapFloor.illustrationUrlの既存画像 | 全て | 新たな道路・経路を描かない |
| PIN位置 | 公開用途DTOの既存x/y + floorId | 全て | 未設定座標を推測しない。元座標変更0 |
| Decoration | 既存image/width/rotation/x/y | 全て | viewport内でclip。位置を再配置しない |
| Spot番号 | selection/orderから決定的に導出 | 全て | 案内番号。経路順・訪問順を意味しない |
| Spot名 / category | 既存公開用途Spot・Category | 全て | 名称は勝手に短縮・言換えしない。収まらない場合は明示 |
| 説明 | 公開用途description、または明示Paper Override | guide / photo | 未設定なら省略。最初のfieldを説明へ流用しない |
| 住所・時間・連絡先 | 公開用途informationFieldsのlabel/value | guideの必要時 | 原文のみ。追加掲載は将来の検証対象。今回勝手に補完しない |
| 写真 | 既存Spot.photosの管理メディア | photo | 同じSpotに紐づく写真のみ。新規画像生成0 |
| ロゴ | Map.logoUrl | 全て | 未設定は省略 |
| QR | 既存public base + map.slug | 全て | 実QR。公開停止・releaseなしは利用不可を明示 |

データセット毎にsnapshot hash、取得元、取得日、画像hash、LIVE/PUBLISHED、件数をQA inventoryへ記録する。QA用座標が既存データに含まれる場合は、その事実を明示し、地理的な正確性を検証済みとはしない。

## 7. Desktop / Mobile UX

新規: 実データ入りの推薦紙面を大きく表示→「この紙面で作る」。他2種類は切替。空sourceでは理由とSpot編集への導線。作成前に用紙・枚数・掲載数が見える。

Editor desktop: Previewが主領域、任意の調整は横。PrimaryはPDF、保存は紙設定の保存として意味を分ける。編集項目には「紙だけの文章」「Digital Map由来」を示す。元データへの変更は別リンク。LIVE/PUBLISHED切替はsourceを再取得し、切替中とエラーを表示。

Editor mobile: 完成紙面を先に、調整はその下。stickyなPDF/保存操作、44px以上の主操作、ページ切替と拡大。細かい領域へのタップを必須にしない。slot選択は名前付きボタンでも可能。横overflowなし。

印刷前: ページ数、掲載Spot数、短縮件数、sourceモード、使用不能assetを表示。missing logoはエラーにしない。mapなし・空sourceはPDFを許可しない。warningは配布可否に関連するものだけにする。

## 8. 技術設計・採否基準

- configVersion 2を維持し、templateVersion 2を追加。既存templateVersion 1を黙って置換しない。新規は2、旧紙面は明示的に新版へ変更できる。
- 物理pt単位のdocument planで全ページ、カード、文字行、map viewport、番号を決定する。データ取得と組版は分離したpure関数。
- Serverで同じSVG/asset構成からPNGを生成し、同じページ画像をPDFへ格納。Previewもこの製品renderer経由のPNG。別の見本生成器を作らない。
- Preview APIは認証・Map guard・config検証を通す読み取り専用POST。保存しない。ページ番号指定で必要なページを返し、全体枚数を返す。clientはdebounceと最新request判定を持つ。
- 既存source loader、publicVisible制御、READY snapshot、Prisma schema、Tenant/RBACを維持する。新たなSource writeを追加しない。
- assetは既存管理storage loaderで取得し任意外部URL fetchを増やさない。map欠損は明示エラー。photo欠損は省略・警告。
- PDFは全ページ生成。文字の縮小で帳尻を合わせず、必要なら続きページ。hide guide時に隠した内容をoverflowに出さない。
- QAは同一snapshotでCurrent dev製品PDFとAstra製品PDFを比較。Browser実操作、全PDFページ目視、座標/切抜き・ページ数・source切替・権限の回帰、全tests/typecheck/build/auditsを実施。

重大なProduct Decision: 今回の範囲に実装停止が必要な選択はない。上記は独立実験branch上でレビュー可能にする。商用入稿保証・顧客検証・正式採用は今回のQAのみで断定しない。最終的にRECOMMEND-ADOPT / RECOMMEND-PARTIAL-ADOPT / RECOMMEND-KEEP-CURRENTを証拠から選ぶ。
