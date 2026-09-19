# Backup / restore runbook

The initial retention policy is 7 daily and 4 weekly backups. `BACKUP_ROOT` is the only managed root; the retention command requires its marker file, matches only Digital Map dump names, and is dry-run unless `--apply` is explicit.

## Backup

1. Set `DATABASE_URL`, `NUXT_UPLOAD_DIR` (or `MEDIA_ROOT`), and `BACKUP_ROOT` without printing them. On Windows, keep the complete `BACKUP_ROOT` at 120 characters or less; use a short name such as `C:\DigitalMap\backups\w48-<shortsha>-<yyyyMMdd-HHmm>` rather than embedding a long work-unit title.
2. On Windows run `powershell -File scripts/windows/backup.ps1`; it creates both backups, resolves their emitted paths, and performs checksum verification before returning success. On other platforms, run `pnpm backup:db`, `pnpm backup:media`, then `pnpm backup:verify -- <dump-path> <media-backup-directory>`.
3. Record the verified DB dump, media directory, application release SHA, and their checksums together. Application rollback uses the preserved immutable release-by-SHA; do not recursively copy `node_modules` into the backup path.
4. Inspect `pnpm backup:retention`; only then run `pnpm backup:retention -- --apply`.

DB dumps use PostgreSQL custom format. Sidecar metadata contains UTC timestamp, app commit SHA, SHA-256, and `pg_dump` version. Media archives carry a sorted relative-path/size/SHA-256 manifest and preserve `MediaAsset.storageKey` paths.

## Restore drill

Use only a new disposable PostgreSQL database and an empty temporary media directory. Set `RESTORE_DATABASE_URL`, `RESTORE_MEDIA_ROOT`, and `ALLOW_DISPOSABLE_RESTORE=true`; the DB wrapper compares protocol, host, effective port, and database name independently of credentials and refuses the live `DATABASE_URL`. Restore DB and media, run Prisma/data checks, verify every managed `MediaAsset.storageKey`, and require zero missing, mismatched, or unexpected media files. Then remove the disposable resources. Never use QA, production, or a shared database for a drill.

Windows wrappers are in `scripts/windows`. They do not install a schedule or contain credentials. Backup/restore failure exits non-zero; operators should route that exit into the WU-28 operations alert integration.
