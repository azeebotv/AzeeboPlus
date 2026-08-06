#!/bin/bash
# =============================================================
# Secret Verification Script
# Validates that all required secrets from .env.example are
# defined as GitHub repository secrets (via gh CLI).
# =============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_EXAMPLE="$REPO_ROOT/.env.example"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo -e "${RED}ERROR: .env.example not found at $ENV_EXAMPLE${NC}"
  exit 1
fi

# Extract secret variable names from .env.example (skip comments and blanks)
REQUIRED_VARS=()
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$line" ]] && continue
  # Extract variable name (before the =)
  var_name="${line%%=*}"
  var_name="$(echo "$var_name" | xargs)" # trim whitespace
  [[ -n "$var_name" ]] && REQUIRED_VARS+=("$var_name")
done < "$ENV_EXAMPLE"

echo "Found ${#REQUIRED_VARS[@]} variables in .env.example"
echo ""

MISSING=()
FOUND=()

for var in "${REQUIRED_VARS[@]}"; do
  # Check if the secret exists in GitHub repository secrets
  if gh secret list --json name -q ".[].name" 2>/dev/null | grep -qx "$var"; then
    FOUND+=("$var")
  else
    MISSING+=("$var")
  fi
done

echo -e "${GREEN}FOUND: ${#FOUND[@]} secrets${NC}"
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo -e "${YELLOW}MISSING: ${#MISSING[@]} secrets${NC}"
  for m in "${MISSING[@]}"; do
    echo -e "  ${YELLOW}- $m${NC}"
  done
  echo ""
  echo -e "${YELLOW}NOTE: Missing secrets may be optional for CI or set via other mechanisms.${NC}"
  echo -e "${YELLOW}Review the list above and add any required secrets to the repository.${NC}"
  # Non-fatal: some vars are optional or set via other means
else
  echo -e "${GREEN}All secrets from .env.example are present in the repository.${NC}"
fi
