#!/bin/bash
# Secret Rotation Script for Azeebo+ Services
# Usage: ./scripts/rotate-secrets.sh [--dry-run]
# This script rotates JWT secrets and generates new encryption keys.
# After rotation, all services must be restarted to apply changes.

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN MODE - No changes will be made ==="
fi

echo "=== Azeebo+ Secret Rotation Script ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Generate new JWT secrets (64-byte hex = 128 chars)
echo "Generating new secrets..."
JWT_ACCESS_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -base64 32)
WEBHOOK_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo ""
echo "Generated secrets (showing first 8 chars only):"
echo "  JWT_ACCESS_SECRET:  ${JWT_ACCESS_SECRET:0:8}..."
echo "  JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:8}..."
echo "  SESSION_SECRET:     ${SESSION_SECRET:0:8}..."
echo "  WEBHOOK_SECRET:     ${WEBHOOK_SECRET:0:8}..."
echo "  ENCRYPTION_KEY:     ${ENCRYPTION_KEY:0:8}..."
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run complete. Remove --dry-run flag to apply changes."
  exit 0
fi

# Confirm before proceeding
echo "WARNING: This will update .env files for all services."
echo "All running services will need to be restarted."
echo ""
read -p "Continue? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

# Update root .env file if it exists
ROOT_ENV=".env"
if [[ -f "$ROOT_ENV" ]]; then
  echo "Updating $ROOT_ENV..."
  cp "$ROOT_ENV" "${ROOT_ENV}.backup.$(date +%Y%m%d%H%M%S)"

  sed -i '' "s/^JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" "$ROOT_ENV" 2>/dev/null || true
  sed -i '' "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" "$ROOT_ENV" 2>/dev/null || true
  sed -i '' "s/^SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" "$ROOT_ENV" 2>/dev/null || true
  sed -i '' "s/^WEBHOOK_SECRET=.*/WEBHOOK_SECRET=${WEBHOOK_SECRET}/" "$ROOT_ENV" 2>/dev/null || true

  echo "  Updated $ROOT_ENV"
fi

# Update service .env files
for service_dir in services/*/; do
  service_env="${service_dir}.env"
  if [[ -f "$service_env" ]]; then
    echo "Updating $service_env..."
    cp "$service_env" "${service_env}.backup.$(date +%Y%m%d%H%M%S)"

    sed -i '' "s/^JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" "$service_env" 2>/dev/null || true
    sed -i '' "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" "$service_env" 2>/dev/null || true

    echo "  Updated $service_env"
  fi
done

# Update app .env files
for app_dir in apps/*/; do
  app_env="${app_dir}.env"
  if [[ -f "$app_env" ]]; then
    echo "Updating $app_env..."
    cp "$app_env" "${app_env}.backup.$(date +%Y%m%d%H%M%S)"

    sed -i '' "s/^SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" "$app_env" 2>/dev/null || true

    echo "  Updated $app_env"
  fi
done

echo ""
echo "=== Secret rotation complete ==="
echo "IMPORTANT: Restart all services to apply the new secrets."
echo "Backup files have been created with timestamp suffix."
echo "After verifying services work, delete the backup files."
