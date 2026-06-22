#!/bin/bash
# check-auth-guards.sh — CI check: fails if any controller lacks protection
# Ensures every NestJS controller is either @Public() or covered by APP_GUARD
#
# Exit codes:
#   0 = all controllers are protected
#   1 = one or more controllers are unprotected
set -euo pipefail

WORKSPACE="${1:-.}"
UNPROTECTED=0
TOTAL=0
ISSUES=""

echo "Checking auth guard coverage across all NestJS controllers..."

# Find all controller files
while IFS= read -r controller_file; do
  TOTAL=$((TOTAL + 1))
  RELATIVE_PATH="${controller_file#$WORKSPACE/}"

  # Check 1: Does the file have @Public() decorator?
  HAS_PUBLIC=$(grep -c '@Public()' "$controller_file" 2>/dev/null || true)

  # Check 2: Does the file have @UseGuards at class or method level?
  HAS_USE_GUARDS=$(grep -c '@UseGuards' "$controller_file" 2>/dev/null || true)

  # Check 3: Does the file have any @ApiBearerAuth() (indicates auth required)?
  HAS_BEARER=$(grep -c '@ApiBearerAuth' "$controller_file" 2>/dev/null || true)

  # Check 4: Is this a health controller? (always public)
  IS_HEALTH=$(echo "$RELATIVE_PATH" | grep -c 'health.controller.ts' 2>/dev/null || true)

  # Determine protection status:
  # - Has @Public() → explicitly public (OK)
  # - Has @UseGuards → explicitly guarded (OK)
  # - Is a health controller → will be marked public (OK)
  # - Has APP_GUARD in its module → globally guarded (we check for this below)
  if [ "$HAS_PUBLIC" -gt 0 ] || [ "$HAS_USE_GUARDS" -gt 0 ]; then
    continue
  fi

  # Check if the service's app.module.ts has APP_GUARD
  SERVICE_ROOT=$(echo "$RELATIVE_PATH" | sed 's|/src/.*||')
  APP_MODULE="$WORKSPACE/$SERVICE_ROOT/src/app.module.ts"

  if [ -f "$APP_MODULE" ]; then
    HAS_APP_GUARD=$(grep -c 'APP_GUARD' "$APP_MODULE" 2>/dev/null || true)
    if [ "$HAS_APP_GUARD" -gt 0 ]; then
      continue
    fi
  fi

  # If we reach here, the controller has NO protection
  UNPROTECTED=$((UNPROTECTED + 1))
  ISSUES="${ISSUES}\n  ⚠  $RELATIVE_PATH — no @Public(), @UseGuards, or APP_GUARD"

done < <(find "$WORKSPACE" -name '*.controller.ts' -path '*/src/*' ! -path '*/node_modules/*' ! -path '*/dist/*' 2>/dev/null)

echo ""
echo "========================================="
echo "  Auth Guard Coverage Report"
echo "========================================="
echo "  Total controllers:  $TOTAL"
echo "  Unprotected:        $UNPROTECTED"
echo ""

if [ "$UNPROTECTED" -gt 0 ]; then
  echo "❌ FAIL — $UNPROTECTED controller(s) have no auth protection:"
  echo -e "$ISSUES"
  echo ""
  echo "Fix: Add one of the following to each controller:"
  echo "  1. @Public() decorator (for public routes)"
  echo "  2. @UseGuards(AuthGuard('jwt')) (for specific route protection)"
  echo "  3. Ensure APP_GUARD is registered in the service's app.module.ts"
  echo ""
  exit 1
else
  echo "✅ PASS — All $TOTAL controllers are protected"
  exit 0
fi
