#!/bin/bash
# verify-contracts.sh — CI step: runs Pact consumer contract tests
# and outputs pact files to the pacts/ directory.
#
# Exit codes:
#   0 = all contract tests passed
#   1 = one or more contract tests failed
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACTS_DIR="${WORKSPACE_ROOT}/pacts"

echo "========================================="
echo "  Pact Contract Test Verification"
echo "========================================="
echo ""

# Ensure pacts directory exists and is clean for this run
rm -rf "${PACTS_DIR}"
mkdir -p "${PACTS_DIR}"

echo "Running consumer contract tests..."
echo ""

# Run the contract tests from the contract-tests package
if pnpm --filter @azeebo/contract-tests test:contracts 2>&1; then
  TEST_EXIT=0
else
  TEST_EXIT=$?
fi

echo ""

# Check if pact files were generated
PACT_COUNT=$(find "${PACTS_DIR}" -name '*.json' -path '*pacts*' 2>/dev/null | wc -l | tr -d ' ')

if [ "$PACT_COUNT" -eq 0 ]; then
  # Also check the package-level pacts dir
  PKG_PACTS="${WORKSPACE_ROOT}/packages/contract-tests/pacts"
  if [ -d "$PKG_PACTS" ]; then
    cp -r "$PKG_PACTS/"* "${PACTS_DIR}/" 2>/dev/null || true
    PACT_COUNT=$(find "${PACTS_DIR}" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')
  fi
fi

echo "========================================="
echo "  Contract Test Results"
echo "========================================="

if [ "$TEST_EXIT" -eq 0 ]; then
  echo "  Status:   PASS"
  echo "  Pacts:    ${PACT_COUNT} file(s) generated"
  echo "  Output:   ${PACTS_DIR}"
  echo ""
  echo "Pact files:"
  find "${PACTS_DIR}" -name '*.json' -exec echo "  - {}" \; 2>/dev/null || true
  echo ""
  exit 0
else
  echo "  Status:   FAIL"
  echo "  Pacts:    ${PACT_COUNT} file(s) generated (partial)"
  echo "  Output:   ${PACTS_DIR}"
  echo ""
  echo "Contract tests failed. Check the output above for details."
  exit 1
fi
