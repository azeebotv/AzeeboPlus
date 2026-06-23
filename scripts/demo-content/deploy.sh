#!/usr/bin/env bash
# =============================================================================
# Azeebo+ Demo Content Deploy Script
# Runs migrations and seeds demo data into the target database.
# Usage: ./deploy.sh [environment] [--skip-migrate] [--skip-seed]
#   environment: local (default) | staging | production (blocked)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# --- Configuration ---
ENV="${1:-local}"
SKIP_MIGRATE=false
SKIP_SEED=false
VERSION_FILE="$SCRIPT_DIR/VERSION"

for arg in "$@"; do
  case "$arg" in
    --skip-migrate) SKIP_MIGRATE=true ;;
    --skip-seed) SKIP_SEED=true ;;
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
  production)
    echo "ERROR: Production deployment is blocked. Use staging instead."
    exit 1
    ;;
  *)
    echo "Usage: $0 [local|staging] [--skip-migrate] [--skip-seed]"
    exit 1
    ;;
esac

# --- Helpers ---
PSQL_BASE="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
if [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

log() { echo "[demo-deploy] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
die() { log "FATAL: $*"; exit 1; }

get_version() {
  if [ -f "$VERSION_FILE" ]; then
    cat "$VERSION_FILE" | tr -d '[:space:]'
  else
    echo "0.0.0"
  fi
}

# --- Pre-flight checks ---
log "Deploying demo content to: $ENV"
log "Database: $DB_NAME @ $DB_HOST:$DB_PORT as $DB_USER"

# Check psql is available
command -v psql >/dev/null 2>&1 || die "psql not found. Install PostgreSQL client."

# Check connectivity
$PSQL_BASE -c "SELECT 1" >/dev/null 2>&1 || die "Cannot connect to database $DB_NAME"

# --- Backup existing demo data ---
BACKUP_DIR="$SCRIPT_DIR/backups"
BACKUP_FILE="$BACKUP_DIR/demo_backup_$(date '+%Y%m%d_%H%M%S').sql"
mkdir -p "$BACKUP_DIR"

log "Creating pre-deploy backup..."
$PSQL_BASE -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'auth_users','user_roles','content_items','media_assets',
      'comments','rentals','passes','screenings','watch_history',
      'system_settings','user_profiles','wallets','wallet_transactions',
      'subscriptions','demo_content_versions'
    )
" -t -A | while read -r table; do
  $PSQL_BASE -c "COPY (SELECT * FROM \"$table\") TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/pre_deploy_${table}.csv" 2>/dev/null || true
done
log "Backup saved to $BACKUP_DIR"

# --- Run migrations ---
if [ "$SKIP_MIGRATE" = false ]; then
  log "Running schema migration..."
  $PSQL_BASE -f "$MIGRATIONS_DIR/001_create_all_tables.sql" || die "Migration failed"
  log "Schema migration complete."
else
  log "Skipping migration (--skip-migrate)"
fi

# --- Run seed data ---
if [ "$SKIP_SEED" = false ]; then
  log "Seeding demo data..."
  $PSQL_BASE -f "$MIGRATIONS_DIR/002_seed_demo_data.sql" || die "Seed failed"
  log "Demo data seeded."
else
  log "Skipping seed (--skip-seed)"
fi

# --- Record version ---
DEMO_VERSION=$(get_version)
log "Recording demo content version: $DEMO_VERSION"

$PSQL_BASE -c "
  INSERT INTO demo_content_versions (id, version, \"deployedBy\", metadata, status)
  VALUES (
    gen_random_uuid()::TEXT,
    '$DEMO_VERSION',
    'deploy-script',
    '{\"environment\": \"$ENV\", \"method\": \"deploy.sh\"}'::jsonb,
    'active'
  )
" 2>/dev/null || log "Warning: Could not record version (demo_content_versions table may not exist yet)"

# --- Summary ---
log ""
log "=== Deploy Complete ==="
log "Environment: $ENV"
log "Demo Version: $DEMO_VERSION"
log ""

# Count records
for table in auth_users content_items media_assets wallets wallet_transactions comments watch_history passes rentals; do
  count=$($PSQL_BASE -t -A -c "SELECT COUNT(*) FROM \"$table\"" 2>/dev/null || echo "?")
  log "  $table: $count rows"
done

log ""
log "Backup location: $BACKUP_DIR"
log "Done."
