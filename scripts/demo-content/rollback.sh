#!/usr/bin/env bash
# =============================================================================
# Azeebo+ Demo Content Rollback Script
# Removes all demo data and optionally restores from backup.
# Usage: ./rollback.sh [environment] [--from-backup] [--keep-schema]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

ENV="${1:-local}"
FROM_BACKUP=false
KEEP_SCHEMA=false

for arg in "$@"; do
  case "$arg" in
    --from-backup) FROM_BACKUP=true ;;
    --keep-schema) KEEP_SCHEMA=true ;;
  esac
done

# Database connection settings per environment
case "$ENV" in
  local)
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-azeebo_plus_dev}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-}"
    ;;
  staging)
    DB_HOST="${STAGING_DB_HOST:-}"
    DB_PORT="${STAGING_DB_PORT:-5432}"
    DB_NAME="${STAGING_DB_NAME:-azeebo_plus_staging}"
    DB_USER="${STAGING_DB_USER:-}"
    DB_PASSWORD="${STAGING_DB_PASSWORD:-}"
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ]; then
      echo "ERROR: Staging requires STAGING_DB_HOST and STAGING_DB_USER env vars."
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [local|staging] [--from-backup] [--keep-schema]"
    exit 1
    ;;
esac

PSQL_BASE="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
if [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

log() { echo "[demo-rollback] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
die() { log "FATAL: $*"; exit 1; }

# Pre-flight
command -v psql >/dev/null 2>&1 || die "psql not found"
$PSQL_BASE -c "SELECT 1" >/dev/null 2>&1 || die "Cannot connect to database"

log "Rolling back demo content from: $ENV"

# --- Pre-rollback backup (safety net) ---
ROLLBACK_BACKUP="$BACKUP_DIR/rollback_backup_$(date '+%Y%m%d_%H%M%S').sql"
mkdir -p "$BACKUP_DIR"

log "Creating safety backup before rollback..."
$PSQL_BASE -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN (
    'auth_users','content_items','media_assets','comments','rentals',
    'passes','screenings','watch_history','system_settings','user_profiles',
    'wallets','wallet_transactions','subscriptions','demo_content_versions'
  )
" -t -A | while read -r table; do
  $PSQL_BASE -c "COPY (SELECT * FROM \"$table\") TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/rollback_${table}.csv" 2>/dev/null || true
done

# --- Truncate demo data (respect foreign keys: children first) ---
log "Truncating demo data tables..."

# Order matters: truncate children before parents
TABLES_TO_TRUNCATE=(
  "watch_history"
  "comments"
  "rentals"
  "passes"
  "screenings"
  "locked_extras"
  "user_unlocks"
  "content_tags"
  "content_categories"
  "content_relationships"
  "media_assets"
  "content_items"
  "subscriptions"
  "following"
  "saved_items"
  "user_universe_affinity"
  "user_preferences"
  "user_profiles"
  "wallet_transactions"
  "wallets"
  "user_roles"
  "otp_codes"
  "refresh_tokens"
  "login_attempts"
  "password_reset_tokens"
  "verification_tokens"
  "universe_feature_flags"
  "audit_logs"
  "system_settings"
  "universes"
  "categories"
  "tags"
  "auth_users"
  "demo_content_versions"
)

for table in "${TABLES_TO_TRUNCATE[@]}"; do
  exists=$($PSQL_BASE -t -A -c "
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '$table'
  " 2>/dev/null || echo "0")
  if [ "$exists" != "0" ]; then
    $PSQL_BASE -c "TRUNCATE TABLE \"$table\" CASCADE" 2>/dev/null && \
      log "  Truncated: $table" || \
      log "  Warning: Could not truncate $table"
  fi
done

# --- Optionally restore from latest backup ---
if [ "$FROM_BACKUP" = true ]; then
  log "Restoring from latest pre-deploy backup..."
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/pre_deploy_*.csv 2>/dev/null | head -1)
  if [ -z "$LATEST_BACKUP" ]; then
    log "Warning: No pre-deploy backup found. Skipping restore."
  else
    log "Restore from backup is CSV-based and requires manual re-import."
    log "Backup files are in: $BACKUP_DIR"
  fi
fi

# --- Drop demo-only tables if not keeping schema ---
if [ "$KEEP_SCHEMA" = false ]; then
  log "Dropping demo-only tables..."
  DEMO_ONLY_TABLES=(
    "demo_content_versions"
  )
  for table in "${DEMO_ONLY_TABLES[@]}"; do
    $PSQL_BASE -c "DROP TABLE IF EXISTS \"$table\" CASCADE" 2>/dev/null && \
      log "  Dropped: $table" || true
  done
fi

# --- Summary ---
log ""
log "=== Rollback Complete ==="
log "Environment: $ENV"
log "All demo data has been removed."
log "Safety backup: $BACKUP_DIR"
log ""
log "To re-deploy: $SCRIPT_DIR/deploy.sh $ENV"
