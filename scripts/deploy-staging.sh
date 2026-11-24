#!/usr/bin/env bash
# ============================================================
# Azeebo+ Staging Deployment
# ============================================================
# Builds Docker image, pushes to GHCR, and deploys to staging.
#
# Deployment strategy:
#   1. Trigger Coolify webhook (preferred)
#   2. Fall back to SSH deploy if webhook not configured
#
# Usage:
#   ./scripts/deploy-staging.sh [options]
#
# Options:
#   --tag TAG        Docker image tag (default: git SHA)
#   --skip-build     Skip Docker build (use existing image)
#   --skip-push      Skip GHCR push
#   --skip-health    Skip post-deploy health checks
#   --dry-run        Show what would be done
#
# Environment:
#   COOLIFY_STAGING_WEBHOOK  Webhook URL for Coolify deploy
#   STAGING_SSH_HOST         SSH host for fallback deploy
#   STAGING_SSH_USER         SSH user for fallback deploy
#   STAGING_SSH_PATH         Remote path for fallback deploy
#   GHCR_IMAGE               Full image name (default: ghcr.io/azeebo/azeebo-plus)
# ============================================================
set -euo pipefail

# ---- Script Metadata ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ---- Domain registry ----
source "$SCRIPT_DIR/lib/domain-env.sh"

# ---- Configuration ----
IMAGE="${GHCR_IMAGE:-ghcr.io/azeebo/azeebo-plus}"
TAG="${TAG:-$(cd "$ROOT_DIR" && git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_HEALTH=false
DRY_RUN=false

# ---- Environment ----
COOLIFY_WEBHOOK="${COOLIFY_STAGING_WEBHOOK:-}"
SSH_HOST="${STAGING_SSH_HOST:-}"
SSH_USER="${STAGING_SSH_USER:-deploy}"
SSH_PATH="${STAGING_SSH_PATH:-/opt/azeebo}"
HEALTH_TIMEOUT=300
HEALTH_INTERVAL=5

# ---- Colors ----
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; RESET=''
fi

log()   { printf "%s${CYAN}[INFO]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
ok()    { printf "%s${GREEN}[  OK]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
warn()  { printf "%s${YELLOW}[WARN]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
error() { printf "%s${RED}[FAIL]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*" >&2; }
section() { echo ""; printf "%s${BOLD}── %s ──%s\n" "$CYAN" "$1" "$RESET"; }

run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[dry-run] $*"
    return 0
  fi
  "$@"
}

# ---- Options ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)         TAG="$2"; shift 2 ;;
    --skip-build)  SKIP_BUILD=true ;;
    --skip-push)   SKIP_PUSH=true ;;
    --skip-health) SKIP_HEALTH=true ;;
    --dry-run)     DRY_RUN=true ;;
    -h|--help)
      head -25 "$0" | tail -20
      exit 0
      ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ---- Prerequisites ----
check_prerequisites() {
  section "Checking Prerequisites"
  local failed=0

  if ! command -v docker &>/dev/null; then
    error "Docker is required but not found"
    failed=$((failed + 1))
  else
    ok "Docker: $(docker --version | head -1)"
  fi

  if ! docker info &>/dev/null 2>&1; then
    error "Docker daemon is not running"
    failed=$((failed + 1))
  fi

  if [[ "$SKIP_PUSH" != "true" ]] && ! command -v gh &>/dev/null; then
    warn "GitHub CLI (gh) not found — GHCR login may need manual auth"
  fi

  if (( failed > 0 )); then
    error "Prerequisites check failed"
    exit 1
  fi
}

# ---- Docker Build ----
build_image() {
  section "Building Docker Image"
  local full_image="${IMAGE}:${TAG}"
  local latest_image="${IMAGE}:latest"

  log "Image: ${full_image}"
  log "Dockerfile: Dockerfile.all-in-one"

  run_cmd docker build \
    -f Dockerfile.all-in-one \
    -t "$full_image" \
    -t "$latest_image" \
    --label "azeebo.version=${TAG}" \
    --label "azeebo.build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --label "azeebo.git-sha=$(cd "$ROOT_DIR" && git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
    "$ROOT_DIR"

  ok "Image built: ${full_image}"
}

# ---- GHCR Push ----
push_image() {
  section "Pushing to GHCR"
  local full_image="${IMAGE}:${TAG}"

  # Ensure we're logged in
  if ! docker auth ghcr.io &>/dev/null 2>&1; then
    if command -v gh &>/dev/null; then
      log "Logging in to GHCR via GitHub CLI..."
      run_cmd gh auth docker 2>/dev/null || {
        error "GHCR login failed — run 'gh auth docker' or 'docker login ghcr.io' manually"
        exit 1
      }
    else
      error "Not logged in to GHCR. Run: docker login ghcr.io"
      exit 1
    fi
  fi

  log "Pushing ${full_image}..."
  run_cmd docker push "$full_image"
  run_cmd docker push "${IMAGE}:latest"
  ok "Pushed: ${full_image}"
}

# ---- Deploy via Coolify Webhook ----
deploy_coolify() {
  section "Deploying via Coolify Webhook"

  if [[ -z "$COOLIFY_WEBHOOK" ]]; then
    warn "COOLIFY_STAGING_WEBHOOK not set — skipping Coolify deploy"
    return 1
  fi

  log "Triggering Coolify webhook..."
  local response
  response="$(run_cmd curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"tag\": \"${TAG}\", \"image\": \"${IMAGE}:${TAG}\"}" \
    "$COOLIFY_WEBHOOK" 2>&1)" || true

  local http_code
  http_code="$(echo "$response" | tail -1)"
  local body
  body="$(echo "$response" | sed '$d')"

  if [[ "$http_code" == "200" ]] || [[ "$http_code" == "201" ]] || [[ "$http_code" == "204" ]]; then
    ok "Coolify webhook triggered successfully"
    log "Response: ${body}"
    return 0
  else
    warn "Coolify webhook returned HTTP ${http_code}"
    log "Response: ${body}"
    return 1
  fi
}

# ---- Deploy via SSH ----
deploy_ssh() {
  section "Deploying via SSH"

  if [[ -z "$SSH_HOST" ]]; then
    error "STAGING_SSH_HOST not set — cannot deploy via SSH"
    return 1
  fi

  local full_image="${IMAGE}:${TAG}"
  log "Host: ${SSH_USER}@${SSH_HOST}"
  log "Path: ${SSH_PATH}"

  # Generate deployment script
  local deploy_script
  deploy_script=$(cat << 'DEPLOY_EOF'
#!/bin/bash
set -euo pipefail
cd "{{SSH_PATH}}"
echo "==> Pulling image {{IMAGE}}:{{TAG}}..."
docker pull "{{IMAGE}}:{{TAG}}"
echo "==> Stopping current container..."
docker stop azeebo-staging 2>/dev/null || true
docker rm azeebo-staging 2>/dev/null || true
echo "==> Starting new container..."
docker run -d \
  --name azeebo-staging \
  --restart unless-stopped \
  -p 3013:3013 \
  -p 4000:4000 \
  -e NODE_ENV=staging \
  "{{IMAGE}}:{{TAG}}"
echo "==> Waiting for health check..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3013/health >/dev/null 2>&1; then
    echo "==> Container healthy!"
    exit 0
  fi
  sleep 2
done
echo "==> Health check timed out"
exit 1
DEPLOY_EOF
  )

  # Substitute variables
  deploy_script="${deploy_script//\{\{SSH_PATH\}\}/$SSH_PATH}"
  deploy_script="${deploy_script//\{\{IMAGE\}\}/$IMAGE}"
  deploy_script="${deploy_script//\{\{TAG\}\}/$TAG}"

  log "Executing remote deployment..."
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[dry-run] Would SSH to ${SSH_HOST} and run deployment"
    return 0
  fi

  echo "$deploy_script" | ssh "${SSH_USER}@${SSH_HOST}" 'bash -s'
  ok "SSH deployment complete"
}

# ---- Health Check ----
run_health_checks() {
  section "Running Health Checks"

  local endpoints=(
    "3013:API Gateway:/health"
    "4000:Web App:/"
  )

  local failed=0
  local waited=0

  while (( waited < HEALTH_TIMEOUT )); do
    failed=0

    for entry in "${endpoints[@]}"; do
      IFS=':' read -r port name path <<< "$entry"
      local url="https://${APP_HOST}:${port}${path}"

      if curl -sf --max-time 10 "$url" >/dev/null 2>&1; then
        ok "  ${name}: healthy (port ${port})"
      else
        failed=$((failed + 1))
      fi
    done

    if (( failed == 0 )); then
      ok "All health checks passed"
      return 0
    fi

    log "  Waiting for services to start (${waited}s/${HEALTH_TIMEOUT}s)..."
    sleep "$HEALTH_INTERVAL"
    waited=$((waited + HEALTH_INTERVAL))
  done

  error "Health checks failed after ${HEALTH_TIMEOUT}s"
  return 1
}

# ---- Main ----
main() {
  section "Azeebo+ Staging Deployment"
  log "Image:  ${IMAGE}:${TAG}"
  log "Dry-run: ${DRY_RUN}"

  check_prerequisites

  if [[ "$SKIP_BUILD" != "true" ]]; then
    build_image
  fi

  if [[ "$SKIP_PUSH" != "true" ]]; then
    push_image
  fi

  # Try Coolify first, fall back to SSH
  if ! deploy_coolify; then
    if [[ -n "$SSH_HOST" ]]; then
      warn "Falling back to SSH deploy..."
      deploy_ssh
    else
      error "No deployment method available (set COOLIFY_STAGING_WEBHOOK or STAGING_SSH_HOST)"
      exit 1
    fi
  fi

  if [[ "$SKIP_HEALTH" != "true" ]]; then
    run_health_checks
  fi

  section "Deployment Complete"
  ok "Staging deployment of ${IMAGE}:${TAG} succeeded"
}

main
