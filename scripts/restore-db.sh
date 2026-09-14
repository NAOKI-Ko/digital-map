#!/usr/bin/env bash
set -euo pipefail

dump_file="${1:-}"
if [[ -z "$dump_file" || ! -f "$dump_file" ]]; then echo "Usage: restore-db.sh <custom-format-dump>" >&2; exit 2; fi
if [[ -z "${RESTORE_DATABASE_URL:-}" ]]; then echo "RESTORE_DATABASE_URL is required" >&2; exit 2; fi
if [[ "${ALLOW_DISPOSABLE_RESTORE:-}" != "true" ]]; then echo "Set ALLOW_DISPOSABLE_RESTORE=true after confirming the target is disposable" >&2; exit 2; fi
if [[ -n "${DATABASE_URL:-}" && "$RESTORE_DATABASE_URL" == "$DATABASE_URL" ]]; then echo "Refusing to restore over DATABASE_URL" >&2; exit 4; fi
if ! command -v pg_restore >/dev/null 2>&1; then echo "pg_restore is required" >&2; exit 3; fi

pg_restore --list "$dump_file" >/dev/null
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" "$dump_file"
echo "DB restore completed to explicitly approved disposable target"
