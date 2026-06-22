#!/bin/bash
# check-mutation-score.sh — CI check: runs Stryker mutation testing on critical services
# and fails if any service's mutation score drops below the configured threshold.
#
# Exit codes:
#   0 = all services pass mutation score threshold
#   1 = one or more services fail mutation score threshold
set -euo pipefail

WORKSPACE="${1:-.}"
MIN_SCORE="${2:-60}"
FAILED=0
RESULTS=""
SERVICES=(
  "services/core/auth-service"
  "services/core/payment-service"
  "services/core/wallet-service"
)

echo "========================================="
echo "  Mutation Testing — Critical Services"
echo "========================================="
echo "  Minimum score: ${MIN_SCORE}%"
echo "  Services: ${#SERVICES[@]}"
echo ""

for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="$WORKSPACE/$SERVICE"

  if [ ! -d "$SERVICE_DIR" ]; then
    echo "⚠  SKIP — $SERVICE directory not found"
    continue
  fi

  if [ ! -f "$SERVICE_DIR/stryker.config.json" ]; then
    echo "⚠  SKIP — $SERVICE has no stryker.config.json"
    continue
  fi

  echo "-----------------------------------------"
  echo "  Running: $SERVICE"
  echo "-----------------------------------------"

  cd "$SERVICE_DIR"

  # Run stryker and capture output
  if STRYKER_OUTPUT=$(npx stryker run --fileLogLevel warn 2>&1); then
    # Extract the mutation score from Stryker output
    # Stryker reports: "Mutation score: X.XX" or "all tests passed X%"
    SCORE=$(echo "$STRYKER_OUTPUT" | grep -oE 'Mutation score[^0-9]*([0-9]+\.?[0-9]*)' | grep -oE '[0-9]+\.?[0-9]*' | tail -1 || true)

    # Fallback: look for the kill rate percentage
    if [ -z "$SCORE" ]; then
      SCORE=$(echo "$STRYKER_OUTPUT" | grep -oE 'All tests passed! \(([0-9]+\.?[0-9]*)%\)' | grep -oE '[0-9]+\.?[0-9]*' || true)
    fi

    # Fallback: look for "mutant survived" line with score
    if [ -z "$SCORE" ]; then
      SCORE=$(echo "$STRYKER_OUTPUT" | grep -oE 'Mutation score: [0-9]+\.?[0-9]*' | grep -oE '[0-9]+\.?[0-9]*' || true)
    fi

    # Fallback: look for "Killed:" percentage
    if [ -z "$SCORE" ]; then
      SCORE=$(echo "$STRYKER_OUTPUT" | grep -iE 'killed' | grep -oE '[0-9]+\.?[0-9]*%' | head -1 | tr -d '%' || true)
    fi

    # Fallback: look for any percentage in summary
    if [ -z "$SCORE" ]; then
      SCORE=$(echo "$STRYKER_OUTPUT" | grep -oE '[0-9]+\.?[0-9]*%' | head -1 | tr -d '%' || true)
    fi

    if [ -z "$SCORE" ]; then
      echo "  ⚠  WARNING — Could not parse mutation score from output"
      echo "  Raw output (last 10 lines):"
      echo "$STRYKER_OUTPUT" | tail -10 | sed 's/^/    /'
      FAILED=$((FAILED + 1))
      RESULTS="${RESULTS}\n  ✗ $SERVICE — score unparseable"
      continue
    fi

    # Compare score to threshold using integer comparison
    SCORE_INT=$(printf '%.0f' "$SCORE")

    if [ "$SCORE_INT" -ge "$MIN_SCORE" ]; then
      echo "  ✓ Score: ${SCORE}% (threshold: ${MIN_SCORE}%)"
      RESULTS="${RESULTS}\n  ✓ $SERVICE — ${SCORE}%"
    else
      echo "  ✗ Score: ${SCORE}% — BELOW threshold of ${MIN_SCORE}%"
      FAILED=$((FAILED + 1))
      RESULTS="${RESULTS}\n  ✗ $SERVICE — ${SCORE}% (below ${MIN_SCORE}%)"
    fi
  else
    echo "  ✗ Stryker run failed"
    echo "$STRYKER_OUTPUT" | tail -20 | sed 's/^/    /'
    FAILED=$((FAILED + 1))
    RESULTS="${RESULTS}\n  ✗ $SERVICE — stryker run failed"
  fi

  cd "$WORKSPACE"
done

echo ""
echo "========================================="
echo "  Mutation Score Summary"
echo "========================================="
echo -e "$RESULTS"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo "❌ FAIL — $FAILED service(s) below ${MIN_SCORE}% mutation score"
  echo ""
  echo "Remediation:"
  echo "  1. Add more targeted unit tests for surviving mutants"
  echo "  2. Review mutator output: reports/stryker-reports/HTML"
  echo "  3. Run locally: cd <service> && npm run test:mutate"
  echo ""
  exit 1
else
  echo "✅ PASS — All services meet mutation score threshold (${MIN_SCORE}%)"
  exit 0
fi
