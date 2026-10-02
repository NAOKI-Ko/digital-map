# 固定Domain / TLS運用準備

この文書はQuick Tunnelを本番固定URLとして扱わず、Cloudflare named Tunnelへ移行するための構成手順です。Domain購入、DNS変更、Tunnel credential発行は外部Activationであり、このリポジトリは実行しません。

## 環境別の必須設定

本番では次を設定します。

- `DEPLOYMENT_ENV=production`: 固定HTTPS URL、許可Host、HTTPS redirect、HSTSを必須化
- `PUBLIC_BASE_URL=https://<public-host>`: 公開Map、QR、canonical、OGP、sitemapの基準URL
- `ADMIN_BASE_URL=https://<admin-host>`: 管理画面、招待、reset、signup verificationの基準URL
- `NUXT_PUBLIC_PUBLIC_BASE_URL`: **実行時**の Nuxt public runtime config。`PUBLIC_BASE_URL` と同じ値にする。公開画面・Publish 画面に配信されるURLはこちらから決まる。
- `NUXT_ADMIN_BASE_URL`: **実行時**の Nuxt private runtime config。`ADMIN_BASE_URL` と同じ値にする。メールに記載する認証リンクはこちらから決まる。
- `TRUSTED_HOSTS=<public-host>,<admin-host>`: 許可するHost（必要な場合はportを含む）
- `NUXT_TRUSTED_ORIGINS=https://<admin-host>,https://<public-host>`: cookie認証mutationのOrigin許可
- `TRUST_PROXY=true`: Cloudflare/cloudflaredの`X-Forwarded-Proto`と`X-Forwarded-Host`を採用
- ビルド済みNuxtの実行時に変更する場合、`NUXT_DEPLOYMENT_ENVIRONMENT`、`NUXT_TRUSTED_HOSTS`、`NUXT_TRUST_PROXY` も対応する宣言値と同じにする。`DEPLOYMENT_ENV` 等だけの後変更はビルド時初期値を変えない。

本番起動時は両Base URLが絶対HTTPSであることを検証し、localhostと`*.trycloudflare.com`を拒否します。開発は`DEPLOYMENT_ENV=development`、Windows QAは`DEPLOYMENT_ENV=qa`を明示し、localhostまたは既存Quick Tunnelを使用できます。`NODE_ENV=production`の最適化buildをQAで使っても、本番Domain制約を偽装しません。

QA と本番の起動時には宣言値 `PUBLIC_BASE_URL` / `ADMIN_BASE_URL` が必須で、上記 Nuxt runtime override の**実効値**と一致しなければ起動を失敗させます。Nuxt の `runtimeConfig` に `process.env.PUBLIC_BASE_URL` から入る値はビルド時の初期値になり得ます。後で `PUBLIC_BASE_URL` だけを書き換えても、ビルド済みクライアントの `public.publicBaseUrl` は変わりません。ローカル開発・test は localhost fallback を許可します。`REQUEST_ORIGIN` は CSRF/proxy 検証に限り、メールや QR の canonical origin として使いません。

## Windows QA Quick Tunnel cutover gate

Quick Tunnel の hostname は再起動で変わります。固定 QA hostname の named Tunnel が長期目標です。それまでは毎回以下を**同じリリースの起動前**に完了します。`C:\DigitalMap\runtime\secrets.ps1` は保護された設定元で、値や秘密情報を証跡へ丸ごとコピーしません。

1. cloudflared を起動または復旧し、ログの最新 `https://...trycloudflare.com` と現在到達できる hostname を確認する。
2. `PUBLIC_BASE_URL`、`ADMIN_BASE_URL`、`NUXT_PUBLIC_PUBLIC_BASE_URL`、`NUXT_ADMIN_BASE_URL` を現在の意図した host に合わせる。公開と管理が別 host ならそれぞれ別の値にする。同時に `TRUSTED_HOSTS`、`NUXT_TRUSTED_HOSTS`、`NUXT_TRUSTED_ORIGINS`、`TRUST_PROXY`、`NUXT_TRUST_PROXY`、`DEPLOYMENT_ENV`、`NUXT_DEPLOYMENT_ENVIRONMENT` を確認する。固定 host の場合も同じ整合性検査を行う。
3. アプリを起動する。startup origin gate が一致しない場合は失敗として扱い、古い host のまま稼働させない。
4. `/` の `window.__NUXT__.config.public.publicBaseUrl`、新規発行した signup verification URL の**host のみ**、Publish 表示・コピー URL、Paper/PDF QR を確認する。認証 token をログ・証跡に残さない。
5. それぞれ現在の hostname で到達できることを確認して初めて Ready とする。過去のメール・配布済み PDF の quick-tunnel URL は自動更新されないため、必要なら再発行・再出力する。

今回の Windows 調査では保護設定と active tunnel は `eyes-retention-judgment-neural.trycloudflare.com` だった一方、稼働中の Nuxt public payload は以前の `sur-context-basin-concert.trycloudflare.com` を含んでいた。これは **設定ファイルの現在値とビルド/実効 runtime config の乖離**であり、Quick Tunnel をハードコードして解決しない。

## named Tunnel

1. Cloudflare管理下のQA用Zone/hostnameと本番用Zone/hostnameを分離する。
2. `cloudflared tunnel create`を運用者権限で実行し、credentialをWindowsの保護されたディレクトリへ置く。
3. `infra/cloudflared/config.example.yml`をホスト外の実設定へコピーし、Tunnel UUID、credential path、public/admin hostnameを置換する。
4. `cloudflared tunnel route dns`またはDashboardでpublic/admin CNAMEをnamed Tunnelへ割り当てる。
5. Cloudflare edgeでTLSを終端する。originは`127.0.0.1:3000`のHTTPでよく、アプリは信頼済みproxy headerから外部HTTPSを認識する。
6. Windows Serviceのcloudflared設定をQuick Tunnelからnamed Tunnelへ切り替える。WU-40 QAでは既存Quick Tunnelを再起動せず維持する。

credential、Tunnel token、API tokenはGit・ログ・`.env.example`へ保存しません。

## 確認

- public/admin両hostで`/api/health`と`/api/ready`を確認する。
- HTTPアクセスが同じ許可hostのHTTPSへ308 redirectされることを確認する。
- session cookieがSecureで、HSTSがHTTPS応答だけに付くことを確認する。
- 公開URL、QR、メール、canonical/OGPが一時Tunnel URLを含まないことを確認する。

## Windows QA automatic Quick Tunnel origin synchronization

`scripts/windows/qa-sync-tunnel.ps1` reads the current cloudflared process's URL announcement, atomically updates runtime/public-url.txt and a QA-only Nuxt origin overlay, and restarts the same app release only when the URL changes. The QA app runner loads that overlay after its protected secrets file. A named mutex serializes start/run callers. Origin equality, exact trusted host and proxy gates stay enabled; Production configuration is unchanged. `qa-install-tunnel.ps1` preserves runner backups before installing hooks. Live tunnel rotation and idempotency evidence are in docs/qa/wu68-public-viewer-clarity/08-MAP-ONLY-RECOVERY-QA.md. Historical copied URLs, emails and exported PDFs must be regenerated; they cannot follow a retired DNS name.
