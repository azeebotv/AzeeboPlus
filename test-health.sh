#!/bin/bash
# ============================================================
# Azeebo+ Health Check Smoke Test
# ============================================================
# Verifies all 29 backend services are running and healthy.
# Run: ./test-health.sh
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

pass=0; fail=0; warn=0

check() {
  local name="$1" port="$2" path="${3:-/v1/health}"
  local url="http://localhost:$port$path"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

  if [ "$status" = "200" ]; then
    echo -e "  ${GREEN}✓${RESET} ${name} (port ${port}) — HTTP ${status}"
    pass=$((pass+1))
  elif [ "$status" = "000" ]; then
    echo -e "  ${RED}✗${RESET} ${name} (port ${port}) — Connection refused"
    fail=$((fail+1))
  else
    echo -e "  ${YELLOW}⚠${RESET} ${name} (port ${port}) — HTTP ${status}"
    warn=$((warn+1))
  fi
}

echo -e "${BOLD}=== Azeebo+ Health Check Smoke Test ===${RESET}"
echo ""

# ── Core Services ───────────────────────────────────────
echo -e "${BLUE}Core Services:${RESET}"
check "auth-service"       3000
check "user-service"       3001
check "wallet-service"     3002
check "payment-service"    3003
check "content-service"    3004
check "search-service"     3005
check "media-service"      3019
check "knowledge-service"  3020
echo ""

# ── Engagement Services ────────────────────────────────
echo -e "${BLUE}Engagement Services:${RESET}"
check "notification-service" 3006
check "reward-service"       3007
check "engagement-service"   3023
check "messaging-service"    3024
check "referral-service"     3025
check "subscription-service" 3026
echo ""

# ── Intelligence Services ──────────────────────────────
echo -e "${BLUE}Intelligence Services:${RESET}"
check "analytics-service"       3008
check "recommendation-service"  3009
echo ""

# ── Universe Services ──────────────────────────────────
echo -e "${BLUE}Universe Services:${RESET}"
check "reality-service"    3010
check "movie-service"      3011
check "comedy-service"     3012
check "games-service"      3014
check "lifestyle-service"  3016
check "vertical-service"   3017
check "creator-service"    3018
check "sports-service"     3021
check "live-event-service" 3027 "/health"
echo ""

# ── Operations Services ────────────────────────────────
echo -e "${BLUE}Operations Services:${RESET}"
check "queue-service"      3015
check "moderation-service" 3022
check "support-service"    3028
echo ""

# ── Gateway ────────────────────────────────────────────
echo -e "${BLUE}Gateway:${RESET}"
check "api-gateway" 3013 "/health"
echo ""

# ── Summary ────────────────────────────────────────────
total=$((pass + fail + warn))
echo -e "${BOLD}=== Results ===${RESET}"
echo -e "  ${GREEN}Passing:${RESET} ${pass}/${total}"
if [ $warn -gt 0 ]; then
  echo -e "  ${YELLOW}Warnings:${RESET} ${warn}/${total}"
fi
if [ $fail -gt 0 ]; then
  echo -e "  ${RED}Failing:${RESET} ${fail}/${total}"
  echo ""
  echo -e "${RED}Some services are down. Check logs:${RESET}"
  echo "  tail -f /tmp/azeebo-*.log"
  exit 1
else
  echo ""
  echo -e "${GREEN}All services healthy!${RESET}"
  exit 0
fi
