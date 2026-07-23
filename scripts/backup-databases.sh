#!/usr/bin/env bash
# ============================================================
# Azeebo+ Database Backup Script
# ============================================================
# Backs up all 26 databases using pg_dump, compresses with gzip,
# and stores in /opt/azeebo/backups/ with timestamp.
# Retains last 7 days of backups.
# Sends Slack notification on success/failure.
#
# Usage: ./backup-databases.sh [environment]
# Example: ./backup-databases.sh staging
# ============================================================

set -euo pipefail

# ---- Configuration ----
ENVIRONMENT="${1:-staging}"
BACKUP_DIR="/opt/azeebo/backups/${ENVIRONMENT}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Slack webhook URL (set via environment or secrets manager)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Database connection settings
DB_HOST="${DB_HOST:-db-staging.internal}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-azeebo_staging}"

# ---- Database List (26 databases) ----
DATABASES=(
    "azeebo_auth"
    "azeebo_user"
    "azeebo_wallet"
    "azeebo_payment"
    "azeebo_content"
    "azeebo_media"
    "azeebo_search"
    "azeebo_notification"
    "azeebo_reward"
    "azeebo_analytics"
    "azeebo_recommendation"
    "azeebo_reality"
    "azeebo_movie"
    "azeebo_games"
    "azeebo_comedy"
    "azeebo_sports"
    "azeebo_lifestyle"
    "azeebo_vertical"
    "azeebo_creator"
    "azeebo_support"
    "azeebo_moderation"
    "azeebo_queue"
    "azeebo_engagement"
    "azeebo_messaging"
    "azeebo_referral"
    "azeebo_subscription"
    "azeebo_admin"
)

# ---- Functions ----

log() {
    local message="$1"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] ${message}" | tee -a "${LOG_FILE}"
}

send_slack_notification() {
    local status="$1"
    local message="$2"
    local color="$3"
    
    if [[ -z "${SLACK_WEBHOOK_URL}" ]]; then
        log "WARNING: SLACK_WEBHOOK_URL not set, skipping Slack notification"
        return 0
    fi
    
    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "${color}",
            "title": "Azeebo+ Database Backup - ${ENVIRONMENT}",
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
                    "title": "Timestamp",
                    "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
                    "short": true
                },
                {
                    "title": "Databases Backed Up",
                    "value": "${#DATABASES[@]}",
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
    
    if curl -s -X POST -H 'Content-type: application/json' --data "${payload}" "${SLACK_WEBHOOK_URL}" >/dev/null 2>&1; then
        log "Slack notification sent successfully"
    else
        log "ERROR: Failed to send Slack notification"
    fi
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump &>/dev/null; then
        log "ERROR: pg_dump is not installed or not in PATH"
        send_slack_notification "FAILED" "pg_dump is not available on this system" "#ff0000"
        exit 1
    fi
    
    # Check if gzip is available
    if ! command -v gzip &>/dev/null; then
        log "ERROR: gzip is not installed or not in PATH"
        send_slack_notification "FAILED" "gzip is not available on this system" "#ff0000"
        exit 1
    fi
    
    # Check if database connection is possible
    if ! PGPASSWORD="${DB_PASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "SELECT 1;" &>/dev/null; then
        log "WARNING: Cannot connect to database server at ${DB_HOST}:${DB_PORT}"
        log "Will attempt backup anyway..."
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"
    
    log "Prerequisites check passed"
}

backup_database() {
    local db_name="$1"
    local backup_file="${BACKUP_DIR}/${db_name}_${TIMESTAMP}.sql.gz"
    
    log "Backing up database: ${db_name}"
    
    # Run pg_dump and compress with gzip
    if PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${db_name}" \
        -F p \
        --no-owner \
        --no-privileges \
        --verbose 2>>"${LOG_FILE}" | gzip > "${backup_file}"; then
        
        local file_size
        file_size=$(du -h "${backup_file}" | cut -f1)
        log "SUCCESS: ${db_name} backed up to ${backup_file} (${file_size})"
        return 0
    else
        log "ERROR: Failed to backup database ${db_name}"
        return 1
    fi
}

cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "${file}"
        deleted_count=$((deleted_count + 1))
    done < <(find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
    
    # Also clean up old log files
    while IFS= read -r -d '' file; do
        rm -f "${file}"
    done < <(find "${BACKUP_DIR}" -name "*.log" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
    
    log "Cleaned up ${deleted_count} old backup files"
}

verify_backup_integrity() {
    local backup_file="$1"
    local db_name="$2"
    
    # Check if file exists and has content
    if [[ ! -f "${backup_file}" ]] || [[ ! -s "${backup_file}" ]]; then
        log "ERROR: Backup file for ${db_name} is missing or empty"
        return 1
    fi
    
    # Check if gzip file is valid
    if ! gzip -t "${backup_file}" 2>/dev/null; then
        log "ERROR: Backup file for ${db_name} is corrupted"
        return 1
    fi
    
    return 0
}

# ---- Main Execution ----

main() {
    log "=================================================="
    log "Starting Azeebo+ database backup for ${ENVIRONMENT}"
    log "=================================================="
    
    # Check prerequisites
    check_prerequisites
    
    # Track backup results
    local total_databases=${#DATABASES[@]}
    local successful_backups=0
    local failed_backups=0
    local failed_databases=()
    
    # Backup each database
    for db in "${DATABASES[@]}"; do
        db_name="${ENVIRONMENT}_${db}"
        
        if backup_database "${db_name}"; then
            successful_backups=$((successful_backups + 1))
            
            # Verify backup integrity
            backup_file="${BACKUP_DIR}/${db_name}_${TIMESTAMP}.sql.gz"
            if verify_backup_integrity "${backup_file}" "${db_name}"; then
                log "Integrity check passed for ${db_name}"
            else
                log "WARNING: Integrity check failed for ${db_name}"
            fi
        else
            failed_backups=$((failed_backups + 1))
            failed_databases+=("${db_name}")
        fi
    done
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate summary
    log "=================================================="
    log "Backup Summary:"
    log "  Total databases: ${total_databases}"
    log "  Successful: ${successful_backups}"
    log "  Failed: ${failed_backups}"
    log "  Backup directory: ${BACKUP_DIR}"
    log "=================================================="
    
    # Send Slack notification
    if [[ ${failed_backups} -eq 0 ]]; then
        local success_message="All ${total_databases} databases backed up successfully."
        success_message+="\nBackup location: ${BACKUP_DIR}"
        success_message+="\nRetention policy: ${RETENTION_DAYS} days"
        send_slack_notification "SUCCESS" "${success_message}" "#36a64f"
    else
        local failure_message="Backup completed with ${failed_backups} failures out of ${total_databases} databases."
        failure_message+="\nFailed databases: ${failed_databases[*]}"
        failure_message+="\nCheck log file: ${LOG_FILE}"
        send_slack_notification "PARTIAL FAILURE" "${failure_message}" "#ff9900"
    fi
    
    # Exit with error if any backups failed
    if [[ ${failed_backups} -gt 0 ]]; then
        exit 1
    fi
    
    exit 0
}

# Run main function
main "$@"
