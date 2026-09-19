$ErrorActionPreference = 'Stop'
if (-not $env:BACKUP_ROOT) { throw 'BACKUP_ROOT is required' }
if ($env:BACKUP_ROOT.Length -gt 120) { throw 'BACKUP_ROOT is too long. Use a short path such as C:\DigitalMap\backups\w48-<sha>-<timestamp>.' }
if ($env:PG_BIN) { $env:PG_DUMP_PATH = Join-Path $env:PG_BIN 'pg_dump.exe' }
pnpm backup:db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm backup:media
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$dbDump = Get-ChildItem (Join-Path $env:BACKUP_ROOT 'db') -Filter '*.dump' | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
$mediaBackup = Get-ChildItem (Join-Path $env:BACKUP_ROOT 'media') -Directory | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if (-not $dbDump -or -not $mediaBackup) { throw 'Backup outputs could not be resolved for verification.' }
pnpm backup:verify -- $dbDump.FullName $mediaBackup.FullName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Verified backup created: $($env:BACKUP_ROOT)"
