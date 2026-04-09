#!/usr/bin/env bash
set -euo pipefail

# Required env vars:
# - SUPABASE_DB_HOST
# - SUPABASE_DB_PORT (e.g. 6543)
# - SUPABASE_DB_NAME (e.g. postgres)
# - SUPABASE_DB_USER (e.g. postgres.PROJECT_REF)
# - SUPABASE_DB_PASSWORD
# Optional:
# - BACKUP_DIR (default: $HOME/supabase-backups)
# - BACKUP_KEEP_DAYS (default: 14)

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

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install postgresql-client first." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$HOME/supabase-backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%F_%H-%M-%S)"
outfile="$BACKUP_DIR/supabase_${timestamp}.dump"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"
pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "$outfile" \
  --verbose

unset PGPASSWORD

# Delete old backups beyond retention window.
find "$BACKUP_DIR" -type f -name "supabase_*.dump" -mtime "+$BACKUP_KEEP_DAYS" -delete

echo "Backup created: $outfile"
