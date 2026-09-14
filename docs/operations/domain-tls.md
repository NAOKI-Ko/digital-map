# 固定Domain / TLS運用準備

この文書はQuick Tunnelを本番固定URLとして扱わず、Cloudflare named Tunnelへ移行するための構成手順です。Domain購入、DNS変更、Tunnel credential発行は外部Activationであり、このリポジトリは実行しません。

## 環境別の必須設定

本番では次を設定します。

- `DEPLOYMENT_ENV=production`: 固定HTTPS URL、許可Host、HTTPS redirect、HSTSを必須化
- `PUBLIC_BASE_URL=https://<public-host>`: 公開Map、QR、canonical、OGP、sitemapの基準URL
- `ADMIN_BASE_URL=https://<admin-host>`: 管理画面、招待、reset、signup verificationの基準URL
- `TRUSTED_HOSTS=<public-host>,<admin-host>`: 許可するHost（必要な場合はportを含む）
- `NUXT_TRUSTED_ORIGINS=https://<admin-host>,https://<public-host>`: cookie認証mutationのOrigin許可
- `TRUST_PROXY=true`: Cloudflare/cloudflaredの`X-Forwarded-Proto`と`X-Forwarded-Host`を採用

本番起動時は両Base URLが絶対HTTPSであることを検証し、localhostと`*.trycloudflare.com`を拒否します。開発は`DEPLOYMENT_ENV=development`、Windows QAは`DEPLOYMENT_ENV=qa`を明示し、localhostまたは既存Quick Tunnelを使用できます。`NODE_ENV=production`の最適化buildをQAで使っても、本番Domain制約を偽装しません。

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
