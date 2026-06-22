#!/bin/bash
# Secret Verification Script - Checks for hardcoded secrets in codebase
# This should be run in CI pipeline before deployment

set -euo pipefail

echo "Running secret verification scan..."

# Patterns to check for
PATTERNS=(
  "aws_access_key.*AK[A-Z0-9]{16}"
  "aws_secret_access_key.*[A-Za-z0-9/+=]{40}"
  "password.*['\"].{8,}['\"]"
  "secret.*['\"].{16,}['\"]"
  "api_key.*['\"][A-Za-z0-9]{32,}['\"]"
  "JWT_SECRET.*['\"][^'\"]{32,}['\"]"
  "sk_live_[a-z]+"
  "sk_test_[a-z]+"
  "pk_live_[a-z]+"
  "pk_test_[a-z]+"
)

EXIT_CODE=0
CHECKED_FILES=0

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -r "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.json" . \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null || true)

  if [[ -n "$MATCHES" ]]; then
    echo "ERROR: Found potential hardcoded secret matching pattern: $pattern"
    echo "$MATCHES"
    EXIT_CODE=1
  fi
done

# Check for secrets.yaml files with actual values
if grep -r "data:" --include="*secrets*.yaml" . --exclude-dir=.git 2>/dev/null | grep -v "data: {}" | grep -v "<PLACEHOLDER>"; then
  echo "ERROR: Found secrets.yaml with hardcoded values"
  EXIT_CODE=1
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ No hardcoded secrets found"
else
  echo "❌ Secret verification failed - please review the output above"
fi

exit $EXIT_CODE