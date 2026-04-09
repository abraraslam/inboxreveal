#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/supabase-restore.sh /path/to/supabase_YYYY-MM-DD_HH-MM-SS.dump
#
# Required env vars:
# - SUPABASE_DB_HOST
# - SUPABASE_DB_PORT
# - SUPABASE_DB_NAME
# - SUPABASE_DB_USER
# - SUPABASE_DB_PASSWORD

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/backup.dump" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

required_vars=(
  SUPABASE_DB_HOST
  SUPABASE_DB_PORT
  SUPABASE_DB_NAME
  SUPABASE_DB_USER
  SUPABASE_DB_PASSWORD
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var" >&2
    exit 1
  fi
done

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore not found. Install postgresql-client first." >&2
  exit 1
fi

export PGPASSWORD="$SUPABASE_DB_PASSWORD"
pg_restore \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  "$BACKUP_FILE"
unset PGPASSWORD

echo "Restore completed from: $BACKUP_FILE"
