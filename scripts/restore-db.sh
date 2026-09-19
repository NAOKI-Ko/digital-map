#!/usr/bin/env bash
set -euo pipefail

dump_file="${1:-}"
if [[ -z "$dump_file" || ! -f "$dump_file" ]]; then echo "Usage: restore-db.sh <custom-format-dump>" >&2; exit 2; fi
if [[ -z "${RESTORE_DATABASE_URL:-}" ]]; then echo "RESTORE_DATABASE_URL is required" >&2; exit 2; fi
if [[ "${ALLOW_DISPOSABLE_RESTORE:-}" != "true" ]]; then echo "Set ALLOW_DISPOSABLE_RESTORE=true after confirming the target is disposable" >&2; exit 2; fi
if ! command -v pnpm >/dev/null 2>&1; then echo "pnpm is required" >&2; exit 3; fi

# Delegate target identity checks to the cross-platform implementation so a
# different username/password cannot disguise the live database as disposable.
pnpm restore:db -- "$dump_file"
