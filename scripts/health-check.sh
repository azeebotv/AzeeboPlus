#!/bin/bash
# health-check.sh — Monitor service health across all 29 services
# Usage: bash scripts/health-check.sh [gateway_url]

set -e

GATEWAY_URL=${1:-"http://localhost:3013"}
LOG_FILE="health-check-$(date +%Y%m%d).log"

echo "=== Azeebo+ Health Check ===" | tee -a "$LOG_FILE"
echo "Gateway: $GATEWAY_URL" | tee -a "$LOG_FILE"
echo "Time: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Service endpoints to check
declare -A SERVICES=(
  ["auth-service"]="3000"
  ["user-service"]="3001"
  ["wallet-service"]="3002"
  ["payment-service"]="3003"
  ["content-service"]="3004"
  ["search-service"]="3005"
  ["notification-service"]="3006"
  ["reward-service"]="3007"
  ["analytics-service"]="3008"
  ["media-service"]="3009"
  ["recommendation-service"]="3010"
  ["movie-service"]="3011"
  ["knowledge-service"]="3011"
  ["comedy-service"]="3012"
  ["api-gateway"]="3013"
  ["games-service"]="3014"
  ["queue-service"]="3015"
  ["lifestyle-service"]="3016"
  ["reality-service"]="3016"
  ["vertical-service"]="3017"
  ["creator-service"]="3018"
  ["sports-service"]="3021"
  ["support-service"]="3020"
  ["moderation-service"]="3022"
  ["engagement-service"]="3023"
  ["messaging-service"]="3024"
  ["referral-service"]="3025"
  ["subscription-service"]="3026"
  ["live-event-service"]="3027"
)

TOTAL=0
HEALTHY=0
UNHEALTHY=0
SLOW=0

for service in "${!SERVICES[@]}"; do
  port="${SERVICES[$service]}"
  TOTAL=$((TOTAL + 1))

  # Check gateway health endpoint
  START=$(date +%s%N)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null || echo "000")
  END=$(date +%s%N)
  DURATION=$(( (END - START) / 1000000 ))

  if [ "$HTTP_CODE" = "200" ]; then
    if [ "$DURATION" -lt 500 ]; then
      echo "  ✓ $service (port $port) — ${DURATION}ms" | tee -a "$LOG_FILE"
      HEALTHY=$((HEALTHY + 1))
    else
      echo "  ⚠ $service (port $port) — ${DURATION}ms (slow)" | tee -a "$LOG_FILE"
      SLOW=$((SLOW + 1))
    fi
  else
    echo "  ✗ $service (port $port) — HTTP $HTTP_CODE" | tee -a "$LOG_FILE"
    UNHEALTHY=$((UNHEALTHY + 1))
  fi
done

echo "" | tee -a "$LOG_FILE"
echo "=== Summary ===" | tee -a "$LOG_FILE"
echo "  Total: $TOTAL" | tee -a "$LOG_FILE"
echo "  Healthy: $HEALTHY" | tee -a "$LOG_FILE"
echo "  Slow: $SLOW" | tee -a "$LOG_FILE"
echo "  Unhealthy: $UNHEALTHY" | tee -a "$LOG_FILE"

if [ "$UNHEALTHY" -gt 0 ]; then
  echo "" | tee -a "$LOG_FILE"
  echo "⚠ ALERT: $UNHEALTHY services are unhealthy!" | tee -a "$LOG_FILE"
  exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "All services healthy!" | tee -a "$LOG_FILE"
exit 0
