#!/bin/bash
set -euo pipefail

# ============================================================
# Azeebo+ Local Development Runner
# Runs services natively on localhost without Docker.
# Prerequisites: Postgres running on localhost:5432,
#                Redis running on localhost:6379,
#                pnpm dependencies installed.
# ============================================================

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SHARED_DB="postgresql://postgres@localhost:5432/azeebo_plus_dev?schema=public"
REDIS_URL="redis://localhost:6379"

# ---- Service Registry ----
# Groups map to docker-compose.services.yml profiles.
# Format: "package_name|dir|port"
# Package names match pnpm workspace names from package.json "name" field.

CORE_SERVICES=(
  "@azeebo/auth-service|services/core/auth-service|3000"
  "@azeebo/user-service|services/core/user-service|3001"
  "@azeebo/wallet-service|services/core/wallet-service|3002"
  "@azeebo/payment-service|services/core/payment-service|3003"
  "@azeebo/content-service|services/core/content-service|3004"
  "@azeebo/search-service|services/core/search-service|3005"
  "@azeebo/media-service|services/core/media-service|3019"
)

ENGAGEMENT_SERVICES=(
  "@azeebo/notification-service|services/engagement/notification-service|3006"
  "@azeebo/reward-service|services/engagement/reward-service|3007"
  "@azeebo/engagement-service|services/engagement/engagement-service|3023"
  "@azeebo/messaging-service|services/engagement/messaging-service|3024"
  "@azeebo/referral-service|services/engagement/referral-service|3025"
  "@azeebo/subscription-service|services/engagement/subscription-service|3026"
)

INTELLIGENCE_SERVICES=(
  "@azeebo/analytics-service|services/intelligence/analytics-service|3008"
  "@azeebo/recommendation-service|services/intelligence/recommendation-service|3009"
)

UNIVERSE_SERVICES=(
  "@azeebo/reality-service|services/universes/reality-service|3010"
  "@azeebo/movie-service|services/universes/movie-service|3011"
  "@azeebo/comedy-service|services/universes/comedy-service|3012"
  "@azeebo/games-service|services/universes/games-service|3014"
  "@azeebo/sports-service|services/universes/sports-service|3021"
  "@azeebo/lifestyle-service|services/universes/lifestyle-service|3016"
  "@azeebo/vertical-service|services/universes/vertical-service|3017"
  "@azeebo/creator-service|services/universes/creator-service|3018"
)

OPERATIONS_SERVICES=(
  "@azeebo/queue-service|services/operations/queue-service|3015"
  "@azeebo/support-service|services/operations/support-service|3020"
  "@azeebo/moderation-service|services/operations/moderation-service|3022"
)

GATEWAY_SERVICES=(
  "@azeebo/api-gateway|services/gateway/api-gateway|3013"
)

FRONTEND_SERVICES=(
  "@azeebo/web|apps/web|4000"
  "@azeebo/admin|apps/admin|4016"
  "@azeebo/creator-portal|apps/creator-portal|4014"
)

# ---- Utilities ----

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
green()  { color "32" "$1"; }
yellow() { color "33" "$1"; }
red()    { color "31" "$1"; }
blue()   { color "34" "$1"; }

info()    { echo "$(blue "[info]") $1"; }
warn()    { echo "$(yellow "[warn]") $1"; }
success() { echo "$(green "[ok]") $1"; }
fail()    { echo "$(red "[error]") $1"; }

check_port() {
  local port=$1 name=$2
  if lsof -i :"$port" 2>/dev/null | grep -q LISTEN; then
    local pid
    pid=$(lsof -ti :"$port" 2>/dev/null)
    warn "Port $port ($name) is in use by PID $pid"
    return 1
  fi
  return 0
}

# ---- Prerequisites ----

check_prereqs() {
  info "Checking prerequisites..."

  if ! command -v psql &>/dev/null; then
    fail "psql not found. Install PostgreSQL."
    exit 1
  fi

  if ! pg_isready -q 2>/dev/null; then
    fail "Postgres is not running. Start it first (brew services start postgresql)."
    exit 1
  fi
  success "Postgres is running"

  if ! redis-cli ping &>/dev/null; then
    fail "Redis is not running. Start it first (redis-server --daemonize yes)."
    exit 1
  fi
  success "Redis is running"

  if ! command -v pnpm &>/dev/null; then
    fail "pnpm not found. Install it first."
    exit 1
  fi
  success "pnpm $(pnpm --version)"

  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    info "node_modules not found. Running pnpm install..."
    (cd "$ROOT_DIR" && pnpm install)
  fi
  success "Dependencies installed"
}

load_env() {
  # Source root .env for default values
  if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    . "$ROOT_DIR/.env"
    set +a
  fi
}

# ---- Database Setup ----

setup_database() {
  info "Setting up shared database..."

  psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='azeebo_plus_dev'" | grep -q 1 \
    && success "Database azeebo_plus_dev already exists" \
    || {
      psql -U postgres -c "CREATE DATABASE azeebo_plus_dev;" && success "Created database azeebo_plus_dev"
    }

  psql -U postgres -d azeebo_plus_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
  psql -U postgres -d azeebo_plus_dev -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true
  success "Extensions enabled"
}

run_migrations() {
  info "Running Prisma migrations..."
  for dir in services/*/ apps/*/; do
    if [ -f "$ROOT_DIR/$dir/prisma/schema.prisma" ]; then
      name=$(basename "$dir")
      set +e
      output=$(cd "$ROOT_DIR/$dir" && export DATABASE_URL="$SHARED_DB" && npx prisma migrate deploy 2>&1)
      rc=$?
      set -e
      if [ $rc -eq 0 ]; then
        echo "  $name... $(green "done")"
      else
        # P3019 = broken migration_lock.toml (pre-existing in admin/creator-portal)
        if echo "$output" | grep -q "P3019"; then
          warn "  $name: skipped (broken migration_lock.toml — pre-existing issue)"
        else
          warn "  $name: skipped ($(echo "$output" | grep -o 'Error:.*' | head -1))"
        fi
      fi
    fi
  done
  success "Migrations complete"
}

run_generate() {
  info "Generating Prisma clients..."
  for dir in services/*/ apps/*/; do
    if [ -f "$ROOT_DIR/$dir/prisma/schema.prisma" ]; then
      name=$(basename "$dir")
      echo "  $name..."
      (cd "$ROOT_DIR/$dir" && DATABASE_URL="$SHARED_DB" npx prisma generate 2>/dev/null)
    fi
  done
  success "Prisma clients generated"
}

# ---- Service Runner ----

PIDS=()

cleanup() {
  echo ""
  info "Shutting down services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  success "All services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

start_service() {
  local entry=$1
  local group_name=$2
  IFS='|' read -r pkg dir port <<< "$entry"

  log_file="$ROOT_DIR/.logs/${group_name}-$(basename "$dir").log"
  mkdir -p "$ROOT_DIR/.logs"

  # All env vars required by the shared env-validation Zod schema.
  # Pattern A services load .env but these overrides take precedence.
  # Pattern B services need these set explicitly.
  export DATABASE_URL="$SHARED_DB"
  export DATABASE_PASSWORD=""
  export REDIS_URL="$REDIS_URL"
  export NODE_ENV="development"
  export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-dev_jwt_access_secret_key_32chars_min!!12}"
  export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev_jwt_refresh_secret_key_32chars_min!12}"
  export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1d}"
  export JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN:-7d}"
  export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:4000,http://localhost:3000,http://localhost:3001,http://localhost:4001}"
  # Payment service needs FLUTTERWAVE_SECRET_KEY (different from FLW_SECRET_KEY in .env)
  export FLUTTERWAVE_SECRET_KEY="${FLUTTERWAVE_SECRET_KEY:-${FLW_SECRET_KEY:-FLWSECK_TEST_placeholder}}"
  # Service URLs for gateway routing (local mode — no Docker hostnames)
  export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL:-http://localhost:3004}"
  export PUBLIC_SERVICE_URL="${PUBLIC_SERVICE_URL:-http://localhost:3004}"
  export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3003}"
  export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL:-http://localhost:3014}"
  export WALLET_SERVICE_URL="${WALLET_SERVICE_URL:-http://localhost:3002}"

  if [ "$dir" = "apps/web" ]; then
    export PORT="$port"
    export NEXT_PUBLIC_API_URL="http://localhost:3013"
    run_cmd="cd $ROOT_DIR/$dir && pnpm dev"
  else
    export PORT="$port"
    run_cmd="cd $ROOT_DIR/$dir && pnpm start:dev"
  fi

  eval "$run_cmd" >> "$log_file" 2>&1 &
  local pid=$!
  PIDS+=("$pid")

  # Wait briefly to check if it starts
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    success "$pkg started on port $port (PID $pid)"
  else
    fail "$pkg failed to start — check $log_file"
    tail -5 "$log_file" | sed 's/^/  /'
  fi
}

start_group() {
  local group_name=$1
  shift
  local entries=("$@")

  echo ""
  info "Starting $group_name..."

  for entry in "${entries[@]}"; do
    start_service "$entry" "$group_name"
  done
}

# ---- Menu ----

print_menu() {
  echo ""
  echo "$(blue "Azeebo+ Local Dev Runner")"
  echo "$(blue "========================")"
  echo ""
  echo "Available service groups:"
  echo "  1)  Core Services       (auth, user, wallet, payment, content, search, media)"
  echo "  2)  Engagement Services (notification, reward, engagement, messaging, referral, subscription)"
  echo "  3)  Intelligence        (analytics, recommendation)"
  echo "  4)  Universe Services   (all universe microservices)"
  echo "  5)  Operations          (queue, support, moderation)"
  echo "  6)  Gateway             (api-gateway)"
  echo "  7)  Frontend Apps       (web, admin, creator-portal)"
  echo "  8)  All Services        (everything — heavy!)"
  echo "  9)  Quick Start         (gateway + core + frontend web)"
  echo "  0)  Exit"
  echo ""
  echo "$(yellow "Tip: Start with option 9 (core + gateway + web) to test basic flow.")"
  echo "$(yellow "RAM estimate: ~200-300MB per NestJS service, ~500MB for web.")"
  echo ""
}

run_selected() {
  local choice=$1
  case $choice in
    1) start_group "core" "${CORE_SERVICES[@]}" ;;
    2) start_group "engagement" "${ENGAGEMENT_SERVICES[@]}" ;;
    3) start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}" ;;
    4) start_group "universes" "${UNIVERSE_SERVICES[@]}" ;;
    5) start_group "operations" "${OPERATIONS_SERVICES[@]}" ;;
    6) start_group "gateway" "${GATEWAY_SERVICES[@]}" ;;
    7) start_group "frontend" "${FRONTEND_SERVICES[@]}" ;;
    8)
      start_group "core" "${CORE_SERVICES[@]}"
      start_group "engagement" "${ENGAGEMENT_SERVICES[@]}"
      start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}"
      start_group "universes" "${UNIVERSE_SERVICES[@]}"
      start_group "operations" "${OPERATIONS_SERVICES[@]}"
      start_group "gateway" "${GATEWAY_SERVICES[@]}"
      start_group "frontend" "${FRONTEND_SERVICES[@]}"
      ;;
    9)
      start_group "core" "${CORE_SERVICES[@]}"
      start_group "gateway" "${GATEWAY_SERVICES[@]}"
      echo ""
      info "Core + Gateway started. Now starting web frontend..."
      start_service "${FRONTEND_SERVICES[0]}" "frontend"
      ;;
    0) exit 0 ;;
    *)
      fail "Invalid choice"
      return 1
      ;;
  esac
}

# ---- Main ----

main() {
  echo ""
  echo "$(blue "Azeebo+ Local Development Environment")"
  echo "$(blue "=====================================")"

  load_env
  check_prereqs

  setup_database

  # Skip generate if already done (fast path)
  if [ ! -f "$ROOT_DIR/services/core/auth-service/src/prisma/client/index.js" ] && \
     [ ! -f "$ROOT_DIR/services/core/auth-service/src/generated/prisma/client/index.js" ] && \
     [ ! -f "$ROOT_DIR/services/core/user-service/src/generated/prisma/client/index.js" ]; then
    run_generate
  else
    success "Prisma clients already generated"
  fi

  # Check if CLI args provided
  if [ $# -gt 0 ]; then
    for arg in "$@"; do
      case $arg in
        --setup) ;;  # already done above
        --migrate) run_migrations ;;
        --core) start_group "core" "${CORE_SERVICES[@]}" ;;
        --engagement) start_group "engagement" "${ENGAGEMENT_SERVICES[@]}" ;;
        --intelligence) start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}" ;;
        --universes) start_group "universes" "${UNIVERSE_SERVICES[@]}" ;;
        --operations) start_group "operations" "${OPERATIONS_SERVICES[@]}" ;;
        --gateway) start_group "gateway" "${GATEWAY_SERVICES[@]}" ;;
        --frontend) start_group "frontend" "${FRONTEND_SERVICES[@]}" ;;
        --all)
          run_migrations
          start_group "core" "${CORE_SERVICES[@]}"
          start_group "engagement" "${ENGAGEMENT_SERVICES[@]}"
          start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}"
          start_group "universes" "${UNIVERSE_SERVICES[@]}"
          start_group "operations" "${OPERATIONS_SERVICES[@]}"
          start_group "gateway" "${GATEWAY_SERVICES[@]}"
          start_group "frontend" "${FRONTEND_SERVICES[@]}"
          ;;
        --quick)
          run_migrations
          start_group "core" "${CORE_SERVICES[@]}"
          start_group "gateway" "${GATEWAY_SERVICES[@]}"
          start_service "${FRONTEND_SERVICES[0]}" "frontend"
          ;;
        -h|--help)
          echo "Usage: $0 [options]"
          echo "Options:"
          echo "  --setup        Create database and generate Prisma clients (default)"
          echo "  --migrate      Run Prisma migrations"
          echo "  --core         Start core services"
          echo "  --engagement   Start engagement services"
          echo "  --intelligence Start intelligence services"
          echo "  --universes    Start universe services"
          echo "  --operations   Start operations services"
          echo "  --gateway      Start API gateway"
          echo "  --frontend     Start frontend apps"
          echo "  --all          Start everything (runs migrations first)"
          echo "  --quick        Start core + gateway + web app"
          echo ""
          exit 0
          ;;
        *)
          fail "Unknown option: $arg"
          exit 1
          ;;
      esac
    done
  else
    # Interactive mode
    local choice=""
    if [ -t 0 ]; then
      run_migrations
      while true; do
        print_menu
        read -r -p "Select groups to start (comma-separated, e.g. 1,6,7): " choice
        if [ -z "$choice" ]; then
          continue
        fi
        IFS=',' read -ra selections <<< "$choice"
        for sel in "${selections[@]}"; do
          sel=$(echo "$sel" | xargs)
          if [ "$sel" = "0" ]; then
            exit 0
          fi
        done
        echo ""
        for sel in "${selections[@]}"; do
          sel=$(echo "$sel" | xargs)
          run_selected "$sel"
        done
        break
      done
    else
      # Non-interactive with no args
      run_migrations
      start_group "core" "${CORE_SERVICES[@]}"
      start_group "gateway" "${GATEWAY_SERVICES[@]}"
    fi
  fi

  echo ""
  success "Services are starting. Check .logs/ for output."
  info "Press Ctrl+C to stop all services."
  echo ""

  # Wait forever (or until Ctrl+C)
  wait || true
}

main "$@"
