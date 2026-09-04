#!/usr/bin/env bash
# ============================================================
# Azeebo+ All-in-One — Local Build & Run
# ============================================================
# Builds the single all-in-one image from Dockerfile.all-in-one
# (PostgreSQL + Redis + PgBouncer + nginx + supervisord + all 28
# microservices + all frontends in ONE container) and runs it.
#
# Usage:
#   ./scripts/run-all-in-one.sh --up       # build + start (default)
#   ./scripts/run-all-in-one.sh --build    # build only
#   ./scripts/run-all-in-one.sh --logs     # follow container logs
#   ./scripts/run-all-in-one.sh --down     # stop + remove container
#   ./scripts/run-all-in-one.sh --status   # health status
#
# Requirements: Docker (or Colima/Podman with docker CLI).
# First build takes 15-30 min; subsequent builds use cache.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker-compose.all-in-one.yml"
ENV_FILE=".env.staging"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Preflight ──
if ! command -v docker &>/dev/null; then
  if command -v colima &>/dev/null; then
    warn "Docker CLI not found but Colima is installed. Starting Colima..."
    colima start --cpu 4 --memory 8
    export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
  else
    err "No container runtime found. Install Docker Desktop or run:"
    err "  brew install colima docker docker-compose && colima start"
    exit 1
  fi
fi

if ! docker info &>/dev/null 2>&1; then
  err "Docker daemon is not running. Start Docker Desktop / Colima first."
  exit 1
fi

# ── Env file ──
if [ ! -f "$ENV_FILE" ]; then
  warn "$ENV_FILE not found — generating with random secrets..."
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
  REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
  JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')
  JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=')
  INTERNAL_API_KEY=$(openssl rand -base64 32 | tr -d '\n/+=')

  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=azeebo
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=azeebo_dev
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
INTERNAL_API_KEY=$INTERNAL_API_KEY
GATEWAY_SECRET=$INTERNAL_API_KEY
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3013
EOF
  ok "Created $ENV_FILE"
fi

do_build() {
  info "Building all-in-one image (Dockerfile.all-in-one)..."
  info "This builds the ENTIRE platform into one image — expect 15-30 min first time."
  docker compose -f "$COMPOSE" --env-file "$ENV_FILE" build
  ok "Image built: ghcr.io/azeebotv/azeebo-all-in-one:dev"
}

do_up() {
  docker compose -f "$COMPOSE" --env-file "$ENV_FILE" up -d
  echo ""
  info "Container started. First boot takes 2-3 min (DB init + migrations + all services)."
  echo ""
  echo "  Web:     http://localhost:4000"
  echo "  Admin:   http://localhost:4016"
  echo "  Creator: http://localhost:4014"
  echo "  Gateway: http://localhost:3013/health"
  echo ""
  info "Watch readiness:  ./scripts/run-all-in-one.sh --status"
}

do_down() {
  docker compose -f "$COMPOSE" --env-file "$ENV_FILE" down
  ok "Container stopped."
}

do_status() {
  docker ps --filter "name=azeebo-all-in-one" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo ""
  for url in "http://localhost:3013/health" "http://localhost:4000" "http://localhost:4016" "http://localhost:4014"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then ok "$url → 200"
    else warn "$url → $code (still starting?)"; fi
  done
}

do_logs() {
  docker logs -f azeebo-all-in-one 2>&1
}

case "${1:---up}" in
  --build)   do_build ;;
  --up|-u)   do_build; do_up ;;
  --down|-d) do_down ;;
  --status|-s) do_status ;;
  --logs|-l) do_logs ;;
  *)
    echo "Usage: $0 [--up|--build|--down|--status|--logs]"
    exit 1 ;;
esac