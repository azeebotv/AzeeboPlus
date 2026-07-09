#!/bin/bash
set -euo pipefail

echo "========================================="
echo "Docker Smoke Tests"
echo "========================================="

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=30
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  echo "✅ PASS: $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  echo "❌ FAIL: $1 - $2"
}

check_health() {
  local endpoint="$1"
  local service="$2"
  local url="${BASE_URL}${endpoint}"
  
  if curl -sf --max-time "$TIMEOUT" "$url" > /dev/null 2>&1; then
    pass "$service health check"
  else
    fail "$service health check" "Failed to reach $url"
  fi
}

check_response_time() {
  local endpoint="$1"
  local service="$2"
  local max_time="${3:-2000}"
  local url="${BASE_URL}${endpoint}"
  
  local start_time=$(date +%s%N)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
  local end_time=$(date +%s%N)
  
  local response_time=$(( (end_time - start_time) / 1000000 ))
  
  if [ "$http_code" = "200" ] && [ "$response_time" -lt "$max_time" ]; then
    pass "$service response time (${response_time}ms < ${max_time}ms)"
  else
    fail "$service response time" "HTTP $http_code, ${response_time}ms (max: ${max_time}ms)"
  fi
}

check_content_type() {
  local endpoint="$1"
  local service="$2"
  local expected_type="${3:-application/json}"
  local url="${BASE_URL}${endpoint}"
  
  local content_type=$(curl -sI --max-time "$TIMEOUT" "$url" 2>/dev/null | grep -i "content-type" | tr -d '\r' || echo "")
  
  if echo "$content_type" | grep -qi "$expected_type"; then
    pass "$service content-type ($expected_type)"
  else
    fail "$service content-type" "Expected $expected_type, got: $content_type"
  fi
}

check_cors_headers() {
  local endpoint="$1"
  local service="$2"
  local url="${BASE_URL}${endpoint}"
  
  local headers=$(curl -sI -X OPTIONS --max-time "$TIMEOUT" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" \
    "$url" 2>/dev/null || echo "")
  
  if echo "$headers" | grep -qi "access-control-allow-origin"; then
    pass "$service CORS headers"
  else
    fail "$service CORS headers" "Missing CORS headers"
  fi
}

check_security_headers() {
  local endpoint="$1"
  local service="$2"
  local url="${BASE_URL}${endpoint}"
  
  local headers=$(curl -sI --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "")
  
  if echo "$headers" | grep -qi "strict-transport-security"; then
    pass "$service HSTS header"
  else
    fail "$service HSTS header" "Missing Strict-Transport-Security"
  fi
  
  if echo "$headers" | grep -qi "x-content-type-options"; then
    pass "$service X-Content-Type-Options header"
  else
    fail "$service X-Content-Type-Options header" "Missing X-Content-Type-Options"
  fi
  
  if echo "$headers" | grep -qi "x-frame-options"; then
    pass "$service X-Frame-Options header"
  else
    fail "$service X-Frame-Options header" "Missing X-Frame-Options"
  fi
}

echo ""
echo "Testing base URL: $BASE_URL"
echo ""

echo "--- Health Checks ---"
check_health "/api/v1/health" "API Gateway"
check_health "/api/v1/auth/health" "Auth Service"
check_health "/api/v1/users/health" "User Service"
check_health "/api/v1/wallet/health" "Wallet Service"
check_health "/api/v1/payment/health" "Payment Service"
check_health "/api/v1/content/health" "Content Service"
check_health "/api/v1/media/health" "Media Service"
check_health "/api/v1/analytics/health" "Analytics Service"
check_health "/api/v1/recommendation/health" "Recommendation Service"
check_health "/api/v1/support/health" "Support Service"
check_health "/api/v1/reality/health" "Reality Service"
check_health "/api/v1/creators/health" "Creator Service"
check_health "/api/v1/movies/health" "Movie Service"
check_health "/api/v1/games/health" "Games Service"
check_health "/api/v1/comedy/health" "Comedy Service"
check_health "/api/v1/sports/health" "Sports Service"
check_health "/api/v1/lifestyle/health" "Lifestyle Service"
check_health "/api/v1/moderation/health" "Moderation Service"
check_health "/api/v1/notifications/health" "Notification Service"
check_health "/api/v1/queue/health" "Queue Service"
check_health "/api/v1/rewards/health" "Reward Service"
check_health "/api/v1/search/health" "Search Service"
check_health "/api/v1/verticals/health" "Vertical Service"

echo ""
echo "--- Response Time Checks ---"
check_response_time "/api/v1/health" "API Gateway" 1000
check_response_time "/api/v1/auth/health" "Auth Service" 1500
check_response_time "/api/v1/content/health" "Content Service" 1500

echo ""
echo "--- Content-Type Checks ---"
check_content_type "/api/v1/health" "API Gateway" "application/json"

echo ""
echo "--- Security Headers ---"
check_security_headers "/api/v1/health" "API Gateway"

echo ""
echo "========================================="
echo "Smoke Test Results"
echo "========================================="
echo "Total:  $TOTAL_COUNT"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "========================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ Smoke tests FAILED"
  exit 1
else
  echo "✅ All smoke tests PASSED"
  exit 0
fi
