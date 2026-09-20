param([Parameter(Mandatory=$true)][string]$DbDump, [Parameter(Mandatory=$true)][string]$MediaBackup, [Parameter(Mandatory=$true)][string]$PublicBackup)
$ErrorActionPreference = 'Stop'
if ($env:ALLOW_DISPOSABLE_RESTORE -ne 'true') { throw 'Set ALLOW_DISPOSABLE_RESTORE=true only for the confirmed restore target.' }
if ($env:PG_BIN) { $env:PG_RESTORE_PATH = Join-Path $env:PG_BIN 'pg_restore.exe' }
pnpm restore:db -- $DbDump
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm restore:media -- $MediaBackup
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm restore:public -- $PublicBackup
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
