#!/bin/bash
# Apply Database Indexes
# Usage: ./scripts/apply-indexes.sh

set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-azeebo_admin}"
DB_NAME="${DB_NAME:-azeebo_prod}"
DB_PORT="${DB_PORT:-5432}"

echo "Applying database indexes to $DB_HOST:$DB_PORT/$DB_NAME"

# Check connection
PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1 || {
  echo "ERROR: Cannot connect to database"
  exit 1
}

# Apply indexes concurrently to avoid table locks
cat <<'EOF' | PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d $DB_NAME
-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_category ON analytics_events (category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_category ON analytics_events (user_id, category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_timestamp ON analytics_events (created_at DESC);

-- Messaging indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user ON messages (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient ON messages (recipient_id, read_at);

-- User service indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity ON analytics_events (user_id, event_type, created_at DESC);

-- Wallet indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions (status, created_at);

-- Payment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user ON payments (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments (status, created_at);

-- Content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_creator ON content (creator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_tags ON content USING gin (tags);
EOF

echo "Database indexes applied successfully!"

# Verify indexes
echo "Verifying indexes..."
PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d" | grep -E "idx_(analytics|messages|wallet|payments|content|user)_"