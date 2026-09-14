$ErrorActionPreference = 'Stop'
if (-not $env:BACKUP_ROOT) { throw 'BACKUP_ROOT is required' }
if ($env:PG_BIN) { $env:PG_DUMP_PATH = Join-Path $env:PG_BIN 'pg_dump.exe' }
pnpm backup:db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm backup:media
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Backups created. Run pnpm backup:verify with the emitted paths.'
