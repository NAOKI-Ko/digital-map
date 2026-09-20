# QA baseline backup and restore

QA only. Not for Production. Not for R2. Passwords are not stored in this runbook.

## Safety sequence

1. Confirm the exact database name, Managed Media root, and local Public Storage root.
2. Stop application writes.
3. Take an emergency DB + Media + Public backup and run `pnpm backup:verify -- <dump> <media-dir> <public-dir>`.
4. Keep the existing backup. Never overwrite or prune it during restore.
5. Restore all three components together to disposable targets first.
6. Run migrations, `qa:baseline:audit`, `audit:tenant-data-foundation`, and `audit:image-spatial-migration`.
7. Start the disposable app, require `/api/ready` 200, and open a representative public Map.
8. Only then stop the active QA app and restore DB, Media, and Public Storage together.
9. Start QA and repeat account, access, audit, health, and public URL checks.

## Local backup

Set `BACKUP_ROOT`, `DATABASE_URL`, `NUXT_UPLOAD_DIR`, `PUBLIC_STORAGE_DRIVER=local`, and `PUBLIC_STORAGE_ROOT`. Run DB, Media, and Public backup commands, followed by `qa:baseline:bundle`. The resulting root contains `baseline-manifest.json`, `checksums.sha256`, and `verified-backup-marker.json`.

## Disposable restore

Use a new PostgreSQL database name and empty media/public directories. Generic DB and Media restore safety remains unchanged. Public restore additionally requires:

```text
PUBLIC_STORAGE_DRIVER=local
ALLOW_DISPOSABLE_RESTORE=true
RESTORE_PUBLIC_STORAGE_ROOT=<empty disposable path>
```

Run `pnpm restore:public -- <public-backup-directory>`. It rejects R2, the active root, broad unsafe paths, corrupt archives, and manifest mismatches.

## Windows QA

Before change, record deployed SHA and health, then run `scripts/windows/backup.ps1`. It now requires verified DB + Media + Public output. Restore uses `scripts/windows/restore.ps1 -DbDump ... -MediaBackup ... -PublicBackup ...` with disposable guards. Applying an accepted baseline to active Windows QA additionally requires the WU-53 QA-only reset guards and must never point at Production.
