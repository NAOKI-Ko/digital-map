# Paper Map Easy Builder v1 wireframes

## Landing

```text
紙マップ
デジタルマップの情報を使って、配布用の紙マップをかんたんに作成できます。
[おすすめで紙マップを作る] [設定して作る]

作成済み紙マップ（静かなtable/list）
名前 | 用紙 | デザイン | 更新 | 編集 PDF出力 複製 削除

もっとデザインにこだわりたい方へ
[デザイン制作を相談する]
```

## New

```text
どんな紙マップにしますか？
[地図を大きく見せる]
[スポット情報もしっかり載せる]
[写真で紹介する]
```

選択後は追加質問を挟まず保存済みPaperMapとPreviewへ遷移する。

## Editor

```text
desktop lg+
┌ Preview (sticky) ───────────┬ 紙マップ設定 ─────┐
│ final geometry scale-to-fit │ このままでOK       │
│ zoom controls               │ [PDFを出力]        │
│                             │ [カスタマイズ]     │
│                             │ collapsed settings │
└─────────────────────────────┴────────────────────┘

mobile
Preview
Settings
```

Settingsは基本、掲載内容、見た目、地図の表示範囲、QR/ロゴの順。自由ドラッグは設けず、custom viewport rectangleだけを空間操作とする。保存/キャンセルとdirty guardを常時維持する。

## Managed design

用途、用紙、印刷面、折り、雰囲気、要望、希望納期、任意のrelated PaperMapを収集し、`REQUESTED`として永続化する。v1は受付完了までで、operator CRMやhardcoded recipientを作らない。

