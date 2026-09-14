#!/usr/bin/env bash
set -euo pipefail

backup_root="${BACKUP_ROOT:-./backups}"
if [[ -z "${DATABASE_URL:-}" ]]; then echo "DATABASE_URL is required" >&2; exit 2; fi
if ! command -v pg_dump >/dev/null 2>&1; then echo "pg_dump is required" >&2; exit 3; fi

mkdir -p "$backup_root/db"
touch "$backup_root/.digital-map-backup-root"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump_file="$backup_root/db/digital-map-$timestamp.dump"
metadata_file="$dump_file.json"

pg_dump --format=custom --file="$dump_file" "$DATABASE_URL"
checksum="$(shasum -a 256 "$dump_file" | awk '{print $1}')"
commit_sha="$(git rev-parse HEAD 2>/dev/null || printf unknown)"
postgres_version="$(pg_dump --version | tr -d '\r\n' | sed 's/"/\\"/g')"
printf '{"timestamp":"%s","commitSha":"%s","sha256":"%s","postgresVersion":"%s","format":"custom"}\n' \
  "$timestamp" "$commit_sha" "$checksum" "$postgres_version" > "$metadata_file"
echo "DB backup created: $dump_file"
