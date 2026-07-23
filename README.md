# Digital Map Platform

Nuxt 4とMapLibre GL JSで構築した、デフォルメイラスト向けデジタルマップ作成・公開プラットフォームです。管理者はイラストと実地図の2点を対応づけ、スポットを登録して公開できます。閲覧者はログインせずに、マップの回転・傾き・ズーム、カテゴリ絞り込み、スポット詳細、屋外フロアでの現在地表示を利用できます。

## 技術構成

- Nuxt 4 / Vue 3 / TypeScript
- Tailwind CSS
- MapLibre GL JS
- PostgreSQL 17 / Prisma
- `nuxt-auth-utils`によるセッション認証
- Vitest
- Docker Compose（Nuxtアプリ + PostgreSQL）

ジオリファレンスは、イラスト上と実地図上の基準点A・Bから相似変換で4隅を計算する「2点合わせ」方式です。四隅はDBへ保存せず、`lib/geo.ts`の`computeFloorCorners()`で表示時に計算します。

## 必要な環境

Dockerで動かす場合：

- Docker EngineまたはDocker Desktop
- Docker Compose v2（`docker compose`コマンド）

Dockerを使わない場合：

- Node.js 24
- pnpm 11.9
- PostgreSQL 17

## Docker Composeで起動する

1. リポジトリを取得し、環境変数ファイルを作成します。

   ```bash
   cp .env.example .env
   ```

2. `.env`の`NUXT_SESSION_PASSWORD`を、十分に長いランダム文字列へ変更します。

3. アプリとPostgreSQLをビルド・起動します。

   ```bash
   docker compose up -d --build
   ```

   アプリ起動時に`prisma migrate deploy`が実行され、未適用のマイグレーションが自動適用されます。

4. 初期管理者を作成します。パスワードは12文字以上が必要です。

   ```bash
   docker compose exec \
     -e SEED_ADMIN_EMAIL=admin@example.com \
     -e SEED_ADMIN_PASSWORD='replace-with-a-strong-password' \
     app pnpm db:seed
   ```

5. ブラウザで以下を開きます。

   - 管理画面: <http://localhost:3000/admin/login>
   - 公開マップ: `http://localhost:3000/<map-slug>`

状態確認とログ表示：

```bash
docker compose ps
docker compose logs -f app
```

停止・再起動：

```bash
docker compose stop
docker compose start
```

コンテナだけを削除する場合：

```bash
docker compose down
```

`docker compose down -v`はPostgreSQLとアップロード画像のボリュームも削除します。開発データを意図的に初期化する場合以外は実行しないでください。

## 有松チーム内デモデータ

通常のseedコマンドには、下書きの「有松（チーム内デモ）」と10件のデモスポットが含まれます。

Docker Compose環境：

```bash
docker compose exec \
  -e SEED_ADMIN_EMAIL=admin@example.com \
  -e SEED_ADMIN_PASSWORD='replace-with-a-strong-password' \
  app pnpm db:seed
```

Dockerを使わない開発環境：

```bash
pnpm db:seed
```

`prisma/seed-assets/arimatsu-demo/`のフロアイラスト・ピン画像は、seed実行時に`NUXT_UPLOAD_DIR`へコピーされます。`NUXT_UPLOAD_DIR`が未指定の場合は`public/uploads/`へ配置されます。

有松デモのマップと全スポットは常に下書きとしてupsertされます。固定IDを使うため、同じコマンドを繰り返しても重複登録されません。チーム確認後に手動編集した同デモデータは、次回seedで定義済みの内容へ戻る点に注意してください。

## Dockerを使わずに開発する

1. PostgreSQLを起動し、`.env.example`を`.env`へコピーして`DATABASE_URL`を接続先に合わせます。
2. 依存関係・Prisma Client・DBを準備します。

   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm exec prisma migrate deploy
   pnpm db:seed
   ```

3. 開発サーバーを起動します。

   ```bash
   pnpm dev
   ```

ローカルアップロードは`public/uploads/`へ保存されます。本番ビルドでは`NUXT_UPLOAD_DIR`で永続化先を明示してください。

## 環境変数

| 変数 | 用途 | 既定値・注意点 |
|---|---|---|
| `DATABASE_URL` | Prisma/PostgreSQL接続文字列 | ローカル既定値は`postgresql://digital_map:digital_map@localhost:5432/digital_map?schema=public`。Compose内ではサービス名`postgres`を使用 |
| `NUXT_SESSION_PASSWORD` | セッションCookieの署名・暗号化 | 本番では32文字以上のランダム値を必ず指定。Composeの既定値は開発専用 |
| `NUXT_UPLOAD_DIR` | アップロード画像の保存先 | 開発時は空欄で`public/uploads/`。Composeでは永続ボリューム配下を指定 |
| `NUXT_NOMINATIM_BASE_URL` | Nominatim APIのベースURL | `https://nominatim.openstreetmap.org` |
| `NUXT_NOMINATIM_USER_AGENT` | Nominatimへ送るUser-Agent | セルフホスト先の連絡先を含む固有値へ変更することを推奨 |
| `SEED_TENANT_NAME` | seedで作るテナント名 | `デジタルマップ運営` |
| `SEED_TENANT_SLUG` | seedで作るテナントslug | `default` |
| `SEED_ADMIN_EMAIL` | seedで作る管理者メール | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | seedで設定する管理者パスワード | 12文字以上。本番値をリポジトリへコミットしないこと |
| `HOST` | Nitroのリッスンアドレス | Dockerでは`0.0.0.0` |
| `PORT` | Nitroのリッスンポート | `3000` |

`.env`はGit管理対象外です。秘密値はデプロイ先のSecrets機構で管理してください。

## よく使うコマンド

```bash
pnpm dev                 # 開発サーバー
pnpm test                # Vitest
pnpm typecheck           # Nuxt/Vueの型チェック
pnpm build               # 本番ビルド
pnpm prisma:validate     # Prismaスキーマ検証
pnpm prisma:generate     # Prisma Client生成
pnpm exec prisma migrate deploy
pnpm db:seed             # 管理者・開発用fixtureの作成
```

`prisma/seed.ts`は冪等ですが、開発確認用の「湯かおり温泉郷」「里山リゾート」「有松（チーム内デモ）」を下書き状態へ戻します。本番運用DBでは、用途を確認してから実行してください。

## ディレクトリ概要

```text
app/
  components/       Vueコンポーネント
  composables/      MapLibre初期化などの状態・ライフサイクル
  pages/            公開画面と管理画面
server/
  api/              Nitro API Routes
  utils/            Prisma、認可、アップロード等
shared/             クライアント/サーバー共通の型・schema
lib/geo.ts          2点合わせと座標計算
prisma/             schema、migration、seed、seed-assets
public/uploads/     ローカル開発時のアップロード先
docs/                要件・設計・画面仕様・タスク
```

実装判断は`docs/design.md`、要件は`docs/requirements.md`、画面仕様は`docs/wireframe-spec.md`を参照してください。コーディングエージェントは作業前に`AGENTS.md`も確認してください。

## データ公開とセキュリティ

- 管理APIは管理者セッションと`tenantId`による所有権検証を通します。
- 公開APIは`Map.isPublished === true`のマップだけを返します。
- 公開マップ内でも、`Spot.isPublished === true`かつ`lat`/`lng`設定済みのスポットだけを返します。
- 基準点A・Bの8項目が揃ったフロアだけに`GeolocateControl`を追加します。
- 現在地はイラスト上のおおよその目安であり、正確なナビゲーション用途は保証しません。

インターネットへ公開する場合は、TLS終端を行うリバースプロキシ、DBとアップロードボリュームのバックアップ、PostgreSQL認証情報の変更、アクセスログと監視を別途構成してください。

## バックアップ対象

- PostgreSQL: Composeボリューム`postgres_data`
- アップロード画像: Composeボリューム`uploads`

DBの論理バックアップ例：

```bash
docker compose exec -T postgres \
  pg_dump -U digital_map -d digital_map --format=custom > digital-map.dump
```

画像ボリュームとDBは同じ時点でバックアップし、参照先URLと実ファイルの整合性を保ってください。
