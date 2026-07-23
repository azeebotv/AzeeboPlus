#!/usr/bin/env bash
# ============================================================
# Azeebo+ — Build All Libraries, Services, and Apps
# ============================================================
# Builds everything with per-component success/failure reporting.
# Order: T0 shared packages → backend services → frontend apps.
#
# Usage:
#   ./scripts/build-all.sh [options]
#
# Options:
#   --t0-only        Build only T0 shared packages
#   --services-only  Build only backend services
#   --apps-only      Build only frontend apps
#   --no-prisma      Skip prisma generate for services
#   --dry-run        Show what would be built
# ============================================================
set -euo pipefail

# ---- Script Metadata ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ---- Colors ----
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; DIM=''; RESET=''
fi

log()   { printf "%s${CYAN}[INFO]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
ok()    { printf "%s${GREEN}[  OK]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
warn()  { printf "%s${YELLOW}[WARN]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*"; }
error() { printf "%s${RED}[FAIL]${RESET}  %s\n" "$(date '+%H:%M:%S')" "$*" >&2; }
section() { echo ""; printf "%s${BOLD}── %s ──%s\n" "$CYAN" "$1" "$RESET"; }

# ---- Options ----
BUILD_T0=true
BUILD_SERVICES=true
BUILD_APPS=true
SKIP_PRISMA=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --t0-only)       BUILD_SERVICES=false; BUILD_APPS=false ;;
    --services-only) BUILD_T0=false; BUILD_APPS=false ;;
    --apps-only)     BUILD_T0=false; BUILD_SERVICES=false ;;
    --no-prisma)     SKIP_PRISMA=true ;;
    --dry-run)       DRY_RUN=true ;;
    -h|--help)
      head -20 "$0" | tail -15
      exit 0
      ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# ---- T0 Shared Packages ----
# Must be built first — all services depend on these type declarations.
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

# ---- Backend Services ----
# Format: "package_name|relative_dir|has_prisma"
SERVICES=(
  # Core
  "@azeebo/auth-service|services/core/auth-service|true"
  "@azeebo/user-service|services/core/user-service|true"
  "@azeebo/wallet-service|services/core/wallet-service|true"
  "@azeebo/payment-service|services/core/payment-service|true"
  "@azeebo/content-service|services/core/content-service|true"
  "@azeebo/search-service|services/core/search-service|true"
  "@azeebo/media-service|services/core/media-service|false"
  # Engagement
  "@azeebo/notification-service|services/engagement/notification-service|true"
  "@azeebo/reward-service|services/engagement/reward-service|true"
  "@azeebo/engagement-service|services/engagement/engagement-service|true"
  "@azeebo/messaging-service|services/engagement/messaging-service|true"
  "@azeebo/referral-service|services/engagement/referral-service|true"
  "@azeebo/subscription-service|services/engagement/subscription-service|true"
  # Intelligence
  "@azeebo/analytics-service|services/intelligence/analytics-service|true"
  "@azeebo/recommendation-service|services/intelligence/recommendation-service|true"
  # Universes
  "@azeebo/reality-service|services/universes/reality-service|true"
  "@azeebo/movie-service|services/universes/movie-service|true"
  "@azeebo/comedy-service|services/universes/comedy-service|true"
  "@azeebo/games-service|services/universes/games-service|true"
  "@azeebo/sports-service|services/universes/sports-service|true"
  "@azeebo/lifestyle-service|services/universes/lifestyle-service|true"
  "@azeebo/vertical-service|services/universes/vertical-service|true"
  "@azeebo/creator-service|services/universes/creator-service|true"
  # Operations
  "@azeebo/queue-service|services/operations/queue-service|true"
  "@azeebo/support-service|services/operations/support-service|true"
  "@azeebo/moderation-service|services/operations/moderation-service|true"
  # Gateway
  "@azeebo/api-gateway|services/gateway/api-gateway|true"
)

# ---- Frontend Apps ----
APPS=(
  "@azeebo/admin|apps/admin|build:client"
  "@azeebo/creator|apps/creator|build:client"
  "@azeebo/web|apps/web|build"
)

# ---- Counters ----
PASSED=0
FAILED=0
SKIPPED=0

build_t0() {
  section "Building T0 Shared Packages"
  local count=0

  for pkg in "${T0_PACKAGES[@]}"; do
    count=$((count + 1))
    local pkg_dir="$ROOT_DIR/packages/$pkg"

    if [[ ! -f "$pkg_dir/package.json" ]]; then
      warn "  [$count/${#T0_PACKAGES[@]}] $pkg: not found — skipping"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    # shared-services needs prisma generate first
    if [[ "$pkg" == "shared-services" ]] && [[ "$SKIP_PRISMA" != "true" ]]; then
      if [[ -f "$pkg_dir/prisma/schema.prisma" ]]; then
        log "  [$count/${#T0_PACKAGES[@]}] $pkg: generating prisma..."
        (cd "$pkg_dir" && pnpm run prisma:generate 2>&1) >/dev/null 2>&1 || true
      fi
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      log "  [$count/${#T0_PACKAGES[@]}] $pkg: [dry-run] would build"
      continue
    fi

    log "  [$count/${#T0_PACKAGES[@]}] $pkg: building..."
    local build_output
    if build_output="$(cd "$pkg_dir" && pnpm run build 2>&1)"; then
      ok "  [$count/${#T0_PACKAGES[@]}] $pkg: built"
      PASSED=$((PASSED + 1))
    else
      error "  [$count/${#T0_PACKAGES[@]}] $pkg: FAILED"
      error "    $build_output" | tail -3
      FAILED=$((FAILED + 1))
    fi
  done
}

build_services() {
  section "Building Backend Services"
  local count=0

  for entry in "${SERVICES[@]}"; do
    count=$((count + 1))
    IFS='|' read -r pkg dir has_prisma <<< "$entry"
    local service_dir="$ROOT_DIR/$dir"

    if [[ ! -f "$service_dir/package.json" ]]; then
      warn "  [$count/${#SERVICES[@]}] $pkg: not found — skipping"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      log "  [$count/${#SERVICES[@]}] $pkg: [dry-run] would build"
      continue
    fi

    # Prisma generate
    if [[ "$has_prisma" == "true" ]] && [[ "$SKIP_PRISMA" != "true" ]]; then
      if [[ -f "$service_dir/prisma/schema.prisma" ]]; then
        log "  [$count/${#SERVICES[@]}] $pkg: generating prisma..."
        local prisma_out
        if ! prisma_out="$(cd "$service_dir" && pnpm run prisma:generate 2>&1)"; then
          error "  [$count/${#SERVICES[@]}] $pkg: prisma:generate FAILED"
          error "    $prisma_out" | tail -3
          FAILED=$((FAILED + 1))
          continue
        fi
        bash "$ROOT_DIR/scripts/patch-prisma-client.sh" 2>/dev/null || true
      fi
    fi

    # Build
    log "  [$count/${#SERVICES[@]}] $pkg: building..."
    local build_output
    if build_output="$(cd "$service_dir" && pnpm run build 2>&1)"; then
      ok "  [$count/${#SERVICES[@]}] $pkg: built"
      PASSED=$((PASSED + 1))
    else
      error "  [$count/${#SERVICES[@]}] $pkg: FAILED"
      echo "$build_output" | tail -5 | sed 's/^/    /' >&2
      FAILED=$((FAILED + 1))
    fi
  done
}

build_apps() {
  section "Building Frontend Apps"
  local count=0

  for entry in "${APPS[@]}"; do
    count=$((count + 1))
    IFS='|' read -r pkg dir script <<< "$entry"
    local app_dir="$ROOT_DIR/$dir"

    if [[ ! -f "$app_dir/package.json" ]]; then
      warn "  [$count/${#APPS[@]}] $pkg: not found — skipping"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      log "  [$count/${#APPS[@]}] $pkg: [dry-run] would build"
      continue
    fi

    log "  [$count/${#APPS[@]}] $pkg: building (${script})..."
    local build_output
    if build_output="$(cd "$app_dir" && pnpm run "$script" 2>&1)"; then
      ok "  [$count/${#APPS[@]}] $pkg: built"
      PASSED=$((PASSED + 1))
    else
      error "  [$count/${#APPS[@]}] $pkg: FAILED"
      echo "$build_output" | tail -5 | sed 's/^/    /' >&2
      FAILED=$((FAILED + 1))
    fi
  done
}

# ---- Main ----
main() {
  log "Azeebo+ Build (dry-run: ${DRY_RUN})"
  log "T0: ${BUILD_T0} | Services: ${BUILD_SERVICES} | Apps: ${BUILD_APPS}"

  [[ "$BUILD_T0" == "true" ]]       && build_t0
  [[ "$BUILD_SERVICES" == "true" ]] && build_services
  [[ "$BUILD_APPS" == "true" ]]     && build_apps

  # Summary
  section "Build Summary"
  printf "  ${GREEN}Passed:${RESET}   %d\n" "$PASSED"
  printf "  ${RED}Failed:${RESET}   %d\n" "$FAILED"
  printf "  ${YELLOW}Skipped:${RESET}  %d\n" "$SKIPPED"
  printf "  Total:    %d\n" "$(( PASSED + FAILED + SKIPPED ))"

  if (( FAILED > 0 )); then
    error "Build completed with ${FAILED} failure(s)"
    exit 1
  fi

  ok "Build completed successfully"
}

main
