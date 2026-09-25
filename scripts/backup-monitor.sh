#!/bin/bash
# backup-monitor.sh — Monitor database backups and verify integrity
# Usage: bash scripts/backup-monitor.sh

set -e

LOG_FILE="backup-monitor-$(date +%Y%m%d).log"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/azeebo}"
MAX_AGE_HOURS=25  # Alert if backup is older than 25 hours

echo "=== Azeebo+ Backup Monitor ===" | tee -a "$LOG_FILE"
echo "Time: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Check PostgreSQL backup
echo "Checking PostgreSQL backup..." | tee -a "$LOG_FILE"

# Check if pg_dump is available
if command -v pg_dump &> /dev/null; then
  echo "  pg_dump available: $(pg_dump --version | head -1)" | tee -a "$LOG_FILE"
else
  echo "  ⚠ pg_dump not found" | tee -a "$LOG_FILE"
fi

# Check backup directory
if [ -d "$BACKUP_DIR" ]; then
  echo "  Backup directory: $BACKUP_DIR" | tee -a "$LOG_FILE"

  # Find latest backup
  LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

  if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")) / 3600 ))
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

    echo "  Latest backup: $LATEST_BACKUP" | tee -a "$LOG_FILE"
    echo "  Backup size: $BACKUP_SIZE" | tee -a "$LOG_FILE"
    echo "  Backup age: ${BACKUP_AGE} hours" | tee -a "$LOG_FILE"

    if [ "$BACKUP_AGE" -gt "$MAX_AGE_HOURS" ]; then
      echo "  ⚠ ALERT: Backup is older than ${MAX_AGE_HOURS} hours!" | tee -a "$LOG_FILE"
      ALERT=1
    else
      echo "  ✓ Backup is recent" | tee -a "$LOG_FILE"
    fi

    # Verify backup integrity
    echo "  Verifying backup integrity..." | tee -a "$LOG_FILE"
    if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
      echo "  ✓ Backup integrity verified" | tee -a "$LOG_FILE"
    else
      echo "  ✗ ALERT: Backup integrity check failed!" | tee -a "$LOG_FILE"
      ALERT=1
    fi
  else
    echo "  ⚠ No backups found in $BACKUP_DIR" | tee -a "$LOG_FILE"
    ALERT=1
  fi
else
  echo "  ⚠ Backup directory not found: $BACKUP_DIR" | tee -a "$LOG_FILE"
fi

# Check Redis backup
echo "" | tee -a "$LOG_FILE"
echo "Checking Redis backup..." | tee -a "$LOG_FILE"

REDIS_DUMP_DIR="${REDIS_DUMP_DIR:-/var/lib/redis}"
if [ -d "$REDIS_DUMP_DIR" ]; then
  LATEST_RDB=$(find "$REDIS_DUMP_DIR" -name "dump.rdb" -type f | head -1)
  if [ -n "$LATEST_RDB" ]; then
    RDB_SIZE=$(du -h "$LATEST_RDB" | cut -f1)
    echo "  Redis RDB: $LATEST_RDB ($RDB_SIZE)" | tee -a "$LOG_FILE"
  else
    echo "  ⚠ No Redis RDB dump found" | tee -a "$LOG_FILE"
  fi
else
  echo "  Redis dump directory not found" | tee -a "$LOG_FILE"
fi

# Check S3 backups (if AWS CLI available)
echo "" | tee -a "$LOG_FILE"
echo "Checking S3 backups..." | tee -a "$LOG_FILE"

if command -v aws &> /dev/null; then
  S3_BUCKET="${S3_BACKUP_BUCKET:-azeebo-prod-backups}"
  S3_COUNT=$(aws s3 ls "s3://$S3_BUCKET" --recursive 2>/dev/null | wc -l | tr -d ' ')
  echo "  S3 objects: $S3_COUNT" | tee -a "$LOG_FILE"

  # Check latest S3 backup
  LATEST_S3=$(aws s3 ls "s3://$S3_BUCKET" --recursive --sort-by modified --sort-order descending 2>/dev/null | head -1 | awk '{print $4}')
  if [ -n "$LATEST_S3" ]; then
    echo "  Latest S3 backup: $LATEST_S3" | tee -a "$LOG_FILE"
  fi
else
  echo "  AWS CLI not available" | tee -a "$LOG_FILE"
fi

# Summary
echo "" | tee -a "$LOG_FILE"
echo "=== Summary ===" | tee -a "$LOG_FILE"

if [ "${ALERT:-0}" = "1" ]; then
  echo "⚠ Issues detected — check log for details" | tee -a "$LOG_FILE"
  exit 1
else
  echo "✓ All backup checks passed" | tee -a "$LOG_FILE"
  exit 0
fi
