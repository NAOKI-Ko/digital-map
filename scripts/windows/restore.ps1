param([Parameter(Mandatory=$true)][string]$DbDump, [Parameter(Mandatory=$true)][string]$MediaBackup)
$ErrorActionPreference = 'Stop'
if ($env:ALLOW_DISPOSABLE_RESTORE -ne 'true') { throw 'Set ALLOW_DISPOSABLE_RESTORE=true only for the confirmed restore target.' }
bash scripts/restore-db.sh $DbDump
pnpm restore:media -- $MediaBackup
