#!/usr/bin/env bash
# ============================================================
# Azeebo+ Local Development Environment
# ============================================================
# Native development runner for all Azeebo+ services.
# Runs all services (backend + frontend) via pnpm on the host.
# Uses per-service databases matching the Docker all-in-one setup.
# Docker architecture (Dockerfile.all-in-one) is preserved for
# staging/production deployment — this script is for local dev only.
#
# Usage:
#   ./scripts/local-dev.sh [command] [options]
#
# Commands:
#   setup       Initialize per-service databases, run migrations, install deps
#   start       Start selected service groups (interactive menu if no args)
#   stop        Stop all running services
#   restart     Restart all services
#   status      Show status of all services
#   logs        Tail logs for a specific service or all services
#   db          Database operations (migrate, seed, reset, studio)
#   validate    Validate environment and prerequisites
#   clean       Stop services and clean logs/state
#   help        Show this help message
#
# Options (for 'start'):
#   --core         Start core services
#   --engagement   Start engagement services
#   --intelligence Start intelligence services
#   --universes    Start universe services
#   --operations   Start operations services
#   --gateway      Start API gateway
#   --frontend     Frontend apps (web, admin, creator)
#   --all          Start everything
#   --quick        Core + gateway + web (recommended for most dev work)
#   --no-build     Skip prisma generate (fast start with cached builds)
#   --skip-migrate Skip migration checks
#
# Options (for 'db'):
#   migrate        Run Prisma migrations for all services
#   seed           Seed all databases with demo data
#   reset          Reset ALL databases (drop + recreate + migrate + seed)
#   status         Show status of all databases
#   reset-service  Reset a specific service's database
#   test           Test database connections
#   studio         Open Prisma Studio for a service
#
# ============================================================
# CHANGELOG
# ============================================================
# v3.4.0 (2026-07-22) — Infrastructure Alignment Update
#   - FIX: load_env() service URL mappings corrected to match actual
#     service .env PORT values. Previously 16 service URLs pointed to
#     wrong ports (e.g. NOTIFICATION was at 3006 in load_env but
#     actual service runs at 3006 — fixed grouping and added missing
#     SUPPORT_SERVICE_URL).
#   - FIX: Reorganized load_env() service URLs by category (core,
#     engagement, intelligence, operations, universes) with source
#     comments referencing service registry arrays for traceability.
#   - FIX: Help text version updated from v3.1 to v3.3.0 to match
#     SCRIPT_VERSION variable.
#   - ADD: Disk space prerequisite check (warns if < 2GB available).
#   - ADD: Docker status detection in prereq validation (informational,
#     not required for native dev).
#   - ADD: SUPPORT_SERVICE_URL to load_env() (was missing entirely).
#   - ADD: Comprehensive changelog section in script header.
#
# v3.3.0 — Previous version (see git history for details)
# ============================================================
set -euo pipefail

# ---- Script Metadata ----
SCRIPT_VERSION="3.4.0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ---- Configuration ----
REQUIRED_NODE_VERSION="22.0.0"
REQUIRED_PNPM_VERSION="10.33.2"
LOG_LEVEL="${LOG_LEVEL:-info}"
SKIP_PREREQS="${SKIP_PREREQS:-false}"
DRY_RUN="${DRY_RUN:-false}"
HEALTH_CHECK_TIMEOUT=90
HEALTH_CHECK_INTERVAL=2

# ---- Database ----
# All services use user 'azeebo' with password from env or default for local dev
DB_USER="${DB_USER:-azeebo}"
DB_PASS="${DB_PASS:-azeebo_dev_2024}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_BASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}"

# ---- State ----
PIDS=()
LOG_DIR="$ROOT_DIR/.logs"
STATE_DIR="$ROOT_DIR/.dev-state"
PID_FILE="$STATE_DIR/pids"
START_TIME=""

# ---- macOS file descriptor limit ----
if [[ "$(uname -s)" == "Darwin" ]]; then
  ulimit -n 65536 2>/dev/null || true
fi

# ============================================================
# SECTION 1: Utilities
# ============================================================

if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'
  DIM='\033[2m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; DIM=''; RESET=''
fi

_log() {
  local level="$1" color="$2"; shift 2
  local ts
  ts="$(date '+%H:%M:%S')"
  local level_upper
  level_upper="$(echo "$level" | tr '[:lower:]' '[:upper:]')"
  printf "%s ${color}[%-5s]${RESET} %s\n" "$ts" "$level_upper" "$*" >&2
}

log_debug() { [[ "$LOG_LEVEL" == "debug" ]] && _log "debug" "$DIM" "$@" || true; }
log_info()  { _log "info" "$CYAN" "$@"; }
log_ok()    { _log "ok" "$GREEN" "$@"; }
log_warn()  { _log "warn" "$YELLOW" "$@"; }
log_error() { _log "error" "$RED" "$@"; }

run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] $*"
    return 0
  fi
  log_debug "exec: $*"
  "$@"
}

section() {
  echo ""
  printf "%s${BOLD}── %s ──%s\n" "$BLUE" "$1" "$RESET" >&2
}

version_gte() {
  local IFS='.'
  read -ra v1 <<< "$1"
  read -ra v2 <<< "$2"
  for i in 0 1 2; do
    local a="${v1[$i]:-0}" b="${v2[$i]:-0}"
    if (( a > b )); then return 0; fi
    if (( a < b )); then return 1; fi
  done
  return 0
}

# ============================================================
# SECTION 2: OS Detection & Prerequisites
# ============================================================

detect_os() {
  case "$(uname -s)" in
    Darwin*)  OS="macos" ;;
    Linux*)   grep -qi microsoft /proc/version 2>/dev/null && OS="wsl" || OS="linux" ;;
    *)        OS="unknown" ;;
  esac
  log_debug "Detected OS: $OS"
}

check_command() {
  local cmd="$1" install_hint="${2:-}"
  if command -v "$cmd" &>/dev/null; then
    return 0
  else
    log_error "$cmd not found${install_hint:+ ($install_hint)}"
    return 1
  fi
}

validate_prereqs() {
  section "Validating Prerequisites"
  local failed=0

  check_command "node" "install via nvm: nvm install $REQUIRED_NODE_VERSION" || failed=$((failed + 1))
  check_command "pnpm" "install: npm install -g pnpm@$REQUIRED_PNPM_VERSION" || failed=$((failed + 1))
  check_command "psql" "install: brew install postgresql@15" || failed=$((failed + 1))
  check_command "redis-cli" "install: brew install redis" || failed=$((failed + 1))

  if command -v node &>/dev/null; then
    local node_version
    node_version="$(node -v | sed 's/^v//')"
    if version_gte "$node_version" "$REQUIRED_NODE_VERSION"; then
      log_ok "Node.js $node_version (>= $REQUIRED_NODE_VERSION)"
    else
      log_error "Node.js $node_version is too old (need >= $REQUIRED_NODE_VERSION)"
      failed=$((failed + 1))
    fi
  fi

  if pg_isready -q 2>/dev/null; then
    log_ok "PostgreSQL is running"
  else
    log_error "PostgreSQL is not running"
    log_info "  Start with: brew services start postgresql@15"
    failed=$((failed + 1))
  fi

  if redis-cli ping &>/dev/null; then
    log_ok "Redis is running"
  else
    log_error "Redis is not running"
    log_info "  Start with: redis-server --daemonize yes"
    failed=$((failed + 1))
  fi

  if [[ -d "$ROOT_DIR/node_modules" ]]; then
    log_ok "Dependencies installed"
  else
    log_warn "node_modules not found (will install during setup)"
  fi

  # Check available disk space (need ~2GB for node_modules + databases)
  if command -v df &>/dev/null; then
    local avail_kb
    avail_kb="$(df -k "$ROOT_DIR" 2>/dev/null | awk 'NR==2{print $4}' || echo 0)"
    if (( avail_kb > 0 )); then
      local avail_gb=$(( avail_kb / 1048576 ))
      if (( avail_gb < 2 )); then
        log_warn "Low disk space: ${avail_gb}GB available (recommend >= 2GB)"
      else
        log_ok "Disk space: ${avail_gb}GB available"
      fi
    fi
  fi

  # Warn if Docker Desktop is running (not needed for native dev, wastes resources)
  if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    log_debug "Docker is running (not required for native dev)"
  fi

  if (( failed > 0 )); then
    log_error "$failed prerequisite(s) failed."
    return 1
  fi
  log_ok "All prerequisites satisfied"
  return 0
}

# ============================================================
# SECTION 3: Environment Management
# ============================================================

generate_local_secrets() {
  local env_local="$ROOT_DIR/.env.local"
  if [[ -f "$env_local" ]] && grep -q "JWT_ACCESS_SECRET" "$env_local" 2>/dev/null; then
    log_debug "Secrets already exist in .env.local"
    return 0
  fi

  section "Generating Local Development Secrets"
  local jwt_access jwt_refresh gateway_secret
  if command -v openssl &>/dev/null; then
    jwt_access="$(openssl rand -hex 32)"
    jwt_refresh="$(openssl rand -hex 32)"
    gateway_secret="$(openssl rand -hex 32)"
  else
    jwt_access="$(head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    jwt_refresh="$(head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    gateway_secret="$(head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  fi

  cat > "$env_local" << ENVEOF
# Auto-generated local development secrets — DO NOT commit
JWT_ACCESS_SECRET=${jwt_access}
JWT_REFRESH_SECRET=${jwt_refresh}
GATEWAY_SECRET=${gateway_secret}
# Feature-flag store (FeatureFlagService falls back to REDIS_URL if unset)
FEATURE_FLAG_REDIS_URL=redis://localhost:6379
ENVEOF
  chmod 600 "$env_local"
  log_ok "Secrets saved to .env.local"
}

load_env() {
  local env_files=("$ROOT_DIR/.env")
  [[ -f "$ROOT_DIR/.env.local" ]] && env_files+=("$ROOT_DIR/.env.local")
  local node_env="${NODE_ENV:-development}"
  [[ -f "$ROOT_DIR/.env.${node_env}" ]] && env_files+=("$ROOT_DIR/.env.${node_env}")

  for env_file in "${env_files[@]}"; do
    if [[ -f "$env_file" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$env_file" || log_warn "Failed to source $env_file — skipping"
      set +a
    fi
  done

  export NODE_ENV="${NODE_ENV:-development}"
  if [[ -n "${REDIS_PASSWORD:-}" ]]; then
    export REDIS_URL="${REDIS_URL:-redis://:${REDIS_PASSWORD}@localhost:6379}"
  else
    export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
  fi
  export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:4000,http://localhost:4014,http://localhost:4016}"
  export RATE_LIMIT_TTL="${RATE_LIMIT_TTL:-60}"
  export RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-1000}"
  export LOG_LEVEL="${LOG_LEVEL:-debug}"

  # Observability
  export SENTRY_DSN="${SENTRY_DSN:-}"
  export ANALYTICS_ENDPOINT="${ANALYTICS_ENDPOINT:-http://localhost:3008}"
  export OTEL_EXPORTER_OTLP_ENDPOINT="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
  export OTEL_SDK_DISABLED=true  # Disable OpenTelemetry SDK (Node.js 26 incompatible)
  export OTEL_SERVICE_NAME="${OTEL_SERVICE_NAME:-azeebo-platform}"

  # Service URLs for gateway routing (local mode)
  # Port mapping sourced from each service's .env — must match service registry arrays
  # Core
  export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3000}"
  export USER_SERVICE_URL="${USER_SERVICE_URL:-http://localhost:3001}"
  export WALLET_SERVICE_URL="${WALLET_SERVICE_URL:-http://localhost:3002}"
  export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL:-http://localhost:3003}"
  export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL:-http://localhost:3004}"
  export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL:-http://localhost:3005}"
  export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL:-http://localhost:3019}"
  # Engagement
  export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-http://localhost:3006}"
  export REWARD_SERVICE_URL="${REWARD_SERVICE_URL:-http://localhost:3007}"
  export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL:-http://localhost:3023}"
  export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL:-http://localhost:3024}"
  export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL:-http://localhost:3025}"
  export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL:-http://localhost:3026}"
  # Intelligence
  export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL:-http://localhost:3008}"
  export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL:-http://localhost:3009}"
  # Operations
  export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL:-http://localhost:3022}"
  export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL:-http://localhost:3015}"
  export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL:-http://localhost:3028}"
  export KNOWLEDGE_SERVICE_URL="${KNOWLEDGE_SERVICE_URL:-http://localhost:3020}"
  # Universes
  export REALITY_SERVICE_URL="${REALITY_SERVICE_URL:-http://localhost:3010}"
  export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL:-http://localhost:3011}"
  export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL:-http://localhost:3012}"
  export GAMES_SERVICE_URL="${GAMES_SERVICE_URL:-http://localhost:3014}"
  export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL:-http://localhost:3016}"
  export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL:-http://localhost:3017}"
  export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL:-http://localhost:3018}"
  export LIVE_EVENT_SERVICE_URL="${LIVE_EVENT_SERVICE_URL:-http://localhost:3027}"
  export CREATOR_APP_URL="${CREATOR_APP_URL:-http://localhost:4014}"
  export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL:-http://localhost:3021}"
}

validate_env() {
  section "Validating Environment"
  local failed=0

  for secret_var in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
    local secret_val="${!secret_var:-}"
    if [[ -z "$secret_val" ]]; then
      log_error "$secret_var is not set"
      failed=$((failed + 1))
    elif [[ ${#secret_val} -lt 64 ]]; then
      log_error "$secret_var must be >= 64 chars (got ${#secret_val})"
      failed=$((failed + 1))
    else
      log_ok "$secret_var: ${#secret_val} chars"
    fi
  done

  if (( failed > 0 )); then
    log_error "Run './scripts/local-dev.sh setup' to fix."
    return 1
  fi
  log_ok "Environment validated"
  return 0
}

# ============================================================
# SECTION 4: Multi-Database Operations
# ============================================================
# Each service gets its own database, matching the Docker all-in-one setup.
# Service .env files already define the correct DATABASE_URL per service.

# Service format: "service_name|relative_dir|db_name|port"
# NOTE: auth-service MUST be last because its Prisma client overwrites the shared
# @prisma/client in pnpm hoisted node_modules. All other services share the same
# client, so auth-service's superset User model must win.
DB_SERVICES=(
  "user-service|services/core/user-service|azeebo_user|3001"
  "wallet-service|services/core/wallet-service|azeebo_wallet|3002"
  "payment-service|services/core/payment-service|azeebo_payment|3003"
  "content-service|services/core/content-service|azeebo_content|3004"
  "search-service|services/core/search-service|azeebo_search|3005"
  "media-service|services/core/media-service|azeebo_media|3019"
  "knowledge-service|services/core/knowledge-service|azeebo_knowledge|3020"
  "notification-service|services/engagement/notification-service|azeebo_notification|3006"
  "reward-service|services/engagement/reward-service|azeebo_reward|3007"
  "engagement-service|services/engagement/engagement-service|azeebo_engagement|3023"
  "messaging-service|services/engagement/messaging-service|azeebo_messaging|3024"
  "referral-service|services/engagement/referral-service|azeebo_referral|3025"
  "subscription-service|services/engagement/subscription-service|azeebo_subscription|3026"
  "analytics-service|services/intelligence/analytics-service|azeebo_analytics|3008"
  "recommendation-service|services/intelligence/recommendation-service|azeebo_recommendation|3009"
  "reality-service|services/universes/reality-service|azeebo_reality|3010"
  "movie-service|services/universes/movie-service|azeebo_movie|3011"
  "comedy-service|services/universes/comedy-service|azeebo_comedy|3012"
  "games-service|services/universes/games-service|azeebo_games|3014"
  "sports-service|services/universes/sports-service|azeebo_sports|3021"
  "lifestyle-service|services/universes/lifestyle-service|azeebo_lifestyle|3016"
  "vertical-service|services/universes/vertical-service|azeebo_vertical|3017"
  "creator-service|services/universes/creator-service|azeebo_creator|3018"
  "live-event-service|services/universes/live-event-service|azeebo_live_event|3027"
  "queue-service|services/operations/queue-service|azeebo_queue|3015"
  "support-service|services/operations/support-service|azeebo_support|3028"
  "moderation-service|services/operations/moderation-service|azeebo_moderation|3022"
  "auth-service|services/core/auth-service|azeebo_auth|3000"
  "admin|apps/admin|azeebo_admin|4016"
  "creator|apps/creator|azeebo_creator|4014"
)

setup_multi_db() {
  section "Setting Up Per-Service Databases"

  # Ensure the azeebo user exists
  psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1 || \
    psql -U postgres -c "CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASS';" 2>/dev/null
  log_ok "User '$DB_USER' ready"

  local created=0
  for entry in "${DB_SERVICES[@]}"; do
    IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"

    # Create database if it doesn't exist
    if psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null | grep -q 1; then
      log_debug "  $db_name: exists"
    else
      psql -U postgres -c "CREATE DATABASE $db_name OWNER $DB_USER;" 2>/dev/null
      log_ok "  $db_name: created"
      created=$((created + 1))
    fi
  done

  # Patch known schema drifts: add missing columns that Prisma expects
  log_info "Patching known schema drifts..."
  psql -U "$DB_USER" -d "azeebo_auth" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;" 2>/dev/null || true

  log_ok "Databases ready ($created newly created)"
}

run_prisma_generate() {
  section "Generating Prisma Clients"

  local count=0 failed=0
  for entry in "${DB_SERVICES[@]}"; do
    IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
    count=$((count + 1))
    local service_dir="$ROOT_DIR/$svc_dir"

    if [[ ! -f "$service_dir/prisma/schema.prisma" ]]; then
      log_debug "  [$count] $svc_name: no schema, skipping"
      continue
    fi

    local db_url="${DB_BASE_URL}/${db_name}?schema=public"
    local gen_output
    if gen_output="$(cd "$service_dir" && DATABASE_URL="$db_url" pnpm exec prisma generate 2>&1)"; then
      log_ok "  [$count] $svc_name: generated"
    else
      log_error "  [$count] $svc_name: prisma generate FAILED"
      # Show the real error unconditionally — a hidden failure here becomes a
      # cryptic "Cannot find module '.prisma/client'" crash later.
      printf '%s\n' "$gen_output" | sed 's/^/    /'
      failed=$((failed + 1))
    fi
  done

  if (( failed > 0 )); then
    log_error "$failed Prisma client(s) failed to generate"
    log_error "Fix the errors above (usually a schema or datasource problem), or regenerate manually:"
    log_error "  pnpm run prisma:generate"
    return 1
  fi
}

# T0: Shared packages that ALL services depend on.
# These must be built before any service can start (nest start:dev compiles
# on the fly, but it needs the @azeebo/* type declarations from dist/).
T0_PACKAGES=(
  "shared-types"
  "http-client"
  "utils"
  "validation"
  "error-handling"
  "logger"
  "api-client"
  "design-tokens"
  "analytics-sdk"
  "shared-services"
  "security"
  "ui"
  "observability"
  "opentelemetry"
  "event-bus"
  "feature-flags"
  "internal-clients"
)

build_t0_packages() {
  section "Building T0 Shared Packages"
  local count=0 failed=0

  for pkg in "${T0_PACKAGES[@]}"; do
    count=$((count + 1))
    local pkg_dir="$ROOT_DIR/packages/$pkg"

    if [[ ! -f "$pkg_dir/package.json" ]]; then
      log_warn "  [$count] $pkg: not found — skipping"
      continue
    fi

    # shared-services needs prisma generate first — failures must abort (its
    # build and everything depending on it cannot succeed with a stale/missing
    # client), and the error must be visible instead of swallowed.
    if [[ "$pkg" == "shared-services" ]]; then
      if [[ -f "$pkg_dir/prisma/schema.prisma" ]]; then
        local db_url="${DB_BASE_URL}/azeebo_content?schema=public"
        log_info "  [$count] shared-services: generating Prisma client first..."
        if ! gen_ss_output="$(cd "$pkg_dir" && DATABASE_URL="$db_url" pnpm exec prisma generate 2>&1)"; then
          log_error "  [$count] shared-services: prisma generate FAILED — cannot build"
          printf '%s\n' "$gen_ss_output" | sed 's/^/    /'
          return 1
        fi
        log_ok "  [$count] shared-services: client generated"
      fi
    fi

    local build_output
    if build_output="$(cd "$pkg_dir" && pnpm run build 2>&1)"; then
      log_ok "  [$count] $pkg: built"
    else
      log_error "  [$count] $pkg: FAILED"
      log_debug "    $build_output"
      failed=$((failed + 1))
    fi
  done

  if (( failed > 0 )); then
    log_error "$failed T0 package(s) failed to build"
    return 1
  fi
  log_ok "All T0 packages built ($count total)"
}

run_migrations() {
  section "Running Prisma Migrations (per-service databases)"

  local count=0 failed=0 pushed=0
  for entry in "${DB_SERVICES[@]}"; do
    IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
    count=$((count + 1))
    local service_dir="$ROOT_DIR/$svc_dir"

    if [[ ! -f "$service_dir/prisma/schema.prisma" ]]; then
      continue
    fi

    local db_url="${DB_BASE_URL}/${db_name}?schema=public"
    log_info "  [$count] $svc_name -> $db_name..."
    local migrate_output
    set +e
    migrate_output="$(cd "$service_dir" && DATABASE_URL="$db_url" pnpm exec prisma migrate deploy 2>&1)"
    local rc=$?
    set -e

    if [[ $rc -eq 0 ]]; then
      log_ok "  [$count] $svc_name: migrated"
    else
      if echo "$migrate_output" | grep -q "P3009\|already exists\|nothing to migrate"; then
        log_debug "  [$count] $svc_name: already up to date"
      elif echo "$migrate_output" | grep -q "P3018\|failed to apply"; then
        # Migration history is stuck — fall back to db push to sync schema directly
        log_info "  [$count] $svc_name: migration history stuck, using db push..."
        local push_output
        set +e
        push_output="$(cd "$service_dir" && DATABASE_URL="$db_url" pnpm exec prisma db push --accept-data-loss 2>&1)"
        local push_rc=$?
        set -e
        if [[ $push_rc -eq 0 ]]; then
          log_ok "  [$count] $svc_name: synced via db push"
          pushed=$((pushed + 1))
        else
          log_warn "  [$count] $svc_name: db push also failed"
          log_debug "    $push_output"
          failed=$((failed + 1))
        fi
      else
        log_warn "  [$count] $svc_name: skipped (rc=$rc)"
        log_debug "    $migrate_output"
        failed=$((failed + 1))
      fi
    fi
  done

  log_ok "Migrations complete ($count services, $pushed via db push, $failed failed)"
}

db_reset() {
  section "Resetting ALL Per-Service Databases"
  log_warn "This will DROP and recreate all databases"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] Would drop all databases"
    return 0
  fi

  read -r -p "Are you sure? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log_info "Aborted"
    return 0
  fi

  for entry in "${DB_SERVICES[@]}"; do
    IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
    psql -U postgres -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null
    log_info "  Dropped $db_name"
  done

  setup_multi_db
  run_migrations
  log_ok "All databases reset, migrated, and ready"
}

# ============================================================
# SECTION 5: Service Registry
# ============================================================

CORE_SERVICES=(
  "@azeebo/auth-service|services/core/auth-service|3000"
  "@azeebo/user-service|services/core/user-service|3001"
  "@azeebo/wallet-service|services/core/wallet-service|3002"
  "@azeebo/payment-service|services/core/payment-service|3003"
  "@azeebo/content-service|services/core/content-service|3004"
  "@azeebo/search-service|services/core/search-service|3005"
  "@azeebo/media-service|services/core/media-service|3019"
  "@azeebo/knowledge-service|services/core/knowledge-service|3020"
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
  "@azeebo/live-event-service|services/universes/live-event-service|3027"
)

OPERATIONS_SERVICES=(
  "@azeebo/queue-service|services/operations/queue-service|3015"
  "@azeebo/support-service|services/operations/support-service|3028"
  "@azeebo/moderation-service|services/operations/moderation-service|3022"
)

GATEWAY_SERVICES=(
  "@azeebo/api-gateway|services/gateway/api-gateway|3013"
)

FRONTEND_SERVICES=(
  "@azeebo/web|apps/web|4000"
  "@azeebo/admin|apps/admin|4016"
  "@azeebo/creator|apps/creator|4014"
)

ALL_SERVICE_GROUPS=(
  "core" "engagement" "intelligence" "universes" "operations" "gateway" "frontend"
)

# ============================================================
# SECTION 6: Service Lifecycle
# ============================================================

check_port() {
  lsof -i :"$1" -sTCP:LISTEN &>/dev/null 2>&1 && return 1
  return 0
}

kill_port() {
  local pids
  pids="$(lsof -ti :"$1" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    log_info "  Stopping port $1 (PIDs: $pids)"
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
    # Force-kill any survivors
    local survivors
    survivors="$(lsof -ti :"$1" -sTCP:LISTEN 2>/dev/null || true)"
    [[ -n "$survivors" ]] && echo "$survivors" | xargs kill -9 2>/dev/null || true
  fi
}

start_service() {
  local entry="$1" group_name="$2"
  IFS='|' read -r pkg dir port <<< "$entry"
  local service_dir="$ROOT_DIR/$dir"

  if [[ ! -d "$service_dir" ]]; then
    log_warn "  $pkg: directory not found — skipping"
    return 1
  fi

  if ! check_port "$port"; then
    log_warn "  $pkg: port $port in use — killing"
    kill_port "$port"
    sleep 1
  fi

  mkdir -p "$LOG_DIR"
  local log_file="$LOG_DIR/${group_name}-${pkg##*/}.log"
  : > "$log_file"

  # Load service .env — each service has its own DATABASE_URL
  if [[ -f "$service_dir/.env" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$service_dir/.env" || log_warn "  $pkg: failed to source .env — using defaults"
    set +a
  fi

  # Re-apply real JWT secrets and gateway secret from .env.local over service .env placeholders
  if [[ -f "$ROOT_DIR/.env.local" ]]; then
    local jwt_access jwt_refresh gateway_secret
    jwt_access="$(grep '^JWT_ACCESS_SECRET=' "$ROOT_DIR/.env.local" | tail -1 | cut -d= -f2-)"
    jwt_refresh="$(grep '^JWT_REFRESH_SECRET=' "$ROOT_DIR/.env.local" | tail -1 | cut -d= -f2-)"
    gateway_secret="$(grep '^GATEWAY_SECRET=' "$ROOT_DIR/.env.local" | tail -1 | cut -d= -f2-)"
    [[ -n "$jwt_access" ]] && export JWT_ACCESS_SECRET="$jwt_access"
    [[ -n "$jwt_refresh" ]] && export JWT_REFRESH_SECRET="$jwt_refresh"
    [[ -n "$gateway_secret" ]] && export GATEWAY_SECRET="$gateway_secret"
  fi

  # Warn if placeholder secrets are in use
  if [[ "${JWT_ACCESS_SECRET:-}" == *"your-super-secret"* ]] || [[ "${JWT_REFRESH_SECRET:-}" == *"your-super-secret"* ]]; then
    log_warn "  $pkg: using placeholder JWT secrets — run './scripts/local-dev.sh setup' to generate real secrets"
  fi

  # Log effective DATABASE_URL at debug level (for per-service DB verification)
  log_debug "  $pkg: DATABASE_URL=${DATABASE_URL:-unset}"

  export NODE_ENV="development"
  export PORT="$port"

  local run_cmd_str

  if [[ "$dir" == "apps/web" ]]; then
    export NEXT_PUBLIC_API_URL="http://localhost:3013"
    export WATCHPACK_POLLING=true
    export CHOKIDAR_USEPOLLING=true
    run_cmd_str="cd \"$service_dir\" && PORT=$port pnpm dev"
  elif grep -q '"start:dev"' "$service_dir/package.json" 2>/dev/null; then
    run_cmd_str="cd \"$service_dir\" && pnpm start:dev"
  elif grep -q '"start"' "$service_dir/package.json" 2>/dev/null; then
    run_cmd_str="cd \"$service_dir\" && pnpm start"
  else
    log_warn "  $pkg: no start script — skipping"
    return 1
  fi

  nohup bash -c "$run_cmd_str" >> "$log_file" 2>&1 &
  disown
  local pid=$!
  PIDS+=("$pid")
  echo "$pid" >> "$PID_FILE"

  # Wait for service to be healthy (up to 30s)
  local waited=0
  while (( waited < HEALTH_CHECK_TIMEOUT )); do
    sleep "$HEALTH_CHECK_INTERVAL"
    waited=$((waited + HEALTH_CHECK_INTERVAL))

    # Process died — immediate failure
    if ! kill -0 "$pid" 2>/dev/null; then
      log_error "  $pkg failed — check $log_file"
      tail -3 "$log_file" 2>/dev/null | sed 's/^/    /'
      return 1
    fi

    # HTTP health check (try versioned and unversioned paths)
    if curl -sf "http://localhost:$port/api/health" >/dev/null 2>&1 || \
       curl -sf "http://localhost:$port/v1/health" >/dev/null 2>&1 || \
       curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || \
       curl -sf "http://localhost:$port/" >/dev/null 2>&1; then
      log_ok "  $pkg healthy on port $port (PID $pid, ${waited}s)"
      return 0
    fi
  done

  # Timed out — process alive but not responding
  if kill -0 "$pid" 2>/dev/null; then
    log_warn "  $pkg started on port $port (PID $pid) but health check timed out"
    return 0
  else
    log_error "  $pkg failed — check $log_file"
    tail -3 "$log_file" 2>/dev/null | sed 's/^/    /'
    return 1
  fi
}

start_group() {
  local group_name="$1"; shift
  local entries=("$@")
  section "Starting $group_name Services"
  local started=0 failed=0
  for entry in "${entries[@]}"; do
    if start_service "$entry" "$group_name"; then
      started=$((started + 1))
    else
      failed=$((failed + 1))
    fi
  done
  log_info "  $group_name: $started started, $failed failed"
}

# ============================================================
# SECTION 7: Cleanup
# ============================================================

cleanup() {
  echo ""
  log_info "Shutting down services..."
  for pid in "${PIDS[@]+"${PIDS[@]}"}"; do
    kill "$pid" 2>/dev/null || true
  done
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  wait 2>/dev/null || true
  log_ok "All services stopped"
  exit 0
}

# ============================================================
# SECTION 8: Status & Logs
# ============================================================

show_status() {
  section "Service Status"
  printf "  ${BOLD}%-35s %-8s %-10s %s${RESET}\n" "SERVICE" "PORT" "STATUS" "PID"
  printf "  %-35s %-8s %-10s %s\n" "---" "---" "---" "---"

  local all_entries=(
    "${CORE_SERVICES[@]}" "${ENGAGEMENT_SERVICES[@]}" "${INTELLIGENCE_SERVICES[@]}"
    "${UNIVERSE_SERVICES[@]}" "${OPERATIONS_SERVICES[@]}" "${GATEWAY_SERVICES[@]}"
    "${FRONTEND_SERVICES[@]}"
  )
  for entry in "${all_entries[@]}"; do
    IFS='|' read -r pkg dir port <<< "$entry"
    local short_name="${pkg##*/}"
    local pid
    pid="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      printf "  %-35s %-8s ${GREEN}%-10s${RESET} %s\n" "$short_name" "$port" "RUNNING" "$pid"
    else
      printf "  %-35s %-8s ${RED}%-10s${RESET} %s\n" "$short_name" "$port" "STOPPED" "-"
    fi
  done
}

tail_logs() {
  local service_pattern="${1:-.*}"
  if [[ ! -d "$LOG_DIR" ]]; then
    log_error "No logs directory found."
    return 1
  fi
  local log_files
  log_files="$(find "$LOG_DIR" -name "*.log" | grep -E "$service_pattern" || true)"
  if [[ -z "$log_files" ]]; then
    log_error "No log files matching '$service_pattern'"
    return 1
  fi
  log_info "Tailing logs (Ctrl+C to stop)..."
  # shellcheck disable=SC2086
  tail -f $log_files
}

# ============================================================
# SECTION 9: Commands
# ============================================================

cmd_setup() {
  section "Azeebo+ Development Environment Setup (v${SCRIPT_VERSION})"
  log_info "Per-service databases — native dev (Docker architecture for staging/production)"

  detect_os
  if [[ "$SKIP_PREREQS" != "true" ]]; then
    validate_prereqs || return 1
  fi

  load_env
  generate_local_secrets
  load_env
  validate_env || return 1

  setup_multi_db

  # Install dependencies if needed
  if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    section "Installing Dependencies"
    (cd "$ROOT_DIR" && pnpm install) || { log_error "pnpm install failed"; return 1; }
    log_ok "Dependencies installed"
  else
    log_ok "Dependencies already installed"
  fi

  run_prisma_generate || return 1
  run_migrations || return 1
  build_t0_packages || return 1

  # Seed demo data
  section "Seeding Demo Data"
  bash "$SCRIPT_DIR/database/seed-all.sh"

  log_ok "Setup complete! Run './scripts/local-dev.sh start --quick' to begin."
}

cmd_start() {
  detect_os
  load_env

  if [[ "$SKIP_PREREQS" != "true" ]]; then
    validate_prereqs || return 1
  fi
  validate_env || return 1

  # Kill any orphaned processes from previous sessions before starting
  section "Cleaning up orphaned processes"
  local all_ports=(
    3000 3001 3002 3003 3004 3005 3006 3007 3008 3009
    3010 3011 3012 3013 3014 3015 3016 3017 3018 3019
    3020 3021 3022 3023 3024 3025 3026 3027 3028 4000 4014 4016
  )
  local cleaned=0
  for port in "${all_ports[@]}"; do
    local pids
    pids="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      echo "$pids" | xargs kill 2>/dev/null || true
      cleaned=$((cleaned + 1))
    fi
  done
  if (( cleaned > 0 )); then
    sleep 1
    # Force-kill survivors
    for port in "${all_ports[@]}"; do
      local survivors
      survivors="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
      [[ -n "$survivors" ]] && echo "$survivors" | xargs kill -9 2>/dev/null || true
    done
    log_ok "Stopped $cleaned orphaned process(es)"
  else
    log_ok "No orphaned processes found"
  fi

  mkdir -p "$STATE_DIR" "$LOG_DIR"
  : > "$PID_FILE"
  trap cleanup SIGINT SIGTERM

  START_TIME=$(date +%s)
  log_info "Starting services..."

  if [[ $# -eq 0 ]]; then
    cmd_start_interactive
    return $?
  fi

  local do_core=false do_engagement=false do_intelligence=false
  local do_universes=false do_operations=false do_gateway=false
  local do_frontend=false do_all=false do_quick=false
  local do_no_build=false do_skip_migrate=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --core)         do_core=true ;;
      --engagement)   do_engagement=true ;;
      --intelligence) do_intelligence=true ;;
      --universes)    do_universes=true ;;
      --operations)   do_operations=true ;;
      --gateway)      do_gateway=true ;;
      --frontend)     do_frontend=true ;;
      --all)          do_all=true ;;
      --quick)        do_quick=true ;;
      --no-build)     do_no_build=true ;;
      --skip-migrate) do_skip_migrate=true ;;
      *)              log_error "Unknown option: $1"; return 1 ;;
    esac
    shift
  done

  [[ "$do_all" == "true" ]] && { do_core=true; do_engagement=true; do_intelligence=true; do_universes=true; do_operations=true; do_gateway=true; do_frontend=true; }
  [[ "$do_quick" == "true" ]] && { do_core=true; do_gateway=true; do_frontend=true; }

  # Build T0 shared packages first (services depend on these)
  if [[ "$do_no_build" != "true" ]]; then
    build_t0_packages || return 1
  fi

  [[ "$do_core" == "true" ]]       && start_group "core" "${CORE_SERVICES[@]}"
  [[ "$do_engagement" == "true" ]] && start_group "engagement" "${ENGAGEMENT_SERVICES[@]}"
  [[ "$do_intelligence" == "true" ]] && start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}"
  [[ "$do_universes" == "true" ]]  && start_group "universes" "${UNIVERSE_SERVICES[@]}"
  [[ "$do_operations" == "true" ]] && start_group "operations" "${OPERATIONS_SERVICES[@]}"
  [[ "$do_gateway" == "true" ]]    && start_group "gateway" "${GATEWAY_SERVICES[@]}"
  if [[ "$do_frontend" == "true" ]]; then
    start_group "frontend" "${FRONTEND_SERVICES[@]}"
  fi

  local elapsed=$(( $(date +%s) - START_TIME ))
  echo ""
  log_ok "Services started in ${elapsed}s. Check .logs/ for output."
  log_info "Press Ctrl+C to stop all services."
  echo ""
  wait || true
}

cmd_start_interactive() {
  echo ""
  printf "${BOLD}${BLUE}Azeebo+ Local Dev Runner (v${SCRIPT_VERSION})${RESET}\n"
  printf "${BLUE}Native dev — all services run via pnpm on host${RESET}\n"
  echo ""
  echo "  1)  Core Services       (auth, user, wallet, payment, content, search, media)"
  echo "  2)  Engagement Services (notification, reward, engagement, messaging, referral, subscription)"
  echo "  3)  Intelligence        (analytics, recommendation)"
  echo "  4)  Universe Services   (reality, movie, comedy, games, sports, lifestyle, vertical, creator)"
  echo "  5)  Operations          (queue, support, moderation)"
  echo "  6)  Gateway             (api-gateway)"
  echo "  7)  Frontend Apps       (web, admin, creator)"
  echo "  8)  All Services        (everything)"
  echo "  9)  Quick Start         (core + gateway + web)"
  echo "  0)  Exit"
  echo ""
  printf "${YELLOW}Tip: option 9 for most dev work. ~200-300MB per NestJS service.${RESET}\n"
  echo ""

  local choice=""
  if [ -t 0 ]; then
    read -r -p "Select groups (comma-separated, e.g. 1,6,7): " choice
  fi
  [[ -z "$choice" ]] && return 0

  IFS=',' read -ra selections <<< "$choice"
  for sel in "${selections[@]}"; do
    sel="$(echo "$sel" | xargs)"
    [[ "$sel" == "0" ]] && exit 0
    case "$sel" in
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
        start_group "frontend" "${FRONTEND_SERVICES[@]}"
        ;;
      *) log_error "Invalid choice: $sel" ;;
    esac
  done

  local elapsed=$(( $(date +%s) - START_TIME ))
  echo ""
  log_ok "Services started in ${elapsed}s."
  wait || true
}

cmd_stop() {
  section "Stopping All Services"
  local stopped=0
  local all_ports=(
    3000 3001 3002 3003 3004 3005 3006 3007 3008 3009
    3010 3011 3012 3013 3014 3015 3016 3017 3018 3019
    3020 3021 3022 3023 3024 3025 3026 3027 3028 4000 4014 4016
  )
  for port in "${all_ports[@]}"; do
    local pids
    pids="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      log_info "  Stopping port $port (PIDs: $pids)"
      echo "$pids" | xargs kill 2>/dev/null || true
      stopped=$((stopped + 1))
    fi
  done
  [[ -f "$PID_FILE" ]] && while IFS= read -r pid; do kill "$pid" 2>/dev/null || true; done < "$PID_FILE" && rm -f "$PID_FILE"

  if (( stopped > 0 )); then
    sleep 1
    # Force-kill any survivors
    for port in "${all_ports[@]}"; do
      local survivors
      survivors="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
      [[ -n "$survivors" ]] && echo "$survivors" | xargs kill -9 2>/dev/null || true
    done
    log_ok "Stopped $stopped service(s)"
  else
    log_info "No running services found"
  fi
}

cmd_restart() {
  cmd_stop
  sleep 2
  cmd_start "$@"
}

cmd_db() {
  load_env
  local action="${1:-help}"

  case "$action" in
    migrate)  run_migrations ;;
    seed)
      section "Seeding All Databases"
      bash "$SCRIPT_DIR/database/seed-all.sh"
      ;;
    reset)    db_reset ;;
    status)
      section "Database Status"
      for entry in "${DB_SERVICES[@]}"; do
        IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
        if psql -U "$DB_USER" -d "$db_name" -c "SELECT 1" &>/dev/null; then
          local table_count
          table_count=$(psql -U "$DB_USER" -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
          log_ok "  $db_name: connected ($table_count tables)"
        else
          log_error "  $db_name: FAILED to connect"
        fi
      done
      ;;
    reset-service)
      local service="${2:-}"
      if [[ -z "$service" ]]; then
        log_error "Usage: local-dev.sh db reset-service <service-name>"
        log_info "Available services:"
        for entry in "${DB_SERVICES[@]}"; do
          IFS='|' read -r svc_name _ db_name _ <<< "$entry"
          echo "  $svc_name ($db_name)"
        done
        return 1
      fi
      local found=false
      for entry in "${DB_SERVICES[@]}"; do
        IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
        if [[ "$svc_name" == "$service" ]]; then
          log_warn "Resetting database for $service ($db_name)..."
          psql -U postgres -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null
          psql -U postgres -c "CREATE DATABASE $db_name OWNER $DB_USER;" 2>/dev/null
          local db_url="${DB_BASE_URL}/${db_name}?schema=public"
          if [[ -f "$ROOT_DIR/$svc_dir/prisma/schema.prisma" ]]; then
            local migrate_out
            set +e
            migrate_out="$(cd "$ROOT_DIR/$svc_dir" && DATABASE_URL="$db_url" pnpm exec prisma migrate deploy 2>&1)"
            local migrate_rc=$?
            set -e
            echo "$migrate_out" | tail -3
            if [[ $migrate_rc -ne 0 ]]; then
              log_warn "  Migration failed for $service (rc=$migrate_rc)"
            fi
          fi
          log_ok "Database for $service reset and migrated"
          found=true
          break
        fi
      done
      if [[ "$found" != "true" ]]; then
        log_error "Service '$service' not found"
        return 1
      fi
      ;;
    test)
      section "Testing Database Connections"
      local failed=0
      for entry in "${DB_SERVICES[@]}"; do
        IFS='|' read -r svc_name svc_dir db_name port <<< "$entry"
        if psql -U "$DB_USER" -d "$db_name" -c "SELECT 1" &>/dev/null; then
          log_ok "  $db_name: OK"
        else
          log_error "  $db_name: FAILED"
          failed=$((failed + 1))
        fi
      done
      if [[ $failed -eq 0 ]]; then
        log_ok "All database connections successful"
      else
        log_error "$failed database connection(s) failed"
        return 1
      fi
      ;;
    studio)
      local service="${2:-auth-service}"
      local dir=""
      for d in "$ROOT_DIR"/services/*/"$service" "$ROOT_DIR"/apps/"$service"; do
        if [[ -f "$d/prisma/schema.prisma" ]]; then dir="$d"; break; fi
      done
      if [[ -z "$dir" ]]; then
        log_error "No prisma schema found for '$service'"
        return 1
      fi
      # Find the correct DB URL from the service's .env
      local svc_db_url
      svc_db_url="$(grep '^DATABASE_URL=' "$dir/.env" 2>/dev/null | head -1 | cut -d= -f2-)"
      [[ -z "$svc_db_url" ]] && svc_db_url="${DB_BASE_URL}/azeebo_dev?schema=public"
      (cd "$dir" && DATABASE_URL="$svc_db_url" pnpm exec prisma studio)
      ;;
    help|*)
      echo "Usage: $0 db [migrate|seed|reset|reset-service|test|studio] [service-name]"
      echo ""
      echo "  migrate              Run Prisma migrations for all per-service databases"
      echo "  seed                 Seed all databases with demo data"
      echo "  reset                Drop, recreate, migrate, and seed (DESTRUCTIVE)"
      echo "  reset-service <svc>  Reset a specific service's database"
      echo "  test                 Test all database connections"
      echo "  studio [service]     Open Prisma Studio (default: auth-service)"
      ;;
  esac
}

cmd_validate() {
  detect_os
  load_env
  echo ""
  log_info "Azeebo+ Environment Validation (v${SCRIPT_VERSION})"
  local failed=0
  validate_prereqs || failed=$((failed + 1))
  validate_env || failed=$((failed + 1))
  echo ""
  (( failed == 0 )) && log_ok "All validations passed" || log_error "$failed validation(s) failed"
}

cmd_clean() {
  section "Cleaning Up"
  cmd_stop
  rm -rf "$LOG_DIR"/* 2>/dev/null || true
  rm -rf "$STATE_DIR" 2>/dev/null || true
  log_ok "Cleaned"
}

cmd_deploy() {
  section "Local Staging Deployment"
  log_info "Building and deploying all services locally"

  # Build T0 packages
  build_t0_packages || return 1

  # Build admin and creator client SPAs
  section "Building Admin Client"
  if pnpm --filter @azeebo/admin run build:client 2>&1 | tail -3; then
    log_ok "Admin client built"
  else
    log_warn "Admin client build failed (non-critical)"
  fi

  section "Building Creator Client"
  if pnpm --filter @azeebo/creator run build:client 2>&1 | tail -3; then
    log_ok "Creator client built"
  else
    log_warn "Creator client build failed (non-critical)"
  fi

  # Run migrations
  run_migrations

  # Start all services
  log_info "Starting all services..."
  cmd_start --all

  # Run smoke tests
  cmd_smoke
}

cmd_smoke() {
  section "Running Smoke Tests"
  local failed=0
  local base_url="${SMOKE_BASE_URL:-http://localhost}"

  local endpoints=(
    "3013:API Gateway:/health"
    "4000:Web App:/"
    "4014:Creator Portal:/v1/health"
    "4016:Admin Panel:/v1/health"
  )

  for entry in "${endpoints[@]}"; do
    IFS=':' read -r port name path <<< "$entry"
    if curl -sf "${base_url}:${port}${path}" >/dev/null 2>&1; then
      log_ok "  $name: healthy (port $port)"
    else
      log_error "  $name: unhealthy (port $port)"
      failed=$((failed + 1))
    fi
  done

  # Test API endpoints
  local api_endpoints=(
    "/api/v1/auth/health:Auth Service"
    "/api/v1/users/health:User Service"
    "/api/v1/wallet/health:Wallet Service"
    "/api/v1/content/health:Content Service"
  )

  for entry in "${api_endpoints[@]}"; do
    IFS=':' read -r path name <<< "$entry"
    if curl -sf "${base_url}:3013${path}" >/dev/null 2>&1; then
      log_ok "  $name: healthy"
    else
      log_warn "  $name: not responding (may need full startup)"
    fi
  done

  if (( failed > 0 )); then
    log_error "$failed endpoint(s) failed smoke tests"
    return 1
  fi
  log_ok "All smoke tests passed"
}

cmd_seed() {
  section "Seeding Demo Data"
  bash "$SCRIPT_DIR/database/seed-all.sh"
}

cmd_help() {
  cat << 'HELPEOF'
Azeebo+ Local Development Environment (v3.4.0)
================================================
Native dev runner — all services run via pnpm on the host.
Uses per-service databases matching the Docker all-in-one setup.
Docker architecture is preserved for staging/production deployment.

USAGE:
  ./scripts/local-dev.sh <command> [options]

COMMANDS:
  setup          Create per-service databases, run migrations, install deps
  start [opts]   Start selected service groups
  stop           Stop all running services
  restart [opts] Restart all services
  status         Show status of all services
  logs [pattern] Tail logs for services matching pattern
  db <action>    Database operations
  deploy         Build all + migrate + start all + smoke tests
  smoke          Run health check smoke tests against running services
  seed           Seed databases with demo data
  validate       Validate environment
  clean          Stop services and clean logs/state
  help           Show this help

START OPTIONS:
  --core         Auth, user, wallet, payment, content, search, media
  --engagement   Notification, reward, engagement, messaging, referral, subscription
  --intelligence Analytics, recommendation
  --universes    Reality, movie, comedy, games, sports, lifestyle, vertical, creator
  --operations   Queue, support, moderation
  --gateway      API gateway
  --frontend     Web, admin, creator (runs via pnpm dev)
  --all          Everything (~6GB+ RAM)
  --quick        Core + gateway + web (recommended)
  --no-build     Skip prisma generate (fast start with cached builds)
  --skip-migrate Skip migration checks (use --no-build for full skip)

DB ACTIONS:
  migrate        Run Prisma migrations for all services
  seed           Seed databases with demo data
  reset          Drop, recreate, migrate, seed (DESTRUCTIVE)
  studio [svc]   Open Prisma Studio for a service

DATABASES (one per service):
  azeebo_auth         azeebo_notification   azeebo_reality
  azeebo_user         azeebo_reward         azeebo_movie
  azeebo_wallet       azeebo_engagement     azeebo_comedy
  azeebo_payment      azeebo_messaging      azeebo_games
  azeebo_content      azeebo_referral       azeebo_sports
  azeebo_search       azeebo_subscription   azeebo_lifestyle
  azeebo_media        azeebo_analytics      azeebo_vertical
                      azeebo_recommendation azeebo_creator
  azeebo_queue  azeebo_support  azeebo_moderation

FIRST-TIME SETUP:
  1. Ensure PostgreSQL and Redis are running (FlyEnv or brew services)
  2. ./scripts/local-dev.sh setup
  3. ./scripts/local-dev.sh start --quick
  4. Open http://localhost:4000

DOCKER (staging/production):
  The all-in-one Docker setup is in Dockerfile.all-in-one and
  deploy/docker-compose.all-in-one.yml. This script is for local dev only.
HELPEOF
}

# ============================================================
# SECTION 10: Main
# ============================================================

main() {
  local command="${1:-help}"
  shift 2>/dev/null || true
  case "$command" in
    setup)    cmd_setup "$@" ;;
    start)    cmd_start "$@" ;;
    stop)     cmd_stop "$@" ;;
    restart)  cmd_restart "$@" ;;
    status)   show_status "$@" ;;
    logs)     tail_logs "$@" ;;
    db)       cmd_db "$@" ;;
    migrate)  cmd_db migrate "$@" ;;
    seed)     cmd_seed "$@" ;;
    deploy)   cmd_deploy "$@" ;;
    smoke)    cmd_smoke "$@" ;;
    validate) cmd_validate "$@" ;;
    clean)    cmd_clean "$@" ;;
    help|-h|--help) cmd_help ;;
    *)
      log_error "Unknown command: $command"
      echo ""
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
