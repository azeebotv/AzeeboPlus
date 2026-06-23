#!/bin/bash
set -euo pipefail

# ============================================================
# Azeebo+ Production Docker Deployment Script
# ============================================================
# Usage:
#   ./scripts/deploy-prod.sh [command] [profile]
#
# Commands:
#   build       Build all production images
#   start       Start services (default: all)
#   stop        Stop all services
#   restart     Restart all services
#   status      Show service status and health
#   logs        Tail logs for a service (use --service <name>)
#   smoke       Run smoke tests
#   clean       Remove containers, networks, and volumes
#   validate    Validate .env.production has no placeholder values
#
# Profiles: all (default), core, engagement, intelligence, universes, operations, gateway, frontend
# ============================================================

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
DEFAULT_PROFILE="all"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Prerequisite checks ----
check_prereqs() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose V2 is not available."
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file '$COMPOSE_FILE' not found."
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file '$ENV_FILE' not found."
        exit 1
    fi
}

# ---- Validate env file for placeholder values ----
validate_env() {
    log_info "Validating $ENV_FILE..."
    local placeholders
    placeholders=$(grep -n "REPLACE_WITH" "$ENV_FILE" || true)
    if [ -n "$placeholders" ]; then
        log_error "The following lines still contain placeholder values:"
        echo "$placeholders"
        echo ""
        log_error "Replace all REPLACE_WITH_* values in $ENV_FILE before deploying."
        exit 1
    fi
    log_ok "Environment file validated - no placeholder values found."
}

# ---- Build ----
build() {
    local profile="${1:-$DEFAULT_PROFILE}"
    log_info "Building production images with profile: $profile"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$profile" build --parallel
    log_ok "Build complete."
}

# ---- Start ----
start() {
    local profile="${1:-$DEFAULT_PROFILE}"
    log_info "Starting production services with profile: $profile"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$profile" up -d
    log_ok "Services started. Use '$0 status' to check health."
}

# ---- Stop ----
stop() {
    log_info "Stopping all production services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$DEFAULT_PROFILE" down
    log_ok "All services stopped."
}

# ---- Restart ----
restart() {
    local profile="${1:-$DEFAULT_PROFILE}"
    log_info "Restarting production services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$profile" restart
    log_ok "Services restarted."
}

# ---- Status ----
status() {
    log_info "Production service status:"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$DEFAULT_PROFILE" ps
}

# ---- Logs ----
logs() {
    local service=""
    local profile="$DEFAULT_PROFILE"
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service) service="$2"; shift 2 ;;
            --profile) profile="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$profile" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$profile" logs -f --tail=100
    fi
}

# ---- Smoke tests ----
smoke() {
    log_info "Running production smoke tests..."
    local base_url="${1:-http://localhost:4000}"
    bash ./scripts/docker-smoke-tests.sh "$base_url"
}

# ---- Clean ----
clean() {
    log_warn "This will remove all production containers, networks, and volumes."
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile "$DEFAULT_PROFILE" down -v --remove-orphans
        log_ok "Production environment cleaned."
    else
        log_info "Cancelled."
    fi
}

# ---- Main ----
main() {
    local command="${1:-help}"
    local profile="${2:-$DEFAULT_PROFILE}"

    check_prereqs

    case "$command" in
        build)
            validate_env
            build "$profile"
            ;;
        start)
            validate_env
            start "$profile"
            ;;
        stop)
            stop
            ;;
        restart)
            restart "$profile"
            ;;
        status)
            status
            ;;
        logs)
            shift  # remove 'logs' from args
            logs "$@"
            ;;
        smoke)
            smoke "${2:-http://localhost:4000}"
            ;;
        clean)
            clean
            ;;
        validate)
            validate_env
            ;;
        help|*)
            echo "Azeebo+ Production Deployment"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  build [profile]          Build production images"
            echo "  start [profile]          Start services"
            echo "  stop                     Stop all services"
            echo "  restart [profile]        Restart services"
            echo "  status                   Show service status"
            echo "  logs [--service <name>]  Tail service logs"
            echo "  smoke [base_url]         Run smoke tests"
            echo "  clean                    Remove everything"
            echo "  validate                 Check .env.production for placeholders"
            echo ""
            echo "Profiles: all, core, engagement, intelligence, universes, operations, gateway, frontend"
            echo ""
            echo "Full deployment workflow:"
            echo "  1. Edit .env.production with real values"
            echo "  2. $0 validate"
            echo "  3. $0 build"
            echo "  4. $0 start"
            echo "  5. $0 status"
            echo "  6. $0 smoke"
            ;;
    esac
}

main "$@"
