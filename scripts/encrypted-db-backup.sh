#!/bin/bash
set -euo pipefail

# Encrypted Database Backup Script for Azeebo+
# Dumps all service databases, encrypts with GPG, uploads to S3, enforces retention.
#
# Required environment variables:
#   DB_HOST                    - PostgreSQL host
#   DB_PORT                    - PostgreSQL port
#   DB_USER                    - PostgreSQL user with dump privileges
#   DB_PASSWORD                - PostgreSQL password
#   DB_BACKUP_ENCRYPTION_KEY   - GPG passphrase for encryption
#   S3_BACKUP_BUCKET           - S3 bucket name for backups
#   S3_REGION                  - AWS region for S3
#
# Optional environment variables:
#   DB_NAME                    - Single database name (if set, only backs up this DB)
#   BACKUP_DIR                 - Local temp directory (default: /tmp/backups)
#   BACKUP_RETENTION_DAYS      - Days to keep backups (default: 30)
#   SLACK_WEBHOOK_URL          - Slack webhook for notifications

DB_HOST="${DB_HOST:?DB_HOST is required}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
DB_BACKUP_ENCRYPTION_KEY="${DB_BACKUP_ENCRYPTION_KEY:?DB_BACKUP_ENCRYPTION_KEY is required}"
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:?S3_BACKUP_BUCKET is required}"
S3_REGION="${S3_REGION:-us-east-1}"

BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_NAME="${DB_NAME:-}"

# All Azeebo+ service databases
ALL_DATABASES=(
  azeebo_auth
  azeebo_user
  azeebo_wallet
  azeebo_payment
  azeebo_content
  azeebo_search
  azeebo_media
  azeebo_notification
  azeebo_reward
  azeebo_analytics
  azeebo_recommendation
  azeebo_reality
  azeebo_movie
  azeebo_comedy
  azeebo_games
  azeebo_sports
  azeebo_lifestyle
  azeebo_vertical
  azeebo_creator
  azeebo_moderation
  azeebo_queue
  azeebo_support
  azeebo_messaging
  azeebo_engagement
  azeebo_referral
  azeebo_subscription
  azeebo_admin
  azeebo_creator
)

TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_LOG="${BACKUP_DIR}/backup-${TIMESTAMP}.log"
ERRORS=0
SUCCESS=0

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" | tee -a "${BACKUP_LOG}"
}

send_slack() {
  local message="$1"
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -sf -X POST "${SLACK_WEBHOOK_URL}" \
      -H 'Content-type: application/json' \
      --data "{\"text\": \"${message}\"}" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  rm -f "${BACKUP_DIR}"/*."${TIMESTAMP}".dump 2>/dev/null || true
}
trap cleanup EXIT

log "=== Azeebo+ Database Backup Started ==="
log "Host: ${DB_HOST}:${DB_PORT}"
log "Retention: ${BACKUP_RETENTION_DAYS} days"
log "S3 Bucket: ${S3_BACKUP_BUCKET}"

mkdir -p "${BACKUP_DIR}"

export PGPASSWORD="${DB_PASSWORD}"

# Determine which databases to back up
if [ -n "${DB_NAME}" ]; then
  DATABASES=("${DB_NAME}")
else
  DATABASES=("${ALL_DATABASES[@]}")
fi

log "Databases to back up: ${#DATABASES[@]}"

# Dump and encrypt each database
for db in "${DATABASES[@]}"; do
  log "Processing ${db}..."

  # Check if database exists
  if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt 2>/dev/null | grep -q "${db}"; then
    log "  WARNING: Database ${db} not found, skipping"
    continue
  fi

  DUMP_FILE="${BACKUP_DIR}/${db}_${TIMESTAMP}.dump"
  ENC_FILE="${DUMP_FILE}.enc"
  SHA_FILE="${ENC_FILE}.sha256"

  # Dump database
  log "  Dumping ${db}..."
  if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
    -Fc --no-owner --no-acl \
    -f "${DUMP_FILE}" "${db}" 2>>"${BACKUP_LOG}"; then
    log "  Dump complete: $(du -h "${DUMP_FILE}" | cut -f1)"
  else
    log "  ERROR: Failed to dump ${db}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Encrypt with GPG
  log "  Encrypting ${db}..."
  if gpg --batch --yes --symmetric \
    --cipher-algo AES256 \
    --passphrase "${DB_BACKUP_ENCRYPTION_KEY}" \
    --output "${ENC_FILE}" \
    "${DUMP_FILE}" 2>>"${BACKUP_LOG}"; then
    log "  Encryption complete: $(du -h "${ENC_FILE}" | cut -f1)"
  else
    log "  ERROR: Failed to encrypt ${db}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Generate checksum (cross-platform: shasum -a 256 on macOS, sha256sum on Linux)
  if command -v shasum &>/dev/null; then
    shasum -a 256 "${ENC_FILE}" > "${SHA_FILE}"
  else
    sha256sum "${ENC_FILE}" > "${SHA_FILE}"
  fi
  log "  Checksum: $(cut -d' ' -f1 "${SHA_FILE}")"

  # Upload to S3
  log "  Uploading to s3://${S3_BACKUP_BUCKET}/backups/${db}/"
  if aws s3 cp "${ENC_FILE}" \
    "s3://${S3_BACKUP_BUCKET}/backups/${db}/${db}_${TIMESTAMP}.enc" \
    --region "${S3_REGION}" \
    --storage-class STANDARD_IA \
    2>>"${BACKUP_LOG}"; then
    log "  Upload complete"
  else
    log "  ERROR: Failed to upload ${db}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Upload checksum
  aws s3 cp "${SHA_FILE}" \
    "s3://${S3_BACKUP_BUCKET}/backups/${db}/${db}_${TIMESTAMP}.enc.sha256" \
    --region "${S3_REGION}" \
    2>>"${BACKUP_LOG}" || true

  # Clean up local dump file (keep encrypted file for verification)
  rm -f "${DUMP_FILE}"
  SUCCESS=$((SUCCESS + 1))
  log "  ${db} backup complete"
done

# Enforce retention policy
log "=== Enforcing Retention Policy (${BACKUP_RETENTION_DAYS} days) ==="
CUTOFF_DATE=$(date -d "-${BACKUP_RETENTION_DAYS} days" '+%Y%m%d' 2>/dev/null || \
  date -v-"${BACKUP_RETENTION_DAYS}"d '+%Y%m%d' 2>/dev/null || echo "")

if [ -n "${CUTOFF_DATE}" ]; then
  for db in "${DATABASES[@]}"; do
    # List old backups in S3
    OLD_FILES=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/backups/${db}/" \
      --region "${S3_REGION}" 2>/dev/null \
      | awk '{print $4}' \
      | grep -E '^[0-9]{8}-[0-9]{6}\.enc$' \
      | while read -r fname; do
        FILE_DATE=$(echo "$fname" | cut -d'_' -f2 | cut -d'.' -f1 | cut -c1-8)
        if [ "${FILE_DATE}" -lt "${CUTOFF_DATE}" ] 2>/dev/null; then
          echo "$fname"
        fi
      done || echo "")

    for old_file in ${OLD_FILES}; do
      log "  Removing old backup: ${db}/${old_file}"
      aws s3 rm "s3://${S3_BACKUP_BUCKET}/backups/${db}/${old_file}" \
        --region "${S3_REGION}" 2>/dev/null || true
      aws s3 rm "s3://${S3_BACKUP_BUCKET}/backups/${db}/${old_file}.sha256" \
        --region "${S3_REGION}" 2>/dev/null || true
    done
  done
  log "Retention cleanup complete"
fi

unset PGPASSWORD

# Summary
log "=== Backup Summary ==="
log "Successful: ${SUCCESS}"
log "Failed:     ${ERRORS}"
log "Total:      ${#DATABASES[@]}"
log "Log file:   ${BACKUP_LOG}"

if [ "${ERRORS}" -gt 0 ]; then
  send_slack "🚨 Azeebo+ Database Backup: ${ERRORS} failure(s). Successful: ${SUCCESS}/${#DATABASES[@]}. Log: ${BACKUP_LOG}"
  exit 1
else
  send_slack "✅ Azeebo+ Database Backup Complete: ${SUCCESS} databases backed up successfully."
  log "All backups completed successfully"
fi
