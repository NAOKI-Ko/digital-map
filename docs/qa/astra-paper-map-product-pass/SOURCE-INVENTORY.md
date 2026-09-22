# Paper Map — Source Inventory

2026-09-22。事実の供給元と、QA用fixtureを区別する。

## 利用できたデータ

| データセット | 取得元 | 内容 | 判定 |
|---|---|---|---|
| WU-53/58 baseline | 指定baseのarimatsu-baseline-lib.ts、DATA-SOURCE-MANIFEST、seed asset | 16 Spot、既定では位置未設定・非公開。写真なし | 既存の文言・画像を調査。位置を作って製品出力へ流していない |
| WU-57/58既存PDF/PNG | 指定base docs/qa | WU-57 placeholder、WU-58別SVGによる見本3種 | 過去成果物として調査。新実装の完成証拠ではない |
| team-demo-arimatsu | 既存Prisma seedを2つの使い捨てDBへ投入 | 10 Spot、6 category、1 floor、既存QA x/y。ダミー写真参照を除去後0写真 | 技術比較用。実データ最終受入に代用しない |
| arimatsu-fon 公開API | Windows QAの既存公開URL、GET /api/public/arimatsu-fon | READY release cmu9z3vg80000zovaw2vimp1m、1 floor、0 Spot | 無認証公開情報のみ取得。紙面生成の母集団として不足 |
| arimatsu-fon LIVE / 実写真 | Windows QA | 過去deploy報告では20 Spot・16写真。今回未取得 | 自動承認レビュー拒否後、明示許可待ち。件数は今回の再検証値ではない |

## 比較snapshot

6種の製品PDFは同一のteam-demo-arimatsu LIVE DTOを使用。既存文章・PIN・背景以外を加えていない。map-classicは索引、spot-guideはdescription、photo-storyは写真なしの文字fallback。Paper Originalは既存Map名を初期タイトルにする。既存QA PINは測量・地理的正確性を確認済みとは扱わない。

| 対象 | SHA-256 |
|---|---|
| Astra QA DBから読み取ったDTO（JSON 2-space） | e76ed8226bd5148f07a39a084b79a579387e2ab78b623d855368e0366739d448 |
| Current dev QA DBのDTO | 2a7174e7660b7da4b564b92011dba4634872131546ffe88adcbe8f78d20c8c1a |
| 自動採番category/field定義IDだけを除いた両DTO共通内容 | e07738e60a161c4e8c7e51bf061ad7a10c8d7aaece60e662b93ae998b1b901e4 |
| 両方の既存地図PNG（1448×1086） | bbcdc37460f481b959097ea68674facff617003eda5fe2eb2d418e91625f6b43 |
| 無認証公開APIレスポンス（0 Spot） | 0b8510f32689a44b58352d67a1706e4dbcf1de4865d33b3180c429c517373cb2 |

## 紙面要素の出所

| 要素 | map-classic | spot-guide | photo-story | 出所 / 欠損規則 |
|---|---|---|---|---|
| タイトル | 使用 | 使用 | 使用 | Map.name初期値または明示Paper Original |
| 補足文章 | 任意 | 任意 | 任意 | 明示Paper Original。subtitle未入力時のみ既存organizationName |
| 地図・道路 | 使用 | 使用 | 使用 | 既存illustrationUrlの画像。道路・経路を新規作画しない |
| PIN | 使用 | 使用 | 使用 | 既存floorId/x/yにviewport変換のみ。移動・推定なし |
| 番号 | 使用 | 使用 | 使用 | 選択と順序から決定的に付番。経路・訪問順ではない |
| 名称 | 使用 | 使用 | 使用 | 既存Spot.name。長文は改行し、省略があれば件数を警告 |
| category | 情報量設定による | 使用 | 使用 | 既存Category。新しい分類は作らない |
| 紹介文 | 初期値では省略 | 使用 | 使用 | 既存descriptionまたは明示Paper Override。無関係なfieldを代用しない |
| 住所・営業時間 | 初期値では非掲載 | 初期値では非掲載 | 初期値では非掲載 | informationFieldsは既存DTOにあるが今回のカードへ自動追加しない |
| 写真 | なし | なし | 既存のみ | 同一Spot.photos。欠損・読込不能は省略。QA比較は0写真 |
| logo / Decoration | 既存のみ | 既存のみ | 既存のみ | 既存managed mediaと既存geometry。QA比較は0 |
| QR | 公開時のみ | 公開時のみ | 公開時のみ | 既存public URL。新版は公開停止/READYなしで省略。QA図では省略 |

実データ取得許可後は、LIVE/PUBLISHEDとrelease、取得時刻、全掲載Spot、写真・logo・Decorationのhash、描画結果を同様に固定する。取得していない情報のhashや検証結果を作らない。
