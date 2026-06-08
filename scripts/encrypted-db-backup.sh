#!/bin/bash
set -e

echo "========================================="
echo "Encrypted Database Backup Script"
echo "========================================="

BACKUP_DIR="${BACKUP_DIR:-/tmp/db-backups}"
ENCRYPTION_KEY="${DB_BACKUP_ENCRYPTION_KEY}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="azeebo_backup_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-azeebo}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

S3_BUCKET="${S3_BACKUP_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"

check_prerequisites() {
  if [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ ERROR: DB_BACKUP_ENCRYPTION_KEY environment variable is required"
    exit 1
  fi

  if [ -z "$DB_PASSWORD" ]; then
    echo "❌ ERROR: DB_PASSWORD environment variable is required"
    exit 1
  fi

  if ! command -v pg_dump &> /dev/null; then
    echo "❌ ERROR: pg_dump is required but not installed"
    exit 1
  fi

  if ! command -v openssl &> /dev/null; then
    echo "❌ ERROR: openssl is required but not installed"
    exit 1
  fi

  mkdir -p "$BACKUP_DIR"
  echo "✅ Prerequisites check passed"
}

create_backup() {
  echo "📦 Creating database backup..."
  
  export PGPASSWORD="$DB_PASSWORD"
  
  pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --verbose \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"
  
  unset PGPASSWORD
  
  if [ $? -eq 0 ]; then
    local size=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created: ${BACKUP_FILE} (${size})"
  else
    echo "❌ ERROR: Backup creation failed"
    exit 1
  fi
}

encrypt_backup() {
  echo "🔒 Encrypting backup..."
  
  openssl enc -aes-256-cbc \
    -salt \
    -pbkdf2 \
    -in "${BACKUP_DIR}/${BACKUP_FILE}" \
    -out "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    -pass env:ENCRYPTION_KEY
  
  if [ $? -eq 0 ]; then
    local size=$(du -h "${BACKUP_DIR}/${ENCRYPTED_FILE}" | cut -f1)
    echo "✅ Backup encrypted: ${ENCRYPTED_FILE} (${size})"
    
    rm "${BACKUP_DIR}/${BACKUP_FILE}"
    echo "🗑️ Removed unencrypted backup"
  else
    echo "❌ ERROR: Encryption failed"
    exit 1
  fi
}

upload_to_s3() {
  if [ -z "$S3_BUCKET" ]; then
    echo "⚠️ S3_BUCKET not set, skipping upload"
    return 0
  fi

  echo "☁️ Uploading to S3..."
  
  if ! command -v aws &> /dev/null; then
    echo "❌ ERROR: AWS CLI is required but not installed"
    exit 1
  fi

  aws s3 cp \
    "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    "s3://${S3_BUCKET}/backups/${ENCRYPTED_FILE}" \
    --region "$S3_REGION" \
    --storage-class STANDARD_IA
  
  if [ $? -eq 0 ]; then
    echo "✅ Upload complete: s3://${S3_BUCKET}/backups/${ENCRYPTED_FILE}"
  else
    echo "❌ ERROR: Upload failed"
    exit 1
  fi
}

cleanup_old_backups() {
  echo "🧹 Cleaning up old backups..."
  
  find "$BACKUP_DIR" -name "azeebo_backup_*.enc" -mtime +${RETENTION_DAYS} -delete
  
  local count=$(find "$BACKUP_DIR" -name "azeebo_backup_*.enc" | wc -l)
  echo "✅ Cleanup complete: ${count} backups remaining"
}

generate_checksum() {
  echo "🔑 Generating checksum..."
  
  sha256sum "${BACKUP_DIR}/${ENCRYPTED_FILE}" > "${BACKUP_DIR}/${ENCRYPTED_FILE}.sha256"
  
  echo "✅ Checksum generated"
}

send_notification() {
  local status="$1"
  local message="$2"
  
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-type: application/json' \
      --data "{
        \"text\": \"📦 Database Backup ${status}\n${message}\nTimestamp: ${TIMESTAMP}\nFile: ${ENCRYPTED_FILE}\"
      }" > /dev/null
  fi
}

main() {
  echo "🚀 Starting encrypted database backup..."
  echo "📅 Timestamp: ${TIMESTAMP}"
  echo "📁 Backup directory: ${BACKUP_DIR}"
  echo ""

  check_prerequisites
  create_backup
  encrypt_backup
  generate_checksum
  upload_to_s3
  cleanup_old_backups

  echo ""
  echo "========================================="
  echo "✅ Backup completed successfully!"
  echo "========================================="
  echo "📁 File: ${ENCRYPTED_FILE}"
  echo "🔒 Encryption: AES-256-CBC"
  echo "📊 Size: $(du -h "${BACKUP_DIR}/${ENCRYPTED_FILE}" | cut -f1)"
  echo "🔑 Checksum: ${ENCRYPTED_FILE}.sha256"
  echo "📅 Retention: ${RETENTION_DAYS} days"
  echo "========================================="

  send_notification "Success" "Backup completed successfully"
}

main "$@"
