#!/usr/bin/env bash
# =============================================================================
# Azeebo+ All-in-One Demo Content Deploy
# Runs schema + seed SQL against every service database.
# Usage: ./deploy-all-in-one.sh
#   Requires: PGPASSWORD or DATABASE_URL environment variables
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# --- Configuration ---
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-azeebo}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"

export PGPASSWORD="$DB_PASSWORD"

# All service databases
DATABASES=(
  azeebo_auth
  azeebo_user
  azeebo_wallet
  azeebo_payment
  azeebo_content
  azeebo_search
  azeebo_notification
  azeebo_reward
  azeebo_analytics
  azeebo_recommendation
  azeebo_reality
  azeebo_movie
  azeebo_comedy
  azeebo_games
  azeebo_queue
  azeebo_lifestyle
  azeebo_vertical
  azeebo_creator
  azeebo_media
  azeebo_support
  azeebo_sports
  azeebo_moderation
  azeebo_engagement
  azeebo_messaging
  azeebo_referral
  azeebo_subscription
  azeebo_admin
  azeebo_creator
)

log() { echo "[demo-all-in-one] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
die() { log "FATAL: $*"; exit 1; }

# --- Pre-flight checks ---
command -v psql >/dev/null 2>&1 || die "psql not found. Install PostgreSQL client."

log "Deploying demo content to all-in-one databases..."
log "Host: $DB_HOST:$DB_PORT  User: $DB_USER"

# Check connectivity
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1 || \
  die "Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"

SCHEMA_SQL="$MIGRATIONS_DIR/001_create_all_tables.sql"
SEED_SQL="$MIGRATIONS_DIR/002_seed_demo_data.sql"

test -f "$SCHEMA_SQL" || die "Schema SQL not found: $SCHEMA_SQL"
test -f "$SEED_SQL" || die "Seed SQL not found: $SEED_SQL"

# --- Deploy to each database ---
SUCCESS=0
FAILED=0
SKIPPED=0

for DB_NAME in "${DATABASES[@]}"; do
  # Check if database exists
  EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -A -c \
    "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

  if [ "$EXISTS" != "1" ]; then
    log "  SKIP: $DB_NAME (does not exist)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  log "  Deploying to $DB_NAME..."

  # Run schema (idempotent — IF NOT EXISTS everywhere)
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_SQL" >/dev/null 2>&1; then
    log "    Schema OK"
  else
    log "    WARNING: Schema had errors for $DB_NAME (may already exist)"
  fi

  # Run seed data (ON CONFLICT DO NOTHING — safe for re-runs)
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_SQL" >/dev/null 2>&1; then
    log "    Seed OK"
    SUCCESS=$((SUCCESS + 1))
  else
    log "    WARNING: Seed had errors for $DB_NAME (may have constraint issues)"
    FAILED=$((FAILED + 1))
  fi
done

# --- Summary ---
log ""
log "=== Demo Content Deploy Complete ==="
log "  Success: $SUCCESS"
log "  Failed:  $FAILED"
log "  Skipped: $SKIPPED"
log "  Total:   ${#DATABASES[@]}"
log ""

# Count records in key tables across all databases
for DB_NAME in "${DATABASES[@]}"; do
  EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -A -c \
    "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
  [ "$EXISTS" = "1" ] || continue

  COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "?")
  log "  $DB_NAME: $COUNT tables"
done

log ""
log "Done."
