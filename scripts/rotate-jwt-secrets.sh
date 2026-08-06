#!/usr/bin/env bash
# ===========================================================================
# JWT Secret Rotation Script
# ===========================================================================
# Generates cryptographically secure JWT secrets using OpenSSL and provides
# instructions for updating them across the Azeebo+ platform.
#
# Usage:
#   chmod +x scripts/rotate-jwt-secrets.sh
#   ./scripts/rotate-jwt-secrets.sh
#   ./scripts/rotate-jwt-secrets.sh --apply    # Apply to .env.local (dev only)
# ===========================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Azeebo+ JWT Secret Rotation Tool        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
if ! command -v openssl &>/dev/null; then
  echo -e "${RED}ERROR: OpenSSL is required but not installed.${NC}"
  echo "Install it with: brew install openssl (macOS) or apt install openssl (Linux)"
  exit 1
fi

# Generate 256-bit (32-byte) hex secrets
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
GATEWAY_SECRET=$(openssl rand -hex 32)
INTERNAL_API_KEY=$(openssl rand -hex 32)

echo -e "${GREEN}✓ Generated cryptographically secure secrets${NC}"
echo ""

echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  NEW SECRETS (save these safely)${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}JWT_ACCESS_SECRET=${NC}${JWT_ACCESS_SECRET}"
echo -e "  ${BLUE}JWT_REFRESH_SECRET=${NC}${JWT_REFRESH_SECRET}"
echo -e "  ${BLUE}GATEWAY_SECRET=${NC}${GATEWAY_SECRET}"
echo -e "  ${BLUE}INTERNAL_API_KEY=${NC}${INTERNAL_API_KEY}"
echo ""
echo -e "${YELLOW}────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}  All secrets are 64 hex characters (256-bit)${NC}"
echo -e "${YELLOW}────────────────────────────────────────────────${NC}"
echo ""

# Check existing .env files for placeholder values
echo -e "${BLUE}Checking existing .env files for placeholders...${NC}"
echo ""
PLACEHOLDER_FILES=()

for env_file in .env .env.docker .env.production .env.example deploy/staging.env; do
  if [ -f "$env_file" ]; then
    if grep -qE '<generate|change\.me|your-.*-here|REPLACE_WITH|placeholder' "$env_file" 2>/dev/null; then
      echo -e "  ${YELLOW}⚠ $env_file contains placeholder values${NC}"
      PLACEHOLDER_FILES+=("$env_file")
    else
      echo -e "  ${GREEN}✓ $env_file looks clean${NC}"
    fi
  fi
done

echo ""

if [ ${#PLACEHOLDER_FILES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Files with placeholders that need updating:${NC}"
  for f in "${PLACEHOLDER_FILES[@]}"; do
    echo "  - $f"
  done
  echo ""
fi

# Check .env.local for secrets
if [ -f .env.local ]; then
  ACCESS_LEN=$(grep 'JWT_ACCESS_SECRET' .env.local | cut -d'=' -f2 | wc -c 2>/dev/null || echo 0)
  if [ "$ACCESS_LEN" -ge 64 ]; then
    echo -e "${GREEN}✓ .env.local already has secrets (${ACCESS_LEN} chars)${NC}"
  fi
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INSTRUCTIONS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "To update your .env.local (development only):"
echo "  ./scripts/rotate-jwt-secrets.sh --apply"
echo ""
echo "To update .env.production (staging/production):"
echo "  1. Copy the secrets above"
echo "  2. Update .env.production with them"
echo "  3. Update deploy/staging.env"
echo "  4. Update any CI/CD secrets"
echo ""
echo "After updating all environments, run:"
echo "  ./scripts/verify-ssl.sh  (to check SSL)"
echo "  pnpm run typecheck        (to verify no issues)"
echo ""

# Apply mode
if [ "${1:-}" = "--apply" ]; then
  if [ ! -f .env.local ]; then
    echo -e "${RED}ERROR: .env.local not found. Run this from the project root.${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Applying new secrets to .env.local...${NC}"

  # Cross-platform sed invocation (macOS needs '' for no backup, Linux doesn't)
  SED_OPTS="-i"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_OPTS="-i ''"
  fi

  # shellcheck disable=SC2086
  sed $SED_OPTS "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}|" .env.local
  # shellcheck disable=SC2086
  sed $SED_OPTS "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|" .env.local
  # shellcheck disable=SC2086
  sed $SED_OPTS "s|^GATEWAY_SECRET=.*|GATEWAY_SECRET=${GATEWAY_SECRET}|" .env.local
  # shellcheck disable=SC2086
  sed $SED_OPTS "s|^INTERNAL_API_KEY=.*|INTERNAL_API_KEY=${INTERNAL_API_KEY}|" .env.local

  echo -e "${GREEN}✓ .env.local updated successfully${NC}"
  echo ""
  echo -e "${YELLOW}NOTE: These are for local development only.${NC}"
  echo -e "${YELLOW}For production, use a secrets manager (Vault, AWS Secrets Manager, etc.)${NC}"
fi

echo "Done."
