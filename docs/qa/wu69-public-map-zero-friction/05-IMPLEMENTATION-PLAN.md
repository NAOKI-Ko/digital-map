# WU-69 implementation and scope

正本は `ASANA-AUTHORITY.json` の親本文・AC・Out of Scope・69-01〜08。既存dev `ad4f4bde269b16c5575b836add444b5e6fa88399` に対して、同じ作業チェックアウトを使った。新機能・domain・schema・migration・Productionの変更はない。

1. F01〜04: visitor初期camera、Map/Floor文脈、密集badge、Detail camera保存/復帰。UI flagsはvisitorのみ。
2. F05〜10: 固定解除、選択文脈、Category送り、下部control、「全体」。Mobile +/-は実画面で不要と判断し非表示。native double-tap/double-clickとkeyboard Zoom経路を維持。実機pinchは別ゲート。
3. F11〜17: selected/focus時の名前、loading/error、内容に応じたSheet高さ、expanded→collapse→close、連続Zoomの入力蓄積、日本語ラベル。
4. F18〜21: 実ブラウザーで見つかったspiderfy optional flag不具合、重複Tab、上端PIN/name切れ、ResizeObserver再計測を回収。
5. 5幅、short viewport、keyboard、reduced motionを確認。DB監査は新規disposable DBのみで実行。PR/Verify後、成功した場合のみdev merge・post-merge Verify・Windows exact SHA・最終black-boxへ。

priority `selected > active Category > featured > normal > viewport-center > stable ID`、Map-only staged recovery、maxZoom spiderfyの分離ロジック、initial0/20、overview0/0、Public/Preview共通 `VisitorMapExperience` と `MapViewer` を維持。

長文Sheet QAはdev-only `__qa_wu69_story` で、既存fixtureをcloneするだけ。Production buildでは404、分析送信なし。公開データやPublicationは書き換えない。

依存package/lockとVerify workflowは変更しない。High auditが通らない場合はmergeを成功扱いにせず、理由と実際のCI結果を記録する。
