#!/bin/bash
# Point-in-Time Recovery Restore Script for PostgreSQL
# Usage: ./restore-pitr.sh <timestamp> [database_name]

set -euo pipefail

TIMESTAMP="${1:-}"
DB_NAME="${2:-azeebo_prod}"
BACKUP_BUCKET="${BACKUP_BUCKET:-s3://azeebo-backups-postgres}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

if [[ -z "$TIMESTAMP" ]]; then
  echo "Usage: $0 <timestamp> [database_name]"
  echo "Example: $0 '2026-06-20 14:30:00' azeebo_prod"
  exit 1
fi

echo "Starting Point-in-Time Recovery for database '$DB_NAME' to timestamp '$TIMESTAMP'"

# Validate timestamp format
if ! date -j -f "%Y-%m-%d %H:%M:%S" "$TIMESTAMP" >/dev/null 2>&1; then
  echo "ERROR: Invalid timestamp format. Use: 'YYYY-MM-DD HH:MM:SS'"
  exit 1
fi

# Step 1: Stop current PostgreSQL instance
echo "Step 1: Stopping PostgreSQL..."
kubectl scale deployment postgres --replicas=0 -n azeebo-prod
sleep 30

# Step 2: Download base backup
echo "Step 2: Downloading base backup from $BACKUP_BUCKET..."
mkdir -p /tmp/pg-restore
aws s3 cp "${BACKUP_BUCKET}/base/" /tmp/pg-restore/ --recursive --exclude "*" --include "*.tar.gz"

# Step 3: Extract base backup
echo "Step 3: Extracting base backup..."
rm -rf "${PGDATA:?}"/*
tar -xzf /tmp/pg-restore/base.tar.gz -C "${PGDATA}"

# Step 4: Configure recovery
echo "Step 4: Configuring recovery to timestamp $TIMESTAMP..."
cat > "${PGDATA}/recovery.conf" << EOF
restore_command = 'cp ${BACKUP_BUCKET}/wal/%f %p'
recovery_target_time = '$TIMESTAMP'
recovery_target_action = 'promote'
EOF

# Step 5: Start PostgreSQL in recovery mode
echo "Step 5: Starting PostgreSQL in recovery mode..."
kubectl scale deployment postgres --replicas=1 -n azeebo-prod

# Step 6: Wait for recovery to complete
echo "Step 6: Waiting for recovery to complete..."
sleep 60
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n azeebo-prod

# Step 7: Verify restore
echo "Step 7: Verifying restore..."
kubectl exec -n azeebo-prod deploy/postgres -- psql -c "SELECT pg_is_in_recovery();" || {
  echo "ERROR: Database not in recovery state"
  exit 1
}

echo "Point-in-Time Recovery completed successfully"
echo "Restored to timestamp: $TIMESTAMP"