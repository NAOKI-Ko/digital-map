# 比較実装のQA結果

着手時の `origin/dev` = `abddcb4b8262a2b4cd3a52b8703dfb4b155ff697`。作業中に紙マップPR #7がdevへマージされたため、最終ブランチを `ef88595` にrebaseして再検証した。このブランチの差分は公開UI比較用で、採用・マージ・デプロイは別判断。

- Desktop 1470×702、Chrome viewport 390×844／430×932で、通常→カテゴリー→PIN→概要→詳細展開→閉じるを確認。Desktopは詳細中のパン、回転、復帰も確認。Safari実機は未検証。
- 同じ有松画像・20 Spot位置で、MapLibre実投影の0°／20°／45°を同一center/zoomと角度別fitの両方で比較。暫定推奨20°。45°は上部余白とPIN圧縮が大きい。0°は最も読みやすい代替候補。
- 最終dev基点で、DB接続を設定せず `vitest run`：89ファイル成功、3 skip、610テスト成功、16 skip。`nuxt typecheck`、`nuxt build`、`prisma validate`、`git diff --check`成功。
- 有松公開releaseにはDecorationが0件。dev限定の隔離fixtureで地面図柄、木、画像端の建物、透明余白つき画像を確認。現行の地図面投影では木／建物も傾く。uprightと足元アンカーは別設計が必要。
- QA用 `__qa_arimatsu` APIはdev以外404。比較用assetsはブランチ上の `public/__qa__` にあるので、採用マージ前に除去またはdev専用配信へ移す。
- 録画ツールのffmpeg書き込みが失敗したため、実画面5段階のキーフレーム動画と各スクリーンショットを作業outputsに保存。連続操作の録画ではない。

起動：`pnpm dev --port 3131 --host 127.0.0.1` → `/__qa_arimatsu?decorationFixture=1`。角度比較は `?cameraCompare=1&decorationFixture=1`。実機ではセーフエリア、密集PINの指操作、二本指回転／傾き、復帰、現在地、言語切替、長いフレームを確認する。
