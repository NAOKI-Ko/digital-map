$ErrorActionPreference = 'Stop'
if (-not $env:BACKUP_ROOT) { throw 'BACKUP_ROOT is required' }
pnpm backup:db
pnpm backup:media
Write-Host 'Backups created. Run pnpm backup:verify with the emitted paths.'
