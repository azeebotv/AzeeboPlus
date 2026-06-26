#!/usr/bin/env bash
# ============================================================
# Azeebo+ Local Development Environment
# ============================================================
# Production-grade development runner for all Azeebo+ services.
#
# Usage:
#   ./scripts/local-dev.sh [command] [options]
#
# Commands:
#   setup       Initialize database, generate Prisma clients, install deps
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
#   --frontend     Start frontend apps
#   --all          Start everything
#   --quick        Core + gateway + web (recommended for most dev work)
#
# Options (for 'db'):
#   migrate        Run Prisma migrations for all services
#   seed           Seed the database
#   reset          Reset database (drop + recreate + migrate)
#   studio         Open Prisma Studio for a service
#
# Environment:
#   LOG_LEVEL      Set log verbosity: debug, info, warn, error (default: info)
#   SKIP_PREREQS   Skip prerequisite checks (default: false)
#   DRY_RUN        Show what would be done without executing (default: false)
#
# ============================================================
set -euo pipefail

# ---- Script Metadata ----
SCRIPT_VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ---- Configuration ----
# Matches CI: Node.js >= 20.11.1, pnpm >= 10.33.2
REQUIRED_NODE_VERSION="20.11.1"
REQUIRED_PNPM_VERSION="10.33.2"
LOG_LEVEL="${LOG_LEVEL:-info}"
SKIP_PREREQS="${SKIP_PREREQS:-false}"
DRY_RUN="${DRY_RUN:-false}"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=2

# ---- Database ----
SHARED_DB="postgresql://postgres@localhost:5432/azeebo_plus_dev?schema=public"
REDIS_URL="redis://localhost:6379"

# ---- State ----
PIDS=()
LOG_DIR="$ROOT_DIR/.logs"
STATE_DIR="$ROOT_DIR/.dev-state"
PID_FILE="$STATE_DIR/pids"
START_TIME=""

# ---- File Descriptor Limit ----
# Large monorepos need more than macOS's default 256 open files limit.
# Raise soft limit so Watchpack / file watchers can operate correctly.
if [[ "$(uname -s)" == "Darwin" ]]; then
  ulimit -n 65536 2>/dev/null || true
fi

# ============================================================
# SECTION 1: Utilities
# ============================================================

# -- Colors (disabled when not a terminal) --
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'
  DIM='\033[2m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; DIM=''; RESET=''
fi

# -- Logging --
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

# -- Dry-run wrapper --
run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] $*"
    return 0
  fi
  log_debug "exec: $*"
  "$@"
}

# -- Section header --
section() {
  echo ""
  printf "%s${BOLD}── %s ──%s\n" "$BLUE" "$1" "$RESET" >&2
}

# -- Comparison helper --
version_gte() {
  # Returns 0 if $1 >= $2 (semver comparison)
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
# SECTION 2: OS Detection
# ============================================================

detect_os() {
  case "$(uname -s)" in
    Darwin*)  OS="macos" ;;
    Linux*)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        OS="wsl"
      else
        OS="linux"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
    *) OS="unknown" ;;
  esac
  log_debug "Detected OS: $OS"
}

# ============================================================
# SECTION 3: Prerequisite Validation
# ============================================================

check_command() {
  local cmd="$1" install_hint="${2:-}"
  if command -v "$cmd" &>/dev/null; then
    log_debug "  $cmd: $(command -v "$cmd")"
    return 0
  else
    log_error "$cmd not found${install_hint:+ ($install_hint)}"
    return 1
  fi
}

validate_prereqs() {
  section "Validating Prerequisites"
  local failed=0

  # Required tools
  check_command "node" "install via nvm: nvm install $REQUIRED_NODE_VERSION" || failed=$((failed + 1))
  check_command "pnpm" "install: npm install -g pnpm@$REQUIRED_PNPM_VERSION" || failed=$((failed + 1))
  check_command "psql" "install: brew install postgresql@15" || failed=$((failed + 1))
  check_command "redis-cli" "install: brew install redis" || failed=$((failed + 1))

  # Version checks
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

  if command -v pnpm &>/dev/null; then
    local pnpm_version
    pnpm_version="$(pnpm -v 2>/dev/null || echo "0")"
    if version_gte "$pnpm_version" "$REQUIRED_PNPM_VERSION"; then
      log_ok "pnpm $pnpm_version (>= $REQUIRED_PNPM_VERSION)"
    else
      log_warn "pnpm $pnpm_version detected (recommend >= $REQUIRED_PNPM_VERSION)"
    fi
  fi

  # Infrastructure checks
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

  # macOS: check file descriptor limit (default 256 is too low for monorepos)
  if [[ "$OS" == "macos" ]]; then
    local maxfiles_soft
    maxfiles_soft="$(launchctl limit maxfiles 2>/dev/null | awk '{print $2}')"
    if [[ -n "$maxfiles_soft" && "$maxfiles_soft" != "unlimited" && "$maxfiles_soft" -lt 1024 ]]; then
      log_error "macOS maxfiles soft limit is $maxfiles_soft (need >= 1024)"
      log_info "  Fix with: sudo launchctl limit maxfiles 65536 unlimited"
      log_info "  Then restart your terminal. This script will raise the soft limit automatically."
    else
      log_ok "File descriptor limit OK"
    fi
  fi

  # Check pnpm store
  if [ -d "$ROOT_DIR/node_modules" ]; then
    log_ok "Dependencies installed"
  else
    log_warn "node_modules not found (will install during setup)"
  fi

  if (( failed > 0 )); then
    log_error "$failed prerequisite(s) failed. Fix them and retry."
    return 1
  fi

  log_ok "All prerequisites satisfied"
  return 0
}

# ============================================================
# SECTION 4: Secure Environment Management
# ============================================================

# Generates cryptographically random secrets for local development.
# Stored in .env.local (gitignored via .env.* pattern in .gitignore).
generate_local_secrets() {
  local env_local="$ROOT_DIR/.env.local"

  if [[ -f "$env_local" ]]; then
    log_debug ".env.local already exists, checking for missing secrets"
    local needs_update=false
    if ! grep -q "JWT_ACCESS_SECRET" "$env_local" 2>/dev/null; then
      needs_update=true
    fi
    if ! grep -q "JWT_REFRESH_SECRET" "$env_local" 2>/dev/null; then
      needs_update=true
    fi
    if [[ "$needs_update" == "false" ]]; then
      log_debug "All secrets present in .env.local"
      return 0
    fi
  fi

  section "Generating Local Development Secrets"
  log_info "Creating .env.local with auto-generated JWT secrets"

  # Generate cryptographically random 64-character hex strings
  local jwt_access jwt_refresh
  if command -v openssl &>/dev/null; then
    jwt_access="$(openssl rand -hex 32)"
    jwt_refresh="$(openssl rand -hex 32)"
  elif [[ "$OS" == "macos" ]]; then
    jwt_access="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p | tr -d '\n')"
    jwt_refresh="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p | tr -d '\n')"
  else
    jwt_access="$(head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    jwt_refresh="$(head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  fi

  cat > "$env_local" << ENVEOF
# Auto-generated local development secrets
# DO NOT commit this file. It is gitignored.
# Regenerate with: ./scripts/local-dev.sh setup
JWT_ACCESS_SECRET=${jwt_access}
JWT_REFRESH_SECRET=${jwt_refresh}
ENVEOF

  chmod 600 "$env_local"
  log_ok "Secrets generated and saved to .env.local (mode 600)"
}

load_env() {
  # Load order: .env (defaults) -> .env.local (secrets) -> .env.${NODE_ENV} (overrides)
  # Environment variables already set take highest precedence.
  local env_files=("$ROOT_DIR/.env")

  # Load .env.local if it exists (secrets override defaults)
  if [[ -f "$ROOT_DIR/.env.local" ]]; then
    env_files+=("$ROOT_DIR/.env.local")
  fi

  # Load environment-specific overrides
  local node_env="${NODE_ENV:-development}"
  if [[ -f "$ROOT_DIR/.env.${node_env}" ]]; then
    env_files+=("$ROOT_DIR/.env.${node_env}")
  fi

  for env_file in "${env_files[@]}"; do
    if [[ -f "$env_file" ]]; then
      log_debug "Loading $env_file"
      set -a
      # shellcheck disable=SC1090
      source "$env_file"
      set +a
    fi
  done

  # Ensure critical env vars are set (with secure defaults for dev)
  export NODE_ENV="${NODE_ENV:-development}"
  export DATABASE_URL="${DATABASE_URL:-$SHARED_DB}"
  export DATABASE_PASSWORD="${DATABASE_PASSWORD:-}"
  export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
  export PORT="${PORT:-3000}"
  export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1d}"
  export JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN:-7d}"
  export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:4000,http://localhost:4014,http://localhost:4016}"

  # Service URLs for gateway routing (local mode — no Docker hostnames)
  export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3000}"
  export USER_SERVICE_URL="${USER_SERVICE_URL:-http://localhost:3001}"
  export WALLET_SERVICE_URL="${WALLET_SERVICE_URL:-http://localhost:3002}"
  export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL:-http://localhost:3003}"
  export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL:-http://localhost:3004}"
  export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL:-http://localhost:3005}"
  export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-http://localhost:3006}"
  export REWARD_SERVICE_URL="${REWARD_SERVICE_URL:-http://localhost:3007}"
  export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL:-http://localhost:3008}"
  export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL:-http://localhost:3009}"
  export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL:-http://localhost:3022}"
  export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL:-http://localhost:3015}"
  export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL:-http://localhost:3019}"

  # Rate limiting (relaxed for local dev)
  export RATE_LIMIT_TTL="${RATE_LIMIT_TTL:-60}"
  export RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-1000}"

  # Logging
  export LOG_LEVEL="${LOG_LEVEL:-debug}"
}

validate_env() {
  section "Validating Environment"
  local failed=0

  # JWT secrets: must be at least 32 characters and not contain shell-dangerous characters
  for secret_var in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
    local secret_val="${!secret_var:-}"
    if [[ -z "$secret_val" ]]; then
      log_error "$secret_var is not set"
      failed=$((failed + 1))
    elif [[ ${#secret_val} -lt 32 ]]; then
      log_error "$secret_var must be at least 32 characters (got ${#secret_val})"
      failed=$((failed + 1))
    elif [[ "$secret_val" == *"!!"* ]]; then
      # Warn about !! which causes zsh history expansion issues
      log_warn "$secret_var contains '!!' — this may cause issues in zsh. Consider regenerating."
    else
      log_ok "$secret_var: ${#secret_val} characters"
    fi
  done

  # DATABASE_URL
  if [[ -z "${DATABASE_URL:-}" ]]; then
    log_error "DATABASE_URL is not set"
    failed=$((failed + 1))
  else
    log_ok "DATABASE_URL is set"
  fi

  # REDIS_URL
  if [[ -z "${REDIS_URL:-}" ]]; then
    log_error "REDIS_URL is not set"
    failed=$((failed + 1))
  else
    log_ok "REDIS_URL is set"
  fi

  if (( failed > 0 )); then
    log_error "Environment validation failed. Run './scripts/local-dev.sh setup' to fix."
    return 1
  fi

  log_ok "Environment validated"
  return 0
}

# ============================================================
# SECTION 5: Database Operations
# ============================================================

setup_database() {
  section "Setting up Database"

  # Create database if it doesn't exist
  if psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='azeebo_plus_dev'" 2>/dev/null | grep -q 1; then
    log_ok "Database azeebo_plus_dev exists"
  else
    log_info "Creating database azeebo_plus_dev..."
    run_cmd psql -U postgres -c "CREATE DATABASE azeebo_plus_dev;" 2>/dev/null
    log_ok "Created database azeebo_plus_dev"
  fi

  # Enable required extensions (idempotent)
  for ext in "uuid-ossp" "pgcrypto"; do
    if psql -U postgres -d azeebo_plus_dev -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" 2>/dev/null; then
      log_debug "Extension $ext enabled"
    fi
  done
  log_ok "Extensions configured"

  # Ensure 'postgres' user can connect without password (local trust auth)
  log_debug "Verifying postgres user can connect..."
  if psql -U postgres -d azeebo_plus_dev -c "SELECT 1;" &>/dev/null; then
    log_ok "PostgreSQL connection verified"
  else
    log_error "Cannot connect to PostgreSQL as 'postgres' user"
    log_info "  Ensure pg_hba.conf has: local all postgres trust"
    return 1
  fi
}

run_prisma_generate() {
  section "Generating Prisma Clients"

  local services_with_prisma=()
  for dir in "$ROOT_DIR"/services/*/*/; do
    if [[ -f "$dir/prisma/schema.prisma" ]]; then
      services_with_prisma+=("$dir")
    fi
  done
  for dir in "$ROOT_DIR"/apps/*/; do
    if [[ -f "$dir/prisma/schema.prisma" ]]; then
      services_with_prisma+=("$dir")
    fi
  done

  local total=${#services_with_prisma[@]}
  local count=0

  for dir in "${services_with_prisma[@]}"; do
    count=$((count + 1))
    local name
    name="$(basename "$dir")"

    # Skip if already generated (check for client output)
    local prisma_schema="$dir/prisma/schema.prisma"
    local generator_output
    generator_output="$(grep -A2 'generator client' "$prisma_schema" 2>/dev/null | grep 'output' | sed 's/.*= *"\(.*\)".*/\1/' | head -1)"

    local client_dir
    if [[ -n "$generator_output" ]]; then
      client_dir="$dir/$generator_output"
    else
      client_dir="$dir/node_modules/.prisma"
    fi

    if [[ -d "$client_dir" ]]; then
      log_debug "  [$count/$total] $name: already generated"
      continue
    fi

    log_info "  [$count/$total] $name: generating..."
    local gen_output
    gen_output="$(cd "$dir" && DATABASE_URL="$SHARED_DB" npx prisma generate 2>&1)" && {
      log_ok "  [$count/$total] $name: done"
      continue
    }
    log_warn "  [$count/$total] $name: failed (non-fatal)"
    log_debug "    $gen_output"
  done
}

run_migrations() {
  section "Running Prisma Migrations"

  local count=0
  local failed=0

  for dir in "$ROOT_DIR"/services/*/*/ "$ROOT_DIR"/apps/*/; do
    if [[ ! -f "$dir/prisma/schema.prisma" ]]; then
      continue
    fi
    count=$((count + 1))
    local name
    name="$(basename "$dir")"

    log_info "  Migrating $name..."
    local migrate_output
    set +e
    migrate_output="$(cd "$dir" && export DATABASE_URL="$SHARED_DB" && npx prisma migrate deploy 2>&1)"
    local rc=$?
    set -e

    if [[ $rc -eq 0 ]]; then
      log_ok "  $name: migrated"
    else
      # P3009 = failed migrations in target database
      # P3018 = migration failed to apply (e.g. table already exists from shared DB)
      # P3019 = broken migration_lock.toml (pre-existing in admin/creator-portal)
      if echo "$migrate_output" | grep -q "P3009\|P3018\|P3019\|already exists"; then
        log_warn "  $name: skipped (shared DB table conflict — non-fatal)"
      else
        log_warn "  $name: skipped (rc=$rc)"
        log_debug "    $migrate_output"
      fi
      failed=$((failed + 1))
    fi
  done

  log_ok "Migrations complete ($count services, $failed skipped)"
}

db_reset() {
  section "Resetting Database"
  log_warn "This will DROP and recreate the azeebo_plus_dev database"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[dry-run] Would drop and recreate database"
    return 0
  fi

  read -r -p "Are you sure? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log_info "Aborted"
    return 0
  fi

  psql -U postgres -c "DROP DATABASE IF EXISTS azeebo_plus_dev;" 2>/dev/null
  psql -U postgres -c "CREATE DATABASE azeebo_plus_dev;" 2>/dev/null
  log_ok "Database recreated"

  setup_database
  run_prisma_generate
  run_migrations
}

# ============================================================
# SECTION 6: Service Registry
# ============================================================

# Service format: "name|relative_dir|port"
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
)

# ============================================================
# SECTION 7: Service Lifecycle
# ============================================================

check_port() {
  local port="$1"
  if lsof -i :"$port" -sTCP:LISTEN &>/dev/null 2>&1; then
    return 1  # port in use
  fi
  return 0
}

kill_port() {
  local port="$1"
  local pid
  pid="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pid" ]]; then
    log_info "  Stopping process on port $port (PID $pid)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    # Force kill if still alive
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
}

start_service() {
  local entry="$1"
  local group_name="$2"
  IFS='|' read -r pkg dir port <<< "$entry"

  local service_dir="$ROOT_DIR/$dir"

  # Check if the service directory exists
  if [[ ! -d "$service_dir" ]]; then
    log_warn "  $pkg: directory not found ($dir) — skipping"
    return 1
  fi

  # Check if port is available, kill existing process if needed
  if ! check_port "$port"; then
    log_warn "  $pkg: port $port in use — killing existing process"
    kill_port "$port"
    sleep 1
  fi

  # Ensure log directory exists
  mkdir -p "$LOG_DIR"
  local log_file="$LOG_DIR/${group_name}-${pkg##*/}.log"
  : > "$log_file"  # truncate

  # Load service .env file (for JWT keys, etc.)
  if [[ -f "$service_dir/.env" ]]; then
    set -a
    source "$service_dir/.env"
    set +a
  fi

  # Set critical environment for this service (override service .env values)
  export DATABASE_URL="$SHARED_DB"
  export DATABASE_PASSWORD=""
  export REDIS_URL="$REDIS_URL"
  export NODE_ENV="development"
  export PORT="$port"

  local run_cmd_str

  if [[ "$dir" == "apps/web" ]]; then
    export NEXT_PUBLIC_API_URL="http://localhost:3013"
    # Use polling-based file watching to avoid EMFILE errors in large monorepos
    export WATCHPACK_POLLING=true
    export CHOKIDAR_USEPOLLING=true
    run_cmd_str="cd $service_dir && pnpm dev"
  elif [[ -f "$service_dir/package.json" ]] && grep -q '"start:dev"' "$service_dir/package.json" 2>/dev/null; then
    run_cmd_str="cd $service_dir && pnpm start:dev"
  elif [[ -f "$service_dir/package.json" ]] && grep -q '"start"' "$service_dir/package.json" 2>/dev/null; then
    run_cmd_str="cd $service_dir && pnpm start"
  else
    log_warn "  $pkg: no start script found — skipping"
    return 1
  fi

  # Start service in background with nohup so it survives shell exit
  nohup bash -c "$run_cmd_str" >> "$log_file" 2>&1 &
  disown
  local pid=$!
  PIDS+=("$pid")

  # Save PID to state file for recovery
  echo "$pid" >> "$PID_FILE"

  # Brief wait to check if it starts successfully
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    log_ok "  $pkg started on port $port (PID $pid)"
    return 0
  else
    log_error "  $pkg failed to start — check $log_file"
    tail -3 "$log_file" 2>/dev/null | sed 's/^/    /'
    return 1
  fi
}

start_group() {
  local group_name="$1"
  shift
  local entries=("$@")

  section "Starting $group_name Services"

  local started=0
  local failed=0

  for entry in "${entries[@]}"; do
    if start_service "$entry" "$group_name"; then
      started=$((started + 1))
    else
      failed=$((failed + 1))
    fi
  done

  log_info "  $group_name: $started started, $failed failed"
}

health_check() {
  local port="$1" name="$2"
  local elapsed=0

  while (( elapsed < HEALTH_CHECK_TIMEOUT )); do
    if curl -sf "http://localhost:$port/health" &>/dev/null 2>&1 || \
       curl -sf "http://localhost:$port/api/health" &>/dev/null 2>&1; then
      log_ok "  $name: healthy"
      return 0
    fi
    sleep "$HEALTH_CHECK_INTERVAL"
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
  done

  log_warn "  $name: health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
  return 1
}

# ============================================================
# SECTION 8: Cleanup & Signal Handling
# ============================================================

cleanup() {
  echo ""
  log_info "Shutting down services..."

  # Kill all tracked PIDs
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done

  # Also check PID file for any orphaned processes
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  # Wait briefly for graceful shutdown
  wait 2>/dev/null || true

  log_ok "All services stopped"
  exit 0
}

setup_signal_handlers() {
  trap cleanup SIGINT SIGTERM EXIT
}

# ============================================================
# SECTION 9: Status & Logs
# ============================================================

show_status() {
  section "Service Status"

  local all_entries=(
    "${CORE_SERVICES[@]}"
    "${GATEWAY_SERVICES[@]}"
    "${FRONTEND_SERVICES[@]}"
  )

  printf "  ${BOLD}%-35s %-8s %-10s %s${RESET}\n" "SERVICE" "PORT" "STATUS" "PID"
  printf "  %-35s %-8s %-10s %s\n" "---" "---" "---" "---"

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
    log_error "No logs directory found. Start services first."
    return 1
  fi

  local log_files
  log_files="$(find "$LOG_DIR" -name "*.log" | grep -E "$service_pattern" || true)"

  if [[ -z "$log_files" ]]; then
    log_error "No log files matching '$service_pattern'"
    log_info "Available logs:"
    ls "$LOG_DIR"/*.log 2>/dev/null | sed 's|.*/||' | sed 's/^/  /'
    return 1
  fi

  log_info "Tailing logs (Ctrl+C to stop)..."
  tail -f $log_files
}

# ============================================================
# SECTION 10: Commands
# ============================================================

cmd_setup() {
  section "Azeebo+ Development Environment Setup"
  log_info "Version: $SCRIPT_VERSION"

  detect_os

  if [[ "$SKIP_PREREQS" != "true" ]]; then
    validate_prereqs || return 1
  fi

  load_env
  generate_local_secrets
  load_env  # Reload to pick up .env.local values
  validate_env || return 1

  setup_database
  run_prisma_generate

  # Install dependencies if needed
  if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    section "Installing Dependencies"
    (cd "$ROOT_DIR" && pnpm install) || {
      log_error "pnpm install failed"
      return 1
    }
    log_ok "Dependencies installed"
  else
    log_ok "Dependencies already installed"
  fi

  log_ok "Setup complete! Run './scripts/local-dev.sh start --quick' to begin."
}

cmd_start() {
  detect_os
  load_env

  if [[ "$SKIP_PREREQS" != "true" ]]; then
    validate_prereqs || return 1
  fi
  validate_env || return 1

  mkdir -p "$STATE_DIR" "$LOG_DIR"
  : > "$PID_FILE"
  # For start command: only trap SIGINT/SIGTERM, NOT EXIT
  # Services must survive after the script exits
  trap cleanup SIGINT SIGTERM

  # Check if services are already running
  if [[ -f "$PID_FILE" ]] && [[ -s "$PID_FILE" ]]; then
    local running=0
    while IFS= read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        running=$((running + 1))
      fi
    done < "$PID_FILE"
    if (( running > 0 )); then
      log_warn "$running service(s) already running. Use './scripts/local-dev.sh stop' first."
      return 1
    fi
  fi

  START_TIME=$(date +%s)
  log_info "Starting services..."

  # No arguments = interactive menu
  if [[ $# -eq 0 ]]; then
    cmd_start_interactive
    return $?
  fi

  # Parse command-line flags
  local do_core=false do_engagement=false do_intelligence=false
  local do_universes=false do_operations=false do_gateway=false
  local do_frontend=false do_all=false do_quick=false

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
      *)              log_error "Unknown option: $1"; return 1 ;;
    esac
    shift
  done

  if [[ "$do_all" == "true" ]]; then
    do_core=true; do_engagement=true; do_intelligence=true
    do_universes=true; do_operations=true; do_gateway=true; do_frontend=true
  fi

  if [[ "$do_quick" == "true" ]]; then
    do_core=true; do_gateway=true; do_frontend=true
  fi

  local total_started=0

  if [[ "$do_core" == "true" ]]; then
    start_group "core" "${CORE_SERVICES[@]}"
  fi
  if [[ "$do_engagement" == "true" ]]; then
    start_group "engagement" "${ENGAGEMENT_SERVICES[@]}"
  fi
  if [[ "$do_intelligence" == "true" ]]; then
    start_group "intelligence" "${INTELLIGENCE_SERVICES[@]}"
  fi
  if [[ "$do_universes" == "true" ]]; then
    start_group "universes" "${UNIVERSE_SERVICES[@]}"
  fi
  if [[ "$do_operations" == "true" ]]; then
    start_group "operations" "${OPERATIONS_SERVICES[@]}"
  fi
  if [[ "$do_gateway" == "true" ]]; then
    start_group "gateway" "${GATEWAY_SERVICES[@]}"
  fi
  if [[ "$do_frontend" == "true" ]]; then
    start_group "frontend" "${FRONTEND_SERVICES[@]}"
  fi

  local elapsed=$(( $(date +%s) - START_TIME ))
  echo ""
  log_ok "Services started in ${elapsed}s. Check .logs/ for output."
  log_info "Press Ctrl+C to stop all services."
  echo ""

  # Wait forever (or until Ctrl+C)
  wait || true
}

cmd_start_interactive() {
  echo ""
  printf "${BOLD}${BLUE}Azeebo+ Local Dev Runner${RESET}\n"
  printf "${BLUE}========================${RESET}\n"
  echo ""
  echo "Available service groups:"
  echo "  1)  Core Services       (auth, user, wallet, payment, content, search, media)"
  echo "  2)  Engagement Services (notification, reward, engagement, messaging, referral, subscription)"
  echo "  3)  Intelligence        (analytics, recommendation)"
  echo "  4)  Universe Services   (all universe microservices)"
  echo "  5)  Operations          (queue, support, moderation)"
  echo "  6)  Gateway             (api-gateway)"
  echo "  7)  Frontend Apps       (web)"
  echo "  8)  All Services        (everything — heavy!)"
  echo "  9)  Quick Start         (gateway + core + frontend web)"
  echo "  0)  Exit"
  echo ""
  echo "${YELLOW}Tip: Start with option 9 (core + gateway + web) for most development.${RESET}"
  echo "${YELLOW}RAM: ~200-300MB per NestJS service, ~500MB for web.${RESET}"
  echo ""

  local choice=""
  if [ -t 0 ]; then
    read -r -p "Select groups to start (comma-separated, e.g. 1,6,7): " choice
  fi

  if [[ -z "$choice" ]]; then
    log_info "No selection made"
    return 0
  fi

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
  log_ok "Services started in ${elapsed}s. Check .logs/ for output."
  log_info "Press Ctrl+C to stop all services."
  echo ""

  wait || true
}

cmd_stop() {
  section "Stopping All Services"
  load_env

  local stopped=0

  # Kill services by port
  local all_ports=(
    3000 3001 3002 3003 3004 3005 3006 3007 3008 3009
    3010 3011 3012 3013 3014 3015 3016 3017 3018 3019
    3020 3021 3022 3023 3024 3025 3026 4000 4014 4016
  )

  for port in "${all_ports[@]}"; do
    local pid
    pid="$(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      log_info "  Stopping port $port (PID $pid)"
      kill "$pid" 2>/dev/null || true
      stopped=$((stopped + 1))
    fi
  done

  # Also check PID file
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        stopped=$((stopped + 1))
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  if (( stopped > 0 )); then
    sleep 1
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
    seed)     log_info "Seeding database..."; (cd "$ROOT_DIR" && psql -U postgres -d azeebo_plus_dev -f prisma/seed/universes.sql 2>/dev/null) && log_ok "Seed complete" ;;
    reset)    db_reset ;;
    studio)
      local service="${2:-auth-service}"
      local dir=""
      for d in "$ROOT_DIR"/services/*/"$service" "$ROOT_DIR"/apps/"$service"; do
        if [[ -f "$d/prisma/schema.prisma" ]]; then
          dir="$d"
          break
        fi
      done
      if [[ -z "$dir" ]]; then
        log_error "No prisma schema found for '$service'"
        return 1
      fi
      (cd "$dir" && DATABASE_URL="$SHARED_DB" npx prisma studio)
      ;;
    help|*)
      echo "Usage: $0 db [migrate|seed|reset|studio] [service-name]"
      echo ""
      echo "  migrate              Run Prisma migrations for all services"
      echo "  seed                 Seed the database with initial data"
      echo "  reset                Drop, recreate, and migrate database (destructive!)"
      echo "  studio [service]     Open Prisma Studio (default: auth-service)"
      ;;
  esac
}

cmd_validate() {
  detect_os
  load_env

  echo ""
  log_info "Azeebo+ Environment Validation"
  log_info "Version: $SCRIPT_VERSION"
  log_info "OS: $OS"
  echo ""

  local failed=0
  validate_prereqs || failed=$((failed + 1))
  validate_env || failed=$((failed + 1))

  echo ""
  if (( failed == 0 )); then
    log_ok "All validations passed"
  else
    log_error "$failed validation(s) failed"
    return 1
  fi
}

cmd_clean() {
  section "Cleaning Up"

  cmd_stop

  log_info "Cleaning logs..."
  rm -rf "$LOG_DIR"/* 2>/dev/null || true
  rm -rf "$STATE_DIR" 2>/dev/null || true
  log_ok "Logs and state cleaned"
}

cmd_help() {
  cat << 'HELPEOF'
Azeebo+ Local Development Environment
======================================

A production-grade development runner for all Azeebo+ microservices.

USAGE:
  ./scripts/local-dev.sh <command> [options]

COMMANDS:
  setup                  Initialize database, generate Prisma clients, install deps
  start [options]        Start selected service groups
  stop                   Stop all running services
  restart [options]      Restart all services
  status                 Show status of all services
  logs [pattern]         Tail logs (optional: filter by service name pattern)
  db <action>            Database operations
  validate               Validate environment and prerequisites
  clean                  Stop services and clean logs/state
  help                   Show this help message

START OPTIONS:
  --core                 Core services (auth, user, wallet, payment, content, search, media)
  --engagement           Engagement services (notification, reward, messaging, etc.)
  --intelligence         Intelligence services (analytics, recommendation)
  --universes            Universe services (reality, movie, comedy, games, etc.)
  --operations           Operations services (queue, support, moderation)
  --gateway              API gateway (required for frontend to work)
  --frontend             Frontend apps (web)
  --all                  Start everything (heavy — ~6GB+ RAM)
  --quick                Core + gateway + web (recommended for most development)

DB ACTIONS:
  migrate                Run Prisma migrations for all services
  seed                   Seed the database with initial data
  reset                  Drop, recreate, and migrate (DESTRUCTIVE)
  studio [service]       Open Prisma Studio (default: auth-service)

ENVIRONMENT VARIABLES:
  LOG_LEVEL              Log verbosity: debug, info, warn, error (default: info)
  SKIP_PREREQS           Skip prerequisite checks (default: false)
  DRY_RUN                Show what would be done without executing (default: false)
  NODE_ENV               Environment mode (default: development)

FIRST-TIME SETUP:
  1. Ensure PostgreSQL and Redis are running
  2. Run: ./scripts/local-dev.sh setup
  3. Run: ./scripts/local-dev.sh start --quick
  4. Open http://localhost:4000

SERVICE PORTS:
  3000  auth-service         3006  notification-service
  3001  user-service         3007  reward-service
  3002  wallet-service       3008  analytics-service
  3003  payment-service      3009  recommendation-service
  3004  content-service      3013  api-gateway
  3005  search-service       3014  games-service
  3019  media-service        4000  web app

SECURITY:
  JWT secrets are auto-generated and stored in .env.local (gitignored).
  Never commit .env.local to version control.

TROUBLESHOOTING:
  - Port in use: Run './scripts/local-dev.sh stop' first
  - DB errors: Run './scripts/local-dev.sh db reset'
  - Slow startup: Use './scripts/local-dev.sh start --quick' instead of --all
  - Check logs: ./scripts/local-dev.sh logs auth-service
HELPEOF
}

# ============================================================
# SECTION 11: Main Entry Point
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
