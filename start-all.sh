#!/bin/bash
# ============================================================
# Azeebo+ Full Local Development Start
# ============================================================
# Starts ALL 29 backend services + 3 frontend apps.
# Run this in your terminal:
#   ./start-all.sh
#
# To stop everything:
#   ./stop-all.sh
# ============================================================

set -euo pipefail
cd "$(dirname "$0")"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${RESET} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${RESET} $1"; }
fail() { echo -e "  ${RED}[FAIL]${RESET} $1"; }
info() { echo -e "  ${BLUE}[..]${RESET} $1"; }

# ── Load Environment ────────────────────────────────────────
echo -e "${BOLD}=== Loading Environment ===${RESET}"
set -a
source .env 2>/dev/null || true
[ -f .env.local ] && source .env.local 2>/dev/null || true
set +a

export NODE_ENV=development
export REDIS_URL="redis://localhost:6379"
export ALLOWED_ORIGINS="http://localhost:4000,http://localhost:4014,http://localhost:4016,http://localhost:4100,http://localhost:4104"
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_REGION="us-east-1"
export AWS_S3_BUCKET="azeebo-media-dev"

# Service URLs
export AUTH_SERVICE_URL="http://localhost:3000"
export USER_SERVICE_URL="http://localhost:3001"
export WALLET_SERVICE_URL="http://localhost:3002"
export PAYMENT_SERVICE_URL="http://localhost:3003"
export CONTENT_SERVICE_URL="http://localhost:3004"
export SEARCH_SERVICE_URL="http://localhost:3005"
export NOTIFICATION_SERVICE_URL="http://localhost:3006"
export REWARD_SERVICE_URL="http://localhost:3007"
export ANALYTICS_SERVICE_URL="http://localhost:3008"
export RECOMMENDATION_SERVICE_URL="http://localhost:3009"
export REALITY_SERVICE_URL="http://localhost:3010"
export MOVIE_SERVICE_URL="http://localhost:3011"
export COMEDY_SERVICE_URL="http://localhost:3012"
export GAMES_SERVICE_URL="http://localhost:3014"
export QUEUE_SERVICE_URL="http://localhost:3015"
export LIFESTYLE_SERVICE_URL="http://localhost:3016"
export VERTICAL_SERVICE_URL="http://localhost:3017"
export CREATOR_SERVICE_URL="http://localhost:3018"
export MEDIA_SERVICE_URL="http://localhost:3019"
export KNOWLEDGE_SERVICE_URL="http://localhost:3020"
export SPORTS_SERVICE_URL="http://localhost:3021"
export MODERATION_SERVICE_URL="http://localhost:3022"
export ENGAGEMENT_SERVICE_URL="http://localhost:3023"
export MESSAGING_SERVICE_URL="http://localhost:3024"
export REFERRAL_SERVICE_URL="http://localhost:3025"
export SUBSCRIPTION_SERVICE_URL="http://localhost:3026"
export LIVE_EVENT_SERVICE_URL="http://localhost:3027"
export SUPPORT_SERVICE_URL="http://localhost:3028"
export API_GATEWAY_URL="http://localhost:3013"

# ── Secret Consistency Preflight ────────────────────────────
# Do this before clearing ports or starting any process. Every checked env file
# must use the same local-development signing and gateway secrets as the root
# env; otherwise a service can boot successfully but reject tokens from the
# gateway/auth service (or create a different trust domain).
read_env_value() {
  local file="$1" key="$2" value
  value=$(sed -n -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$file" | head -1)
  value="${value%$'\r'}"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
  esac
  printf '%s' "$value"
}

check_secret_preflight() {
  local key canonical file value issue idx
  local failed=0
  local -a secret_keys=(JWT_ACCESS_SECRET JWT_REFRESH_SECRET GATEWAY_SECRET)
  local -a env_files=() issue_files=() issue_values=()

  while IFS= read -r file; do
    [ -n "$file" ] && env_files+=("$file")
  done < <(find services -type f -name .env -print | sort)
  # The admin backend is an independently booted NestJS service and must share
  # the same JWT trust domain even though it lives under apps/.
  [ -f apps/admin/.env ] && env_files+=("apps/admin/.env")

  for key in "${secret_keys[@]}"; do
    canonical=$(printenv "$key" 2>/dev/null || true)
    if [ -z "$canonical" ]; then
      fail "root environment is missing $key"
      failed=1
      continue
    fi
    case "$canonical" in
      change-me*|changeme*|placeholder*|replace-me*|your-*|dummy*|example*|test-*)
        fail "root environment contains a placeholder for $key"
        failed=1
        ;;
    esac

    for file in "${env_files[@]}"; do
      value=$(read_env_value "$file" "$key")
      issue=""
      if [ -z "$value" ]; then
        issue="missing $key"
      elif [ "$value" != "$canonical" ]; then
        issue="mismatched $key"
      fi
      [ -z "$issue" ] && continue

      failed=1
      idx=0
      while [ "$idx" -lt "${#issue_files[@]}" ] && [ "${issue_files[$idx]}" != "$file" ]; do
        idx=$((idx + 1))
      done
      if [ "$idx" -eq "${#issue_files[@]}" ]; then
        issue_files+=("$file")
        issue_values+=("$issue")
      else
        issue_values[$idx]="${issue_values[$idx]}, $issue"
      fi
    done
  done

  if [ "$failed" -ne 0 ]; then
    idx=0
    while [ "$idx" -lt "${#issue_files[@]}" ]; do
      fail "${issue_files[$idx]}: ${issue_values[$idx]}"
      idx=$((idx + 1))
    done
    fail "secret preflight failed; no services were started"
    echo "  Update the listed env files from the local root secret values, then rerun ./start-all.sh."
    return 1
  fi

  ok "JWT and gateway secrets match root environment across ${#env_files[@]} env files"
}

if ! check_secret_preflight; then
  exit 1
fi

# ── Admin DB Federation ────────────────────────────────────
# azeebo_admin serves the panel from foreign tables over the live per-service
# databases (reads AND writes). Re-run (idempotent) so a fresh checkout or a
# dropped/created admin DB picks up federation before the backend boots. A
# failed run is not fatal: the mirror seed remains as a fallback path.
if [ -f scripts/database/federate-admin-db.sh ]; then
  echo -e "\n${BOLD}=== Federating Admin DB (live service data) ===${RESET}"
  bash scripts/database/federate-admin-db.sh || echo "[WARN] admin DB federation failed — falling back to mirrored azeebo_admin data (see scripts/database/federate-admin-db.sh)"
fi

# ── Clean Up ────────────────────────────────────────────────
echo -e "\n${BOLD}=== Cleaning Up ===${RESET}"
for port in $(seq 3000 3028) 4000 4014 4016 4100 4104; do
  lsof -ti :$port -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
done
sleep 1
ok "Ports cleared"

# ── Backend Start Function ──────────────────────────────────
go() {
  local name="$1" dir="$2" port="$3" db="$4"
  DATABASE_URL="postgresql://azeebo:azeebo_dev_2024@localhost:5432/$db?schema=public" \
  PORT=$port \
  nohup node "$dir/dist/main.js" < /dev/null > /tmp/azeebo-$name.log 2>&1 &
  disown
}

# ── Start Backend Services ──────────────────────────────────
echo -e "\n${BOLD}=== Starting 29 Backend Services ===${RESET}"
go auth services/core/auth-service 3000 azeebo_auth
go user services/core/user-service 3001 azeebo_user
go wallet services/core/wallet-service 3002 azeebo_wallet
go payment services/core/payment-service 3003 azeebo_payment
go content services/core/content-service 3004 azeebo_content
go search services/core/search-service 3005 azeebo_search
go notification services/engagement/notification-service 3006 azeebo_notification
go reward services/engagement/reward-service 3007 azeebo_reward
go analytics services/intelligence/analytics-service 3008 azeebo_analytics
go recommendation services/intelligence/recommendation-service 3009 azeebo_recommendation
go reality services/universes/reality-service 3010 azeebo_reality
go movie services/universes/movie-service 3011 azeebo_movie
go comedy services/universes/comedy-service 3012 azeebo_comedy
go gateway services/gateway/api-gateway 3013 azeebo_auth
go games services/universes/games-service 3014 azeebo_games
go queue services/operations/queue-service 3015 azeebo_queue
go lifestyle services/universes/lifestyle-service 3016 azeebo_lifestyle
go vertical services/universes/vertical-service 3017 azeebo_vertical
go creator-svc services/universes/creator-service 3018 azeebo_creator
go media services/core/media-service 3019 azeebo_media
go knowledge services/core/knowledge-service 3020 azeebo_knowledge
go sports services/universes/sports-service 3021 azeebo_sports
go moderation services/operations/moderation-service 3022 azeebo_moderation
go engagement services/engagement/engagement-service 3023 azeebo_engagement
go messaging services/engagement/messaging-service 3024 azeebo_messaging
go referral services/engagement/referral-service 3025 azeebo_referral
go subscription services/engagement/subscription-service 3026 azeebo_subscription
go live-event services/universes/live-event-service 3027 azeebo_live_event
go support services/operations/support-service 3028 azeebo_support
ok "29 backend services launched"

# ── Wait for Backend ────────────────────────────────────────
echo -e "\n${BOLD}=== Waiting 45s for Backend Initialization ===${RESET}"
for i in $(seq 1 9); do
  sleep 5
  echo -n "  ${BLUE}..${RESET} $((i*5))s "
done
echo ""

# ── Backend Health Check ────────────────────────────────────
echo -e "\n${BOLD}=== Backend Health Check ===${RESET}"
healthy=0
for port in $(seq 3000 3028); do
  pid=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pid" ]; then
    ok "Port $port healthy"
    healthy=$((healthy+1))
  else
    fail "Port $port stopped"
  fi
done
echo -e "  ${BOLD}Backend: $healthy/29 services healthy${RESET}"

# ── Start Frontend Apps ─────────────────────────────────────
echo -e "\n${BOLD}=== Starting 3 Frontend Apps ===${RESET}"
ROOT="$(pwd)"

# Web App (Next.js on port 4000)
info "Starting Web App (Next.js)..."
PORT=4000 \
nohup bash -c "cd '$ROOT/apps/web' && node_modules/.bin/next dev --port 4000" < /dev/null > /tmp/azeebo-web.log 2>&1 &
WEB_PID=$!
disown
ok "Web App started (PID $WEB_PID) -> http://localhost:4000"

# Admin Backend (NestJS on port 4016) — serves /api/v1/admin/* via the gateway
info "Starting Admin Backend (NestJS)..."
# --env-file loads apps/admin/.env (DATABASE_URL, JWT secrets, INTERNAL_API_KEY, ...) —
# the backend requires them at boot (getOrThrow in JwtStrategy); without this it
# dies silently and the gateway 502s every /admin route. PORT stays explicit so
# an inherited stray PORT can't override it.
PORT=4016 \
node --env-file="$ROOT/apps/admin/.env" "$ROOT/apps/admin/dist/main.js" < /dev/null > /tmp/azeebo-admin-backend.log 2>&1 &
ADMIN_BACKEND_PID=$!
disown
ok "Admin Backend started (PID $ADMIN_BACKEND_PID) -> http://localhost:4016"

# Admin Client (Vite on port 4100)
info "Starting Admin Panel (Vite)..."
nohup bash -c "cd '$ROOT/apps/admin' && node node_modules/vite/bin/vite.js --config client/vite.config.ts --port 4100" < /dev/null > /tmp/azeebo-admin.log 2>&1 &
ADMIN_PID=$!
disown
ok "Admin Panel started (PID $ADMIN_PID) -> http://localhost:4100"

# Creator Client (Vite on port 4104)
info "Starting Creator App (Vite)..."
nohup bash -c "cd '$ROOT/apps/creator' && node node_modules/vite/bin/vite.js --config client/vite.config.ts --port 4104" < /dev/null > /tmp/azeebo-creator.log 2>&1 &
CREATOR_PID=$!
disown
ok "Creator App started (PID $CREATOR_PID) -> http://localhost:4104"

# ── Wait for Frontends ──────────────────────────────────────
echo -e "\n${BOLD}=== Waiting 15s for Frontend Build ===${RESET}"
sleep 15

# ── Frontend Health Check ───────────────────────────────────
echo -e "\n${BOLD}=== Frontend Health Check ===${RESET}"
for port in 4000 4100 4104; do
  pid=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pid" ]; then
    ok "Port $port healthy"
  else
    warn "Port $port not responding yet (may still be building)"
  fi
done

# ── Summary ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}========================================${RESET}"
echo -e "${BOLD}  Azeebo+ Local Dev Environment Ready  ${RESET}"
echo -e "${BOLD}========================================${RESET}"
echo ""
echo -e "  ${GREEN}Backend (29 services):${RESET}"
echo "    API Gateway:    http://localhost:3013"
echo "    Swagger Docs:   http://localhost:3013/docs"
echo "    Auth Service:   http://localhost:3000/v1/health"
echo "    Analytics:      http://localhost:3008/v1/health"
echo ""
echo -e "  ${GREEN}Frontend (3 apps):${RESET}"
echo "    Web App:        http://localhost:4000"
echo "    Admin Panel:    http://localhost:4100"
echo "    Creator App:    http://localhost:4104"
echo ""
echo -e "  ${YELLOW}Logs:${RESET}    tail -f /tmp/azeebo-*.log"
echo -e "  ${YELLOW}Stop:${RESET}    ./stop-all.sh"
echo ""
