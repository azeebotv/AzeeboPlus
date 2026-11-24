#!/usr/bin/env bash
# ============================================================
# Azeebo+ Production Docker Build & Deploy (Staging)
# ============================================================
# Builds all 32 images from docker-compose.prod.yml and starts
# the full stack with realistic staging credentials.
#
# Usage:
#   ./scripts/build-prod.sh          # build only
#   ./scripts/build-prod.sh --up     # build + start
#   ./scripts/build-prod.sh --down   # stop all containers
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Hostnames (APP_HOST, ADMIN_HOST, ...) for compose interpolation.
source "$ROOT/scripts/lib/domain-env.sh"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.staging"

# ── colours ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Preflight checks ──
if ! command -v docker &>/dev/null; then
  err "Docker CLI not found. Install Docker Desktop or run: podman machine init && podman machine start"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  warn ".env.staging not found — generating with random secrets..."
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
  REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
  JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')
  JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')
  INTERNAL_API_KEY=$(openssl rand -base64 32 | tr -d '\n/+=')

  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=azeebo
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=azeebo_staging
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
INTERNAL_API_KEY=$INTERNAL_API_KEY
GATEWAY_SECRET=$INTERNAL_API_KEY
NODE_ENV=production
LOG_LEVEL=info
POSTGRES_PORT=5432
REDIS_PORT=6379
GATEWAY_PORT=3013
WEB_PORT=4000
ADMIN_PORT=4016
CREATOR_PORT=4014
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:4016,http://localhost:4014
EOF
  ok "Created $ENV_FILE"
fi

# ── Helper: count services ──
count_services() {
  grep -c '^\s\s[a-z].*:$' "$COMPOSE_FILE" 2>/dev/null || echo "32"
}

# ── Commands ──
do_build() {
  info "Building all Docker images from $COMPOSE_FILE ..."
  echo ""
  info "This builds ~32 images (29 backend + 3 frontend)."
  info "First build will take 10-20 minutes; subsequent builds use cache."
  echo ""

  # Build in parallel (default Docker BuildKit concurrency)
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build \
    --parallel 2>&1 | while IFS= read -r line; do
      echo "$line"
    done

  echo ""
  ok "All images built successfully."
  echo ""
  info "Image sizes:"
  docker images --format "table {{.Repository}}\t{{.Size}}" | grep "azeebo" | head -40
}

do_up() {
  info "Starting full stack with docker compose..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

  echo ""
  info "Waiting for health checks (this takes 30-60 seconds)..."
  sleep 15

  echo ""
  info "Container status:"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

  echo ""
  ok "Stack is starting up!"
  echo ""
  echo "  Web:     http://localhost:4000"
  echo "  Admin:   http://localhost:4016"
  echo "  Creator: http://localhost:4014"
  echo "  Gateway: http://localhost:3013/health"
  echo ""
  info "Logs: docker compose -f $COMPOSE_FILE logs -f"
}

do_down() {
  info "Stopping all containers..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
  ok "All containers stopped."
}

do_status() {
  info "Container status:"
  docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_FILE" ps 2>/dev/null || \
  docker compose -f "$COMPOSE_FILE" ps

  echo ""
  info "Health check results:"
  for port in 3013 4000 4016 4014 3000 3001 3002 3003 3004 3005; do
    if curl -s -o /dev/null -w '' "http://localhost:$port/health" 2>/dev/null; then
      ok "Port $port: healthy"
    else
      warn "Port $port: not responding"
    fi
  done
}

# ── Main ──
case "${1:-build}" in
  --build|-b)  do_build ;;
  --up|-u)     do_build; do_up ;;
  --down|-d)   do_down ;;
  --status|-s) do_status ;;
  build)       do_build ;;
  up)          do_build; do_up ;;
  down)        do_down ;;
  status)      do_status ;;
  *)
    echo "Usage: $0 [--build|--up|--down|--status]"
    echo ""
    echo "  --build   Build all Docker images (default)"
    echo "  --up      Build + start all containers"
    echo "  --down    Stop all containers"
    echo "  --status  Show container status and health"
    exit 1
    ;;
esac
