#!/usr/bin/env bash
# ============================================================
# Azeebo+ Rollback Script
# ============================================================
# Rolls back the Azeebo+ platform to a previous Docker image tag.
# Stops current container, starts previous version, runs health checks,
# and rolls back database if needed.
#
# Usage: ./rollback.sh <previous-tag>
# Example: ./rollback.sh v1.2.3
# ============================================================

set -euo pipefail

# ---- Configuration ----
PREVIOUS_TAG="${1:-}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.${ENVIRONMENT}.yml}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-2}"
ROLLBACK_LOG="/var/log/azeebo/rollback_$(date +%Y%m%d_%H%M%S).log"

# Service definitions
SERVICES=(
    "azeebo-gateway"
    "azeebo-auth-service"
    "azeebo-user-service"
    "azeebo-wallet-service"
    "azeebo-payment-service"
    "azeebo-content-service"
    "azeebo-media-service"
    "azeebo-search-service"
    "azeebo-notification-service"
    "azeebo-reward-service"
    "azeebo-analytics-service"
    "azeebo-recommendation-service"
    "azeebo-reality-service"
    "azeebo-movie-service"
    "azeebo-games-service"
    "azeebo-comedy-service"
    "azeebo-sports-service"
    "azeebo-lifestyle-service"
    "azeebo-vertical-service"
    "azeebo-creator-service"
    "azeebo-support-service"
    "azeebo-moderation-service"
    "azeebo-queue-service"
    "azeebo-engagement-service"
    "azeebo-messaging-service"
    "azeebo-referral-service"
    "azeebo-subscription-service"
    "azeebo-admin-service"
)

# ---- Functions ----

log() {
    local message="$1"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] ${message}" | tee -a "${ROLLBACK_LOG}"
}

send_slack_notification() {
    local status="$1"
    local message="$2"
    local color="$3"
    
    if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
        log "WARNING: SLACK_WEBHOOK_URL not set, skipping Slack notification"
        return 0
    fi
    
    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "${color}",
            "title": "Azeebo+ Rollback - ${ENVIRONMENT}",
            "text": "${message}",
            "fields": [
                {
                    "title": "Status",
                    "value": "${status}",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "${ENVIRONMENT}",
                    "short": true
                },
                {
                    "title": "Previous Tag",
                    "value": "${PREVIOUS_TAG}",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
                    "short": true
                }
            ],
            "footer": "Azeebo+ DevOps",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -s -X POST -H 'Content-type: application/json' --data "${payload}" "${SLACK_WEBHOOK_URL}" >/dev/null 2>&1 || \
        log "WARNING: Failed to send Slack notification"
}

validate_tag() {
    local tag="$1"
    
    if [[ -z "${tag}" ]]; then
        log "ERROR: No tag provided"
        echo "Usage: $0 <previous-tag>"
        echo "Example: $0 v1.2.3"
        exit 1
    fi
    
    # Check if tag format is valid
    if ! [[ "${tag}" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
        log "WARNING: Tag format '${tag}' does not follow semantic versioning"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    log "Validated tag: ${tag}"
}

get_current_tag() {
    local service="$1"
    local container_name="${service}-${ENVIRONMENT}"
    
    # Try to get the current image tag from the container
    local current_image
    current_image=$(docker inspect --format='{{.Config.Image}}' "${container_name}" 2>/dev/null || echo "unknown")
    
    # Extract tag from image
    if [[ "${current_image}" == *":"* ]]; then
        echo "${current_image##*:}"
    else
        echo "latest"
    fi
}

stop_current_containers() {
    log "Stopping current containers..."
    
    local stopped_count=0
    
    for service in "${SERVICES[@]}"; do
        local container_name="${service}-${ENVIRONMENT}"
        
        if docker ps -q -f "name=${container_name}" | grep -q .; then
            log "Stopping ${container_name}..."
            if docker stop "${container_name}" 2>/dev/null; then
                stopped_count=$((stopped_count + 1))
                log "Stopped ${container_name}"
            else
                log "WARNING: Failed to stop ${container_name}"
            fi
        fi
    done
    
    log "Stopped ${stopped_count} containers"
    return 0
}

pull_previous_image() {
    local service="$1"
    local tag="$2"
    
    local registry="${DOCKER_REGISTRY:-registry.azeebo.ng}"
    local image_prefix="${DOCKER_IMAGE_PREFIX:-azeebo}"
    local image_name="${registry}/${image_prefix}/${service}:${tag}"
    
    log "Pulling image: ${image_name}"
    
    if docker pull "${image_name}" 2>>"${ROLLBACK_LOG}"; then
        log "Successfully pulled ${image_name}"
        return 0
    else
        log "ERROR: Failed to pull ${image_name}"
        return 1
    fi
}

start_previous_version() {
    log "Starting containers with tag: ${PREVIOUS_TAG}"
    
    # Update image tags in compose file
    local compose_file="${COMPOSE_FILE}"
    
    if [[ ! -f "${compose_file}" ]]; then
        log "ERROR: Compose file not found: ${compose_file}"
        return 1
    fi
    
    # Create backup of current compose file
    cp "${compose_file}" "${compose_file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update image tags in compose file
    for service in "${SERVICES[@]}"; do
        local image_pattern="${service}:.*"
        local replacement="${service}:${PREVIOUS_TAG}"
        
        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' "s|${image_pattern}|${replacement}|g" "${compose_file}"
        else
            sed -i "s|${image_pattern}|${replacement}|g" "${compose_file}"
        fi
    done
    
    # Start containers
    if docker-compose -f "${compose_file}" up -d; then
        log "Containers started successfully"
        return 0
    else
        log "ERROR: Failed to start containers"
        return 1
    fi
}

run_health_checks() {
    log "Running health checks..."
    
    local healthy_services=0
    local unhealthy_services=()
    
    for service in "${SERVICES[@]}"; do
        local container_name="${service}-${ENVIRONMENT}"
        local health_url="${HEALTH_CHECK_URL}"
        
        # Adjust health check URL for gateway
        if [[ "${service}" == "azeebo-gateway" ]]; then
            health_url="http://localhost:3000/health"
        else
            # For internal services, check container health
            local container_id
            container_id=$(docker ps -q -f "name=${container_name}" 2>/dev/null | head -1)
            
            if [[ -n "${container_id}" ]]; then
                # Check if container is running
                local status
                status=$(docker inspect --format='{{.State.Status}}' "${container_id}" 2>/dev/null)
                
                if [[ "${status}" == "running" ]]; then
                    healthy_services=$((healthy_services + 1))
                    log "HEALTHY: ${container_name}"
                    continue
                fi
            fi
            
            unhealthy_services+=("${container_name}")
            log "UNHEALTHY: ${container_name} (not running)"
            continue
        fi
        
        # HTTP health check for gateway
        local retries=0
        local healthy=false
        
        while [[ ${retries} -lt ${HEALTH_CHECK_RETRIES} ]]; do
            if curl -sf "${health_url}" >/dev/null 2>&1; then
                healthy=true
                break
            fi
            
            retries=$((retries + 1))
            sleep "${HEALTH_CHECK_INTERVAL}"
        done
        
        if [[ "${healthy}" == "true" ]]; then
            healthy_services=$((healthy_services + 1))
            log "HEALTHY: ${service}"
        else
            unhealthy_services+=("${service}")
            log "UNHEALTHY: ${service}"
        fi
    done
    
    log "Health check summary: ${healthy_services}/${#SERVICES[@]} services healthy"
    
    if [[ ${#unhealthy_services[@]} -gt 0 ]]; then
        log "Unhealthy services: ${unhealthy_services[*]}"
        return 1
    fi
    
    return 0
}

rollback_database() {
    local service="$1"
    local db_name="${ENVIRONMENT}_${service}"
    
    log "Checking database rollback for: ${service}"
    
    # Check if database backup exists for this tag
    local backup_dir="/opt/azeebo/backups/${ENVIRONMENT}"
    local backup_file="${backup_dir}/${db_name}_${PREVIOUS_TAG}.sql.gz"
    
    if [[ ! -f "${backup_file}" ]]; then
        log "No database backup found for ${db_name} at tag ${PREVIOUS_TAG}"
        log "Skipping database rollback for ${service}"
        return 0
    fi
    
    read -p "Rollback database for ${service}? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Rolling back database: ${db_name}"
        
        # Restore database from backup
        if gunzip -c "${backup_file}" | PGPASSWORD="${DB_PASSWORD:-}" psql \
            -h "${DB_HOST:-db-staging.internal}" \
            -p "${DB_PORT:-5432}" \
            -U "${DB_USER:-azeebo_staging}" \
            -d "${db_name}" \
            -q 2>>"${ROLLBACK_LOG}"; then
            
            log "Database ${db_name} rolled back successfully"
            return 0
        else
            log "ERROR: Failed to rollback database ${db_name}"
            return 1
        fi
    else
        log "Skipping database rollback for ${service}"
        return 0
    fi
}

cleanup() {
    log "Cleaning up..."
    
    # Remove temporary compose file backups older than 7 days
    find . -name "*.backup.*" -mtime +7 -delete 2>/dev/null || true
    
    log "Cleanup complete"
}

# ---- Main Execution ----

main() {
    log "=================================================="
    log "Starting Azeebo+ rollback to tag: ${PREVIOUS_TAG}"
    log "Environment: ${ENVIRONMENT}"
    log "=================================================="
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "${ROLLBACK_LOG}")"
    
    # Validate tag
    validate_tag "${PREVIOUS_TAG}"
    
    # Get current tag for comparison
    local current_tag
    current_tag=$(get_current_tag "azeebo-gateway")
    log "Current tag: ${current_tag}"
    log "Target tag: ${PREVIOUS_TAG}"
    
    if [[ "${current_tag}" == "${PREVIOUS_TAG}" ]]; then
        log "WARNING: Current tag is same as target tag"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Stop current containers
    stop_current_containers
    
    # Pull previous images
    log "Pulling previous images..."
    local pull_failed=0
    for service in "${SERVICES[@]}"; do
        if ! pull_previous_image "${service}" "${PREVIOUS_TAG}"; then
            pull_failed=$((pull_failed + 1))
        fi
    done
    
    if [[ ${pull_failed} -gt 0 ]]; then
        log "ERROR: Failed to pull ${pull_failed} images"
        send_slack_notification "FAILED" "Failed to pull ${pull_failed} images for rollback" "#ff0000"
        exit 1
    fi
    
    # Start previous version
    if ! start_previous_version; then
        log "ERROR: Failed to start containers"
        send_slack_notification "FAILED" "Failed to start containers for rollback" "#ff0000"
        exit 1
    fi
    
    # Run health checks
    if ! run_health_checks; then
        log "WARNING: Some services failed health checks"
        send_slack_notification "PARTIAL FAILURE" "Rollback completed but some services are unhealthy" "#ff9900"
    else
        log "All services are healthy"
    fi
    
    # Ask about database rollback
    log ""
    log "Database Rollback Options:"
    log "  Some services may require database rollback"
    log "  This should only be done if the new version made breaking schema changes"
    log ""
    
    read -p "Check for database rollbacks? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for service in "${SERVICES[@]}"; do
            rollback_database "${service}"
        done
    fi
    
    # Cleanup
    cleanup
    
    # Send success notification
    send_slack_notification "SUCCESS" "Rollback to ${PREVIOUS_TAG} completed successfully" "#36a64f"
    
    log "=================================================="
    log "Rollback completed successfully"
    log "Rolled back to tag: ${PREVIOUS_TAG}"
    log "Log file: ${ROLLBACK_LOG}"
    log "=================================================="
    
    exit 0
}

# Run main function
main "$@"
