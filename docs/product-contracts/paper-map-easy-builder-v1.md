# Paper Map Easy Builder v1 product contract

## Promise

デジタルマップを作れば、紙マップまで別に作り直さなくてよい。非デザイナーが「80点を3分」で配布可能な紙マップを得られることを優先する。自由配置、任意フォント、折り加工DTP、Canva連携は対象外とし、選択式の調整を越える要望は「デザイン制作を相談する」へ案内する。

## Flow

1. 紙マップ一覧で「おすすめで紙マップを作る」を選ぶ。
2. `地図を大きく見せる`、`スポット情報もしっかり載せる`、`写真で紹介する` のいずれかを選ぶ。
3. 配置済みSpot、写真数、公開状態から決定的な推奨設定を作り、直ちにPreviewを表示する。
4. そのままPDFを出力するか、「カスタマイズ」で選択式設定を開く。
5. 保存は明示操作。PDFは検証済みの現在draftから生成し、暗黙保存しない。

## Content and source contract

- `LIVE` は現在の管理データを使うが、紙面へ出す項目は公開用途のField Definitionだけに限定する。
- `PUBLISHED` はcurrent READY PublicReleaseのimmutable snapshotを使う。利用不可なら選択不能と理由を示す。
- 未配置Spotの座標を捏造しない。削除済み参照はwarningとして読み込み可能にし、render時のみ安全に除外する。
- Spot番号はPaperMap内の順序から導出し、Spot/PIN identityを変更しない。
- 40件超は警告し、黙って切り捨てない。凡例が収まらない場合は追加ページを生成する。

## Permissions

Tenant OWNERとassigned Map EDITORはCRUD、PDF生成、相談送信が可能。Spot Editorとcross-Tenant accessは拒否する。UI非表示だけに依存せず、全endpointで既存Map access guardを使う。

## v1 boundaries

A4/A3、縦/横、3 layout、3 map-size semantics、3 density、3 photo modes、3 order modes、QR、既存logo、4 themes、3 viewport modesを提供する。CMYK、bleed、crop mark、B判/A2、任意配置、font picker、raw CSS/hex、Canva API、案件管理dashboardは含めない。

