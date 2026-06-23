#!/usr/bin/env bash
# =============================================================================
# Azeebo+ Demo Content Status Script
# Shows current demo version, deployed data counts, and health checks.
# Usage: ./status.sh [environment]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/VERSION"

ENV="${1:-local}"

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
    ;;
  *)
    echo "Usage: $0 [local|staging]"
    exit 1
    ;;
esac

PSQL_BASE="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
if [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

log() { echo "[demo-status] $*"; }

# File version
FILE_VERSION="unknown"
if [ -f "$VERSION_FILE" ]; then
  FILE_VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
fi

echo ""
echo "============================================="
echo "  Azeebo+ Demo Content Status"
echo "============================================="
echo ""
echo "  Environment:     $ENV"
echo "  File Version:    $FILE_VERSION"
echo "  Database:        $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""

# Check connectivity
if ! $PSQL_BASE -c "SELECT 1" >/dev/null 2>&1; then
  echo "  Status:          OFFLINE (cannot connect to database)"
  echo ""
  echo "============================================="
  exit 1
fi

echo "  Status:          ONLINE"
echo ""

# DB version from demo_content_versions
DB_VERSION=$($PSQL_BASE -t -A -c "
  SELECT version FROM demo_content_versions ORDER BY \"deployedAt\" DESC LIMIT 1
" 2>/dev/null || echo "none")
echo "  DB Version:      $DB_VERSION"
echo ""

# Deployment history
echo "  --- Deployment History ---"
$PSQL_BASE -c "
  SELECT version, \"deployedBy\", status,
         to_char(\"deployedAt\", 'YYYY-MM-DD HH24:MI') as deployed_at
  FROM demo_content_versions
  ORDER BY \"deployedAt\" DESC
  LIMIT 5
" 2>/dev/null || echo "  (no version history)"
echo ""

# Data counts
echo "  --- Data Counts ---"
printf "  %-30s %s\n" "Table" "Rows"
printf "  %-30s %s\n" "-----" "----"

TABLES=(
  "auth_users:Users"
  "user_roles:User Roles"
  "user_profiles:User Profiles"
  "universes:Universes"
  "categories:Categories"
  "tags:Tags"
  "content_items:Content Items"
  "content_categories:Content-Category Links"
  "content_tags:Content-Tag Links"
  "media_assets:Media Assets"
  "content_relationships:Content Relationships"
  "comments:Comments"
  "rentals:Rentals"
  "passes:Passes"
  "screenings:Screenings"
  "locked_extras:Locked Extras"
  "watch_history:Watch History"
  "wallets:Wallets"
  "wallet_transactions:Wallet Transactions"
  "subscriptions:Subscriptions"
  "system_settings:System Settings"
  "audit_logs:Audit Logs"
)

for entry in "${TABLES[@]}"; do
  table="${entry%%:*}"
  label="${entry#*:}"
  count=$($PSQL_BASE -t -A -c "SELECT COUNT(*) FROM \"$table\"" 2>/dev/null || echo "-")
  printf "  %-30s %s\n" "$label" "$count"
done

echo ""

# Health checks
echo "  --- Health Checks ---"

# Check for orphaned content
ORPHANED=$($PSQL_BASE -t -A -c "
  SELECT COUNT(*) FROM content_items c
  LEFT JOIN auth_users u ON c.\"creatorId\" = u.id
  WHERE u.id IS NULL
" 2>/dev/null || echo "?")
if [ "$ORPHANED" = "0" ]; then
  echo "  [OK] No orphaned content items"
elif [ "$ORPHANED" = "?" ]; then
  echo "  [??] Could not check orphaned content"
else
  echo "  [WARN] $ORPHANED orphaned content items (no valid creator)"
fi

# Check wallets have valid users
ORPHAN_WALLETS=$($PSQL_BASE -t -A -c "
  SELECT COUNT(*) FROM wallets w
  LEFT JOIN auth_users u ON w.\"userId\" = u.id
  WHERE u.id IS NULL
" 2>/dev/null || echo "?")
if [ "$ORPHAN_WALLETS" = "0" ]; then
  echo "  [OK] All wallets linked to valid users"
elif [ "$ORPHAN_WALLETS" = "?" ]; then
  echo "  [??] Could not check wallet integrity"
else
  echo "  [WARN] $ORPHAN_WALLETS orphaned wallets"
fi

# Check content has at least one exclusive or premiere
FEATURED=$($PSQL_BASE -t -A -c "
  SELECT COUNT(*) FROM content_items WHERE \"isExclusive\" = true OR \"isPremiere\" = true
" 2>/dev/null || echo "0")
if [ "$FEATURED" != "0" ]; then
  echo "  [OK] $FEATURED featured content items (exclusive/premiere)"
else
  echo "  [WARN] No featured content items (exclusive/premiere)"
fi

# Check content has at least one trending-eligible
TRENDING=$($PSQL_BASE -t -A -c "
  SELECT COUNT(*) FROM content_items WHERE \"viewCount\" > 0
" 2>/dev/null || echo "0")
if [ "$TRENDING" != "0" ]; then
  echo "  [OK] $TRENDING content items with views (trending-eligible)"
else
  echo "  [WARN] No content with view counts"
fi

# Check for active admin
ADMIN=$($PSQL_BASE -t -A -c "
  SELECT COUNT(*) FROM auth_users WHERE status = 'active' AND email = 'admin@azeebo.com'
" 2>/dev/null || echo "0")
if [ "$ADMIN" != "0" ]; then
  echo "  [OK] Admin user exists (admin@azeebo.com)"
else
  echo "  [WARN] No active admin user"
fi

echo ""
echo "============================================="
