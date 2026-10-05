# WU-77 Windows本人操作の引継ぎ

2026-10-05。責任者の13:30:40UTC承認に基づく、専用テスト環境の既存準備を継続する手順です。新たな承認依頼ではありません。**実行はDOTによる直前の読取確認・開始連絡の後**です。この文書の保存だけでは開始できません。

専用rootは `C:\DigitalMap\incoming\wu77-persisted-20261005`、専用PostgreSQLは `127.0.0.1:5433`。永続DB準備のsourceは `9d2a1ec196a9bec33d78aaaf1e418b786cb7b21c` です。独立Map QAの修正候補 `94ca6d75f30a6f5960d1e6df5d0dccab81547c0b` /3016とは別工程であり、この手順だけでPublic/LIVE・公開lifecycle・最終候補の認証検証がPASSになることはありません。

## 実行前にDOTが確認する条件

専用PGDATA・PID18964・5433・開始epochが承認済みの同一instanceで、SCRAM設定、BOOTのみ、初期3DBのみ、APP未作成、残存createuserなし、専用private ACL維持、runtime-config/DB attestation/adoption attempt未作成を**読取だけで再確認**します。下の固定 `operator-never-created.pgservice` の不在も確認します。状態が異なれば実行を止め、既存attemptを保全します。確認時刻・開始連絡はAsanaへ記録します。

## Windowsで行う3ステップ

1. 同じWindowsユーザーで通常のPowerShellを開き、`powershell.exe -NoProfile` の新しいセッションを使います。Windows Terminalの利用可否は未確認です。本人の私的な標準入力経路を使い、専用rootの `.secrets\credentials.json` の **appPasswordだけをWindows内で確認**します。値を会話・画像・ログ・モデル・Mac・clipboard自動操作へ渡しません。既存ファイルの値を変更しません。
2. 下のコマンドを実行します。標準createuserの最初と2回目の伏字パスワードpromptに、同じappPasswordを**手で入力**します。PowerShellのコマンド行へパスワードを入力しません。この新しいshellの固定名環境設定だけを使い、既存値の表示・探索やシステム設定変更は行いません。

```powershell
Set-Location 'C:\DigitalMap\incoming\wu77-persisted-20261005'
foreach ($wu77PgName in @('PGPASSWORD','PGSERVICE','PGOPTIONS','PGHOST','PGHOSTADDR','PGPORT','PGUSER','PGSSLKEY','PGSSLCERT','PGSSLROOTCERT','PGSSLMODE','PGSSLPASSWORD','PGTARGETSESSIONATTRS','PGCHANNELBINDING','PGGSSENCMODE')) {
  [Environment]::SetEnvironmentVariable($wu77PgName, $null, 'Process')
}
$env:PGHOSTADDR = '127.0.0.1'
$env:PGSERVICEFILE = 'C:\DigitalMap\incoming\wu77-persisted-20261005\operator-never-created.pgservice'
$env:PGPASSFILE = 'C:\DigitalMap\incoming\wu77-persisted-20261005\.secrets\bootstrap.pgpass'
$env:PGDATABASE = 'postgres'
$env:PGCONNECT_TIMEOUT = '5'
& 'C:\DigitalMap\tools\pgsql\bin\createuser.exe' --host=127.0.0.1 --port=5433 --username=wu77_qa_bootstrap --no-password --no-superuser --no-createdb --no-createrole --no-replication --no-bypassrls --login --pwprompt wu77_qa_app
$wu77OperatorExit = $LASTEXITCODE
foreach ($wu77PgName in @('PGHOSTADDR','PGPASSFILE','PGDATABASE','PGCONNECT_TIMEOUT','PGSERVICEFILE')) {
  [Environment]::SetEnvironmentVariable($wu77PgName, $null, 'Process')
}
"createuserExit=$wu77OperatorExit"
```

3. **exit 0でもここで停止**し、DOTへ `createuserExit=数字` だけを返します。画面や秘密値は返しません。非0・入力不一致・timeout・中断の場合も再実行せず、その数値または中断だけを連絡します。roleのpassword/権限修正、既存attempt削除は行いません。私的viewerと新しいconsoleを閉じます。

この手順は標準vendor CLIの本人操作です。ExecutionPolicy・記録/監視・console設定の変更、Bypass、認証やSecurity Gateの例外追加は含みません。本人が使える私的標準入力経路がなければ、その依存条件をOPENとして保持します。

## 本人報告後の再開条件

本人の終了報告だけでは採用しません。DOTがSELECTと通常APP接続で、実際のSCRAM・login・非superuser/createdb/createrole/replication/bypassrls・membership0・同一instanceへの認証を確認します。適合時のみ、承認済み専用DBの一度だけの作成へ進みます。別途静的review済みadoption helperとruntime guardはWindows構文確認まで完了していますが、本人報告前のmain実行・DB作成は未実施です。

その後もmigration、OWNER、実browserの通常ログインとSecure cookie、通常API保存・Public/LIVE parity・公開lifecycleは別の未完了gateです。永続側の9d2 buildを94caと扱わず、最終候補のbuild/source照合を別途行います。Final Acceptance、dev merge、post-merge Verify、Windows exact merge SHA反映、WU Closeは未実施です。
