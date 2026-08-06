#!/bin/bash
# =============================================================
# Validate Analytics Events Script
# Checks that analytics event types used in test/spec files
# match the ALLOWED_EVENT_NAMES in the analytics service.
# =============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ANALYTICS_SERVICE="$REPO_ROOT/services/intelligence/analytics-service/src/modules/analytics/analytics.service.ts"

if [[ ! -f "$ANALYTICS_SERVICE" ]]; then
  echo -e "${RED}ERROR: Analytics service not found at $ANALYTICS_SERVICE${NC}"
  exit 1
fi

echo "Extracting ALLOWED_EVENT_NAMES from analytics service..."
echo ""

# Extract allowed event names from the source file
ALLOWED_EVENTS=$(sed -n '/^const ALLOWED_EVENT_NAMES/,/\];/p' "$ANALYTICS_SERVICE" \
  | grep -oE "'[a-z]+(_[a-z]+)*'" \
  | tr -d "'" \
  | sort -u)

if [[ -z "$ALLOWED_EVENTS" ]]; then
  echo -e "${RED}ERROR: Could not extract ALLOWED_EVENT_NAMES from analytics service${NC}"
  exit 1
fi

echo "Found allowed events:"
echo "$ALLOWED_EVENTS" | sed 's/^/  - /'
echo ""

# Find all event type references in test/spec files within analytics-service
USED_EVENTS=$(grep -rn --include='*.spec.ts' --include='*.spec.tsx' \
  "type:" "$REPO_ROOT/services/intelligence/analytics-service/src" 2>/dev/null \
  | grep -oE "type:[[:space:]]*'[a-z]+(_[a-z]+)*'" \
  | sed -E "s/type:[[:space:]]*'([a-z]+(_[a-z]+)*)'/\1/" \
  | sort -u)

# Known test-only event types (used in spec files for validation testing)
TEST_EVENT_TYPES=(
  "custom_event"
  "invalid_event_name"
)

ERRORS=0

for event in $USED_EVENTS; do
  # Skip known test-only types
  is_test=false
  for test_event in "${TEST_EVENT_TYPES[@]}"; do
    if [[ "$event" == "$test_event" ]]; then
      is_test=true
      break
    fi
  done
  [[ "$is_test" == "true" ]] && continue

  if ! echo "$ALLOWED_EVENTS" | grep -qx "$event"; then
    echo -e "${YELLOW}WARNING: '$event' used in specs but not in ALLOWED_EVENT_NAMES${NC}"
    ((ERRORS++)) || true
  fi
done

echo ""
echo "============================================"
echo -e "Allowed events: $(echo "$ALLOWED_EVENTS" | wc -l | xargs)"
echo -e "Errors: $ERRORS"
echo "============================================"

if [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}Validation FAILED: $ERRORS unknown event types found${NC}"
  exit 1
fi

echo -e "${GREEN}Analytics event validation passed.${NC}"
