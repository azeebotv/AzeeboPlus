#!/bin/bash
set -e

# ============================================================
# Azeebo+ All-in-One Entrypoint
# ============================================================
# Initializes PostgreSQL, creates databases, runs Prisma
# migrations, then hands off to supervisord.
# ============================================================

POSTGRES_DATA="/var/lib/postgresql/data"
POSTGRES_USER="${POSTGRES_USER:-azeebo}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
POSTGRES_DB="${POSTGRES_DB:-azeebo_dev}"
REDIS_PASSWORD="${REDIS_PASSWORD:?REDIS_PASSWORD is required}"

export NO_COLOR=1

echo "==> Starting Azeebo+ all-in-one container..."

# ============================================================
# 1. Initialize PostgreSQL if empty
# ============================================================
if [ ! -f "$POSTGRES_DATA/PG_VERSION" ]; then
  echo "==> Initializing PostgreSQL data directory..."
  gosu postgres sh -c "mkdir -p $POSTGRES_DATA && chown -R postgres:postgres $POSTGRES_DATA"
  gosu postgres sh -c "/usr/lib/postgresql/15/bin/initdb -D $POSTGRES_DATA --encoding=UTF8 --locale=C"
fi

# Configure PostgreSQL
gosu postgres sh -c "chown -R postgres:postgres $POSTGRES_DATA"
cat > "$POSTGRES_DATA/postgresql.conf" << PGCONF
listen_addresses = 'localhost'
port = 5432
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 8MB
maintenance_work_mem = 128MB
max_connections = 100
wal_buffers = 8MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
log_min_duration_statement = 1000
unix_socket_directories = '/var/run/postgresql'
PGCONF

# Configure pg_hba.conf for local connections
cat > "$POSTGRES_DATA/pg_hba.conf" << PGHBA
local   all   all                 trust
host    all   all  127.0.0.1/32   md5
host    all   all  ::1/128        md5
PGHBA

# ============================================================
# 2. Start PostgreSQL temporarily
# ============================================================
echo "==> Starting PostgreSQL temporarily..."
# Kill any stale PostgreSQL processes from previous container runs
gosu postgres sh -c "/usr/lib/postgresql/15/bin/pg_ctl -D $POSTGRES_DATA stop -m fast" 2>/dev/null || true
sleep 1
gosu postgres sh -c "/usr/lib/postgresql/15/bin/pg_ctl -D $POSTGRES_DATA -l /var/log/postgresql/postgresql-temp.log start -w"

# Wait for PostgreSQL to be ready
for i in $(seq 1 60); do
  if gosu postgres sh -c "pg_isready -h localhost -p 5432" > /dev/null 2>&1; then
    echo "==> PostgreSQL is ready."
    break
  fi
  echo "    Waiting for PostgreSQL... ($i/60)"
  sleep 2
done

# ============================================================
# 3. Create superuser and default database
# ============================================================
echo "==> Configuring PostgreSQL user and database..."
export PGPASSWORD="$POSTGRES_PASSWORD"
gosu postgres sh -c "psql -v ON_ERROR_STOP=0 -c \"ALTER USER postgres WITH PASSWORD '${POSTGRES_PASSWORD}'\"" || true
gosu postgres sh -c "psql -v ON_ERROR_STOP=0 -t -A -c \"SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'\" | grep -q 1" || \
  gosu postgres sh -c "psql -c \"CREATE USER ${POSTGRES_USER} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD}'\""
gosu postgres sh -c "psql -v ON_ERROR_STOP=0 -t -A -c \"SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'\" | grep -q 1" || \
  gosu postgres sh -c "psql -c \"CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}\""

# ============================================================
# 4. Create all service databases
# ============================================================
echo "==> Creating service databases..."

DBS=(
  "azeebo_auth:azeebo:${AUTH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_user:azeebo:${USER_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_wallet:azeebo:${WALLET_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_payment:azeebo:${PAYMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_content:azeebo:${CONTENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_search:azeebo:${SEARCH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_notification:azeebo:${NOTIFICATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_reward:azeebo:${REWARD_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_analytics:azeebo:${ANALYTICS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_recommendation:azeebo:${RECOMMENDATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_reality:azeebo:${REALITY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_movie:azeebo:${MOVIE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_comedy:azeebo:${COMEDY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_games:azeebo:${GAMES_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_queue:azeebo:${QUEUE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_lifestyle:azeebo:${LIFESTYLE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_vertical:azeebo:${VERTICAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_creator:azeebo:${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_media:azeebo:${MEDIA_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_support:azeebo:${SUPPORT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_sports:azeebo:${SPORTS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_moderation:azeebo:${MODERATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_engagement:azeebo:${ENGAGEMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_messaging:azeebo:${MESSAGING_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_referral:azeebo:${REFERRAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_subscription:azeebo:${SUBSCRIPTION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_live_event:azeebo:${LIVE_EVENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "azeebo_admin:azeebo:${ADMIN_DB_PASSWORD:-$POSTGRES_PASSWORD}"
)

for entry in "${DBS[@]}"; do
  IFS=':' read -r db_name db_user db_pass <<< "$entry"

  # Create user
  gosu postgres sh -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='$db_user'\" | grep -q 1" || \
    gosu postgres sh -c "psql -c \"CREATE USER $db_user WITH PASSWORD '$db_pass';\""
  echo "    User $db_user ready."

  # Create database
  gosu postgres sh -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='$db_name'\" | grep -q 1" || \
    gosu postgres sh -c "psql -c \"CREATE DATABASE $db_name OWNER $db_user;\""
  echo "    Database $db_name ready."
done

# ============================================================
# 5. Configure Redis
# ============================================================
echo "==> Configuring Redis..."
mkdir -p /etc/redis
cat > /etc/redis/redis.conf << REDISCONF
port 6379
bind 127.0.0.1
daemonize no
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
maxmemory 512mb
maxmemory-policy noeviction
save 900 1
save 300 10
save 60 10000
requirepass $REDIS_PASSWORD
dir /var/lib/redis
 logfile ""
REDISCONF
mkdir -p /var/lib/redis 2>/dev/null || true

# ============================================================
# 6. Configure PgBouncer
# NOTE: This generates a LOCAL-DEV config (host=127.0.0.1, no TLS).
# Production config lives in infra/config/pgbouncer.ini (host=postgres, TLS required, larger pools).
# Keep both in sync when adding/removing databases.
# ============================================================
echo "==> Configuring PgBouncer..."
mkdir -p /etc/pgbouncer /var/log/pgbouncer /var/run/pgbouncer 2>/dev/null || true
cat > /etc/pgbouncer/pgbouncer.ini << PGBOUNCERINI
[databases]
$POSTGRES_DB = host=127.0.0.1 port=5432 dbname=$POSTGRES_DB
azeebo_auth = host=127.0.0.1 port=5432 dbname=azeebo_auth
azeebo_user = host=127.0.0.1 port=5432 dbname=azeebo_user
azeebo_wallet = host=127.0.0.1 port=5432 dbname=azeebo_wallet
azeebo_payment = host=127.0.0.1 port=5432 dbname=azeebo_payment
azeebo_content = host=127.0.0.1 port=5432 dbname=azeebo_content
azeebo_search = host=127.0.0.1 port=5432 dbname=azeebo_search
azeebo_notification = host=127.0.0.1 port=5432 dbname=azeebo_notification
azeebo_reward = host=127.0.0.1 port=5432 dbname=azeebo_reward
azeebo_analytics = host=127.0.0.1 port=5432 dbname=azeebo_analytics
azeebo_recommendation = host=127.0.0.1 port=5432 dbname=azeebo_recommendation
azeebo_reality = host=127.0.0.1 port=5432 dbname=azeebo_reality
azeebo_movie = host=127.0.0.1 port=5432 dbname=azeebo_movie
azeebo_comedy = host=127.0.0.1 port=5432 dbname=azeebo_comedy
azeebo_games = host=127.0.0.1 port=5432 dbname=azeebo_games
azeebo_queue = host=127.0.0.1 port=5432 dbname=azeebo_queue
azeebo_lifestyle = host=127.0.0.1 port=5432 dbname=azeebo_lifestyle
azeebo_vertical = host=127.0.0.1 port=5432 dbname=azeebo_vertical
azeebo_creator = host=127.0.0.1 port=5432 dbname=azeebo_creator
azeebo_media = host=127.0.0.1 port=5432 dbname=azeebo_media
azeebo_support = host=127.0.0.1 port=5432 dbname=azeebo_support
azeebo_sports = host=127.0.0.1 port=5432 dbname=azeebo_sports
azeebo_moderation = host=127.0.0.1 port=5432 dbname=azeebo_moderation
azeebo_engagement = host=127.0.0.1 port=5432 dbname=azeebo_engagement
azeebo_messaging = host=127.0.0.1 port=5432 dbname=azeebo_messaging
azeebo_referral = host=127.0.0.1 port=5432 dbname=azeebo_referral
azeebo_subscription = host=127.0.0.1 port=5432 dbname=azeebo_subscription
azeebo_admin = host=127.0.0.1 port=5432 dbname=azeebo_admin

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
pool_mode = transaction
max_client_conn = 500
default_pool_size = 20
min_pool_size = 3
reserve_pool_size = 3
log_connections = 0
log_disconnections = 0
admin_users = $POSTGRES_USER
stats_users = $POSTGRES_USER
unix_socket_dir = /var/run/pgbouncer
PGBOUNCERINI
# Generate PgBouncer userlist from PostgreSQL password hashes
echo "    Generating PgBouncer userlist..."
gosu postgres sh -c "psql -d postgres -t -A -c \"SELECT '\" || rolname || '\" \"' || password || '\"' FROM pg_authid WHERE rolname != 'postgres' AND rolname != '$POSTGRES_USER' AND password IS NOT NULL;\"" > /etc/pgbouncer/userlist.txt 2>/dev/null || true
# Also add the superuser
gosu postgres sh -c "psql -d postgres -t -A -c \"SELECT '\" || rolname || '\" \"' || password || '\"' FROM pg_authid WHERE rolname = '$POSTGRES_USER' AND password IS NOT NULL;\"" >> /etc/pgbouncer/userlist.txt 2>/dev/null || true
chmod 644 /etc/pgbouncer/userlist.txt 2>/dev/null || true
echo "    PgBouncer userlist generated."

# ============================================================
# 7. Run Prisma migrations
# ============================================================
echo "==> Running Prisma migrations..."

MIGRATE_SERVICES=(
  "services/core/auth-service:auth-service:azeebo_auth:azeebo:${AUTH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/user-service:user-service:azeebo_user:azeebo:${USER_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/wallet-service:wallet-service:azeebo_wallet:azeebo:${WALLET_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/payment-service:payment-service:azeebo_payment:azeebo:${PAYMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/content-service:content-service:azeebo_content:azeebo:${CONTENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/search-service:search-service:azeebo_search:azeebo:${SEARCH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/media-service:media-service:azeebo_media:azeebo:${MEDIA_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/notification-service:notification-service:azeebo_notification:azeebo:${NOTIFICATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/reward-service:reward-service:azeebo_reward:azeebo:${REWARD_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/intelligence/analytics-service:analytics-service:azeebo_analytics:azeebo:${ANALYTICS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/intelligence/recommendation-service:recommendation-service:azeebo_recommendation:azeebo:${RECOMMENDATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/reality-service:reality-service:azeebo_reality:azeebo:${REALITY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/movie-service:movie-service:azeebo_movie:azeebo:${MOVIE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/comedy-service:comedy-service:azeebo_comedy:azeebo:${COMEDY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/games-service:games-service:azeebo_games:azeebo:${GAMES_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/queue-service:queue-service:azeebo_queue:azeebo:${QUEUE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/lifestyle-service:lifestyle-service:azeebo_lifestyle:azeebo:${LIFESTYLE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/vertical-service:vertical-service:azeebo_vertical:azeebo:${VERTICAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/creator-service:creator-service:azeebo_creator:azeebo:${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/support-service:support-service:azeebo_support:azeebo:${SUPPORT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/sports-service:sports-service:azeebo_sports:azeebo:${SPORTS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/moderation-service:moderation-service:azeebo_moderation:azeebo:${MODERATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/engagement-service:engagement-service:azeebo_engagement:azeebo:${ENGAGEMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/messaging-service:messaging-service:azeebo_messaging:azeebo:${MESSAGING_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/referral-service:referral-service:azeebo_referral:azeebo:${REFERRAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/subscription-service:subscription-service:azeebo_subscription:azeebo:${SUBSCRIPTION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/live-event-service:live-event-service:azeebo_live_event:azeebo:${LIVE_EVENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "apps/admin:admin-app:azeebo_admin:azeebo:${ADMIN_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "apps/creator:creator-app:azeebo_creator:azeebo:${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
)

# First: resolve any stuck/failed Prisma migrations (P3009) before deploying
for entry in "${MIGRATE_SERVICES[@]}"; do
  IFS=':' read -r svc_dir svc_name db_name db_user db_pass <<< "$entry"

  # Check if prisma_migrations table exists and has stuck failures
  # Find migrations that are not cleanly applied (started but not finished, or finished but still rolling back)
  failed_migrations=$(PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d "$db_name" -t -A -c \
    "SELECT migration_name FROM prisma_migrations WHERE (finished_at IS NULL AND started_at IS NOT NULL) OR (rolling_back_at IS NOT NULL AND rolled_back_at IS NULL) LIMIT 50" 2>/dev/null || echo "")

  if [ -n "$failed_migrations" ]; then
    echo "    Resolving stuck migrations for $svc_name..."
    while IFS= read -r migration_name; do
      [ -z "$migration_name" ] && continue
      echo "      Resolving: $migration_name"
      DATABASE_URL="postgresql://$db_user:$db_pass@127.0.0.1:5432/$db_name?schema=public" \
        prisma migrate resolve --rolled-back "$migration_name" --schema="$svc_dir/prisma/schema.prisma" 2>&1 || \
        echo "      WARNING: Could not resolve $migration_name (may already be resolved)"
    done <<< "$failed_migrations"
  fi
done

for entry in "${MIGRATE_SERVICES[@]}"; do
  IFS=':' read -r svc_dir svc_name db_name db_user db_pass <<< "$entry"
  echo "    Migrating $svc_name..."

  db_url="postgresql://$db_user:$db_pass@127.0.0.1:5432/$db_name?schema=public"
  migrate_output=$(DATABASE_URL="$db_url" \
    prisma migrate deploy --schema="$svc_dir/prisma/schema.prisma" 2>&1) || {
    if echo "$migrate_output" | grep -q "P3005"; then
      echo "    P3005: database exists with untracked tables for $svc_name"
      echo "    Baseline approach: mark all migrations as applied, then re-deploy..."
      if [ -d "$svc_dir/prisma/migrations" ]; then
        for migration_dir in "$svc_dir/prisma/migrations"/*/; do
          [ -d "$migration_dir" ] || continue
          migration_name=$(basename "$migration_dir")
          DATABASE_URL="$db_url" \
            prisma migrate resolve --applied "$migration_name" --schema="$svc_dir/prisma/schema.prisma" 2>&1 || \
            echo "      WARNING: Could not baseline $migration_name"
        done
        echo "    Re-running migration for $svc_name after baseline..."
        DATABASE_URL="$db_url" \
          prisma migrate deploy --schema="$svc_dir/prisma/schema.prisma" 2>&1 || {
          echo "    FATAL: Migration still failed for $svc_name after baseline"
          echo "    Migration output:"
          echo "$migrate_output" | head -20
          exit 1
        }
      else
        echo "    FATAL: No migrations directory found for $svc_name"
        exit 1
      fi
    elif echo "$migrate_output" | grep -q "P3018"; then
      echo "    P3018: previous migration in error state for $svc_name — resolving..."
      # Extract the stuck migration name from error output
      failed_migration=$(echo "$migrate_output" | grep -oP 'Migration name: \K.*' | head -1 || true)
      if [ -n "$failed_migration" ]; then
        echo "    Resolving: $failed_migration"
        DATABASE_URL="$db_url" \
          prisma migrate resolve --rolled-back "$failed_migration" --schema="$svc_dir/prisma/schema.prisma" 2>&1 || true
      fi
      # Also resolve any stuck migrations in the table
      stuck_migrations=$(PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d "$db_name" -t -A -c \
        "SELECT migration_name FROM prisma_migrations WHERE finished_at IS NULL AND started_at IS NOT NULL LIMIT 50" 2>/dev/null || echo "")
      if [ -n "$stuck_migrations" ]; then
        while IFS= read -r stuck_name; do
          [ -z "$stuck_name" ] && continue
          echo "    Resolving stuck: $stuck_name"
          DATABASE_URL="$db_url" \
            prisma migrate resolve --rolled-back "$stuck_name" --schema="$svc_dir/prisma/schema.prisma" 2>&1 || true
        done <<< "$stuck_migrations"
      fi
      echo "    Dropping partially-applied migration objects for $svc_name (P3018 recovery)..."
      PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d "$db_name" -c \
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1 || true
      echo "    Re-running migration for $svc_name..."
      DATABASE_URL="$db_url" \
        prisma migrate deploy --schema="$svc_dir/prisma/schema.prisma" 2>&1 || {
        echo "    FATAL: Migration still failed for $svc_name after P3018 resolve"
        echo "    Migration output:"
        echo "$migrate_output" | head -20
        exit 1
      }
    else
      echo "    FATAL: Migration failed for $svc_name"
      echo "    Migration output:"
      echo "$migrate_output" | head -20
      echo "    Aborting deployment — old container will keep running"
      exit 1
    fi
  }
done

# ============================================================
# 7b. Clear databases if CLEAR_DB=1 and DEMO_MODE=1
# ============================================================
if [ "${DEMO_MODE:-false}" = "true" ] && [ "${CLEAR_DB:-0}" = "1" ]; then
  echo "==> CLEAR_DB=1 — Dropping and recreating all service databases..."
  for entry in "${MIGRATE_SERVICES[@]}"; do
    IFS=':' read -r svc_dir svc_name db_name db_user db_pass <<< "$entry"
    echo "    Clearing $db_name..."
    PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d postgres -t -A -c \
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$db_name' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
    PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d postgres -t -A -c \
      "DROP DATABASE IF EXISTS \"$db_name\";" >/dev/null 2>&1 || true
    PGPASSWORD="$db_pass" psql -h 127.0.0.1 -U "$db_user" -d postgres -t -A -c \
      "CREATE DATABASE \"$db_name\";" >/dev/null 2>&1 || true
    echo "    $db_name cleared."
  done
  echo "==> All databases cleared."
fi

# ============================================================
# 7c. Load demo content (always run to ensure users exist)
# ============================================================
echo "==> Loading demo content into all databases..."
if [ -x /app/scripts/demo-content/deploy-all-in-one.sh ]; then
  DB_PASSWORD="$POSTGRES_PASSWORD" /app/scripts/demo-content/deploy-all-in-one.sh || \
    echo "    WARNING: Demo content deployment had errors (non-fatal)"
else
  echo "    WARNING: /app/scripts/demo-content/deploy-all-in-one.sh not found or not executable"
fi

# ============================================================
# 8. Stop temporary PostgreSQL (supervisord will restart it)
# ============================================================
echo "==> Stopping temporary PostgreSQL..."
gosu postgres sh -c "/usr/lib/postgresql/15/bin/pg_ctl -D $POSTGRES_DATA stop -m fast" || true

# ============================================================
# 9. Export DATABASE_URL and REDIS_URL for all services
# ============================================================
echo "==> Setting up service environment variables..."

REDIS_URL="redis://:${REDIS_PASSWORD}@127.0.0.1:6379"
export REDIS_URL

# Service DB password defaults
AUTH_DB_PASSWORD="${AUTH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
USER_DB_PASSWORD="${USER_DB_PASSWORD:-$POSTGRES_PASSWORD}"
WALLET_DB_PASSWORD="${WALLET_DB_PASSWORD:-$POSTGRES_PASSWORD}"
PAYMENT_DB_PASSWORD="${PAYMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
CONTENT_DB_PASSWORD="${CONTENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
SEARCH_DB_PASSWORD="${SEARCH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
NOTIFICATION_DB_PASSWORD="${NOTIFICATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
REWARD_DB_PASSWORD="${REWARD_DB_PASSWORD:-$POSTGRES_PASSWORD}"
ANALYTICS_DB_PASSWORD="${ANALYTICS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
RECOMMENDATION_DB_PASSWORD="${RECOMMENDATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
REALITY_DB_PASSWORD="${REALITY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
MOVIE_DB_PASSWORD="${MOVIE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
COMEDY_DB_PASSWORD="${COMEDY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
GAMES_DB_PASSWORD="${GAMES_DB_PASSWORD:-$POSTGRES_PASSWORD}"
QUEUE_DB_PASSWORD="${QUEUE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
LIFESTYLE_DB_PASSWORD="${LIFESTYLE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
VERTICAL_DB_PASSWORD="${VERTICAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
CREATOR_DB_PASSWORD="${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
MEDIA_DB_PASSWORD="${MEDIA_DB_PASSWORD:-$POSTGRES_PASSWORD}"
SUPPORT_DB_PASSWORD="${SUPPORT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
SPORTS_DB_PASSWORD="${SPORTS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
MODERATION_DB_PASSWORD="${MODERATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
ENGAGEMENT_DB_PASSWORD="${ENGAGEMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
MESSAGING_DB_PASSWORD="${MESSAGING_DB_PASSWORD:-$POSTGRES_PASSWORD}"
REFERRAL_DB_PASSWORD="${REFERRAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
SUBSCRIPTION_DB_PASSWORD="${SUBSCRIPTION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
ADMIN_DB_PASSWORD="${ADMIN_DB_PASSWORD:-$POSTGRES_PASSWORD}"
CREATOR_DB_PASSWORD="${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
LIVE_EVENT_DB_PASSWORD="${LIVE_EVENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"

# Export DATABASE_URL for each service
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?schema=public"
export AUTH_DATABASE_URL="postgresql://azeebo:${AUTH_DB_PASSWORD}@127.0.0.1:5432/azeebo_auth?schema=public"
export USER_DATABASE_URL="postgresql://azeebo:${USER_DB_PASSWORD}@127.0.0.1:5432/azeebo_user?schema=public"
export WALLET_DATABASE_URL="postgresql://azeebo:${WALLET_DB_PASSWORD}@127.0.0.1:5432/azeebo_wallet?schema=public"
export PAYMENT_DATABASE_URL="postgresql://azeebo:${PAYMENT_DB_PASSWORD}@127.0.0.1:5432/azeebo_payment?schema=public"
export CONTENT_DATABASE_URL="postgresql://azeebo:${CONTENT_DB_PASSWORD}@127.0.0.1:5432/azeebo_content?schema=public"
export SEARCH_DATABASE_URL="postgresql://azeebo:${SEARCH_DB_PASSWORD}@127.0.0.1:5432/azeebo_search?schema=public"
export NOTIFICATION_DATABASE_URL="postgresql://azeebo:${NOTIFICATION_DB_PASSWORD}@127.0.0.1:5432/azeebo_notification?schema=public"
export REWARD_DATABASE_URL="postgresql://azeebo:${REWARD_DB_PASSWORD}@127.0.0.1:5432/azeebo_reward?schema=public"
export ANALYTICS_DATABASE_URL="postgresql://azeebo:${ANALYTICS_DB_PASSWORD}@127.0.0.1:5432/azeebo_analytics?schema=public"
export RECOMMENDATION_DATABASE_URL="postgresql://azeebo:${RECOMMENDATION_DB_PASSWORD}@127.0.0.1:5432/azeebo_recommendation?schema=public"
export REALITY_DATABASE_URL="postgresql://azeebo:${REALITY_DB_PASSWORD}@127.0.0.1:5432/azeebo_reality?schema=public"
export MOVIE_DATABASE_URL="postgresql://azeebo:${MOVIE_DB_PASSWORD}@127.0.0.1:5432/azeebo_movie?schema=public"
export COMEDY_DATABASE_URL="postgresql://azeebo:${COMEDY_DB_PASSWORD}@127.0.0.1:5432/azeebo_comedy?schema=public"
export GAMES_DATABASE_URL="postgresql://azeebo:${GAMES_DB_PASSWORD}@127.0.0.1:5432/azeebo_games?schema=public"
export QUEUE_DATABASE_URL="postgresql://azeebo:${QUEUE_DB_PASSWORD}@127.0.0.1:5432/azeebo_queue?schema=public"
export LIFESTYLE_DATABASE_URL="postgresql://azeebo:${LIFESTYLE_DB_PASSWORD}@127.0.0.1:5432/azeebo_lifestyle?schema=public"
export VERTICAL_DATABASE_URL="postgresql://azeebo:${VERTICAL_DB_PASSWORD}@127.0.0.1:5432/azeebo_vertical?schema=public"
export CREATOR_DATABASE_URL="postgresql://azeebo:${CREATOR_DB_PASSWORD}@127.0.0.1:5432/azeebo_creator?schema=public"
export MEDIA_DATABASE_URL="postgresql://azeebo:${MEDIA_DB_PASSWORD}@127.0.0.1:5432/azeebo_media?schema=public"
export SUPPORT_DATABASE_URL="postgresql://azeebo:${SUPPORT_DB_PASSWORD}@127.0.0.1:5432/azeebo_support?schema=public"
export SPORTS_DATABASE_URL="postgresql://azeebo:${SPORTS_DB_PASSWORD}@127.0.0.1:5432/azeebo_sports?schema=public"
export MODERATION_DATABASE_URL="postgresql://azeebo:${MODERATION_DB_PASSWORD}@127.0.0.1:5432/azeebo_moderation?schema=public"
export ENGAGEMENT_DATABASE_URL="postgresql://azeebo:${ENGAGEMENT_DB_PASSWORD}@127.0.0.1:5432/azeebo_engagement?schema=public"
export MESSAGING_DATABASE_URL="postgresql://azeebo:${MESSAGING_DB_PASSWORD}@127.0.0.1:5432/azeebo_messaging?schema=public"
export REFERRAL_DATABASE_URL="postgresql://azeebo:${REFERRAL_DB_PASSWORD}@127.0.0.1:5432/azeebo_referral?schema=public"
export SUBSCRIPTION_DATABASE_URL="postgresql://azeebo:${SUBSCRIPTION_DB_PASSWORD}@127.0.0.1:5432/azeebo_subscription?schema=public"
export ADMIN_DATABASE_URL="postgresql://azeebo:${ADMIN_DB_PASSWORD}@127.0.0.1:5432/azeebo_admin?schema=public"
export CREATOR_DATABASE_URL="postgresql://azeebo:${CREATOR_DB_PASSWORD}@127.0.0.1:5432/azeebo_creator?schema=public"
export LIVE_EVENT_DATABASE_URL="postgresql://azeebo:${LIVE_EVENT_DB_PASSWORD}@127.0.0.1:5432/azeebo_live_event?schema=public"

echo "==> Environment variables configured."

# ============================================================
# 10. Generate wrapper scripts for each service
# ============================================================
echo "==> Generating service wrapper scripts..."

mkdir -p /app/service-wrappers

# Generate a wrapper for each NestJS service
# Format: service_name:db_user:db_password:db_name:port
SERVICES=(
  "auth-service:azeebo:${AUTH_DB_PASSWORD}:azeebo_auth:3000"
  "user-service:azeebo:${USER_DB_PASSWORD}:azeebo_user:3001"
  "wallet-service:azeebo:${WALLET_DB_PASSWORD}:azeebo_wallet:3002"
  "payment-service:azeebo:${PAYMENT_DB_PASSWORD}:azeebo_payment:3003"
  "content-service:azeebo:${CONTENT_DB_PASSWORD}:azeebo_content:3004"
  "search-service:azeebo:${SEARCH_DB_PASSWORD}:azeebo_search:3005"
  "notification-service:azeebo:${NOTIFICATION_DB_PASSWORD}:azeebo_notification:3006"
  "reward-service:azeebo:${REWARD_DB_PASSWORD}:azeebo_reward:3007"
  "analytics-service:azeebo:${ANALYTICS_DB_PASSWORD}:azeebo_analytics:3008"
  "recommendation-service:azeebo:${RECOMMENDATION_DB_PASSWORD}:azeebo_recommendation:3009"
  "reality-service:azeebo:${REALITY_DB_PASSWORD}:azeebo_reality:3010"
  "movie-service:azeebo:${MOVIE_DB_PASSWORD}:azeebo_movie:3011"
  "comedy-service:azeebo:${COMEDY_DB_PASSWORD}:azeebo_comedy:3012"
  "api-gateway:azeebo:${POSTGRES_PASSWORD:-placeholder}:azeebo_api:3013"
  "games-service:azeebo:${GAMES_DB_PASSWORD}:azeebo_games:3014"
  "queue-service:azeebo:${QUEUE_DB_PASSWORD}:azeebo_queue:3015"
  "lifestyle-service:azeebo:${LIFESTYLE_DB_PASSWORD}:azeebo_lifestyle:3016"
  "vertical-service:azeebo:${VERTICAL_DB_PASSWORD}:azeebo_vertical:3017"
  "creator-service:azeebo:${CREATOR_DB_PASSWORD}:azeebo_creator:3018"
  "media-service:azeebo:${MEDIA_DB_PASSWORD}:azeebo_media:3019"
  "support-service:azeebo:${SUPPORT_DB_PASSWORD}:azeebo_support:3020"
  "sports-service:azeebo:${SPORTS_DB_PASSWORD}:azeebo_sports:3021"
  "moderation-service:azeebo:${MODERATION_DB_PASSWORD}:azeebo_moderation:3022"
  "engagement-service:azeebo:${ENGAGEMENT_DB_PASSWORD}:azeebo_engagement:3023"
  "messaging-service:azeebo:${MESSAGING_DB_PASSWORD}:azeebo_messaging:3024"
  "referral-service:azeebo:${REFERRAL_DB_PASSWORD}:azeebo_referral:3025"
  "subscription-service:azeebo:${SUBSCRIPTION_DB_PASSWORD}:azeebo_subscription:3026"
  "live-event-service:azeebo:${LIVE_EVENT_DB_PASSWORD}:azeebo_live_event:3027"
)

# Map service names to their monorepo paths
declare -A SVC_PATHS
SVC_PATHS[auth-service]="services/core/auth-service"
SVC_PATHS[user-service]="services/core/user-service"
SVC_PATHS[wallet-service]="services/core/wallet-service"
SVC_PATHS[payment-service]="services/core/payment-service"
SVC_PATHS[content-service]="services/core/content-service"
SVC_PATHS[search-service]="services/core/search-service"
SVC_PATHS[media-service]="services/core/media-service"
SVC_PATHS[notification-service]="services/engagement/notification-service"
SVC_PATHS[reward-service]="services/engagement/reward-service"
SVC_PATHS[engagement-service]="services/engagement/engagement-service"
SVC_PATHS[messaging-service]="services/engagement/messaging-service"
SVC_PATHS[referral-service]="services/engagement/referral-service"
SVC_PATHS[subscription-service]="services/engagement/subscription-service"
SVC_PATHS[analytics-service]="services/intelligence/analytics-service"
SVC_PATHS[recommendation-service]="services/intelligence/recommendation-service"
SVC_PATHS[reality-service]="services/universes/reality-service"
SVC_PATHS[movie-service]="services/universes/movie-service"
SVC_PATHS[comedy-service]="services/universes/comedy-service"
SVC_PATHS[games-service]="services/universes/games-service"
SVC_PATHS[sports-service]="services/universes/sports-service"
SVC_PATHS[lifestyle-service]="services/universes/lifestyle-service"
SVC_PATHS[vertical-service]="services/universes/vertical-service"
SVC_PATHS[creator-service]="services/universes/creator-service"
SVC_PATHS[live-event-service]="services/universes/live-event-service"
SVC_PATHS[queue-service]="services/operations/queue-service"
SVC_PATHS[support-service]="services/operations/support-service"
SVC_PATHS[moderation-service]="services/operations/moderation-service"
SVC_PATHS[api-gateway]="services/gateway/api-gateway"

JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-$(openssl rand -hex 64)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(openssl rand -hex 64)}"
GATEWAY_SECRET="${GATEWAY_SECRET:-$(openssl rand -hex 32)}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(openssl rand -hex 32)}"
# Sanitize injected secrets: http header values cannot contain CR/LF.
# `openssl rand -base64` wraps at 64 columns, which would embed newlines
# into header-based secrets (x-gateway-secret) and break every proxied request.
JWT_ACCESS_SECRET="$(printf '%s' "$JWT_ACCESS_SECRET" | tr -d '\r\n')"
JWT_REFRESH_SECRET="$(printf '%s' "$JWT_REFRESH_SECRET" | tr -d '\r\n')"
GATEWAY_SECRET="$(printf '%s' "$GATEWAY_SECRET" | tr -d '\r\n')"
WEBHOOK_SECRET="$(printf '%s' "$WEBHOOK_SECRET" | tr -d '\r\n')"
# In all-in-one mode, localhost origins are expected for inter-service communication
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://app.azeeboplus.com,https://admin.azeeboplus.com,https://creator.azeeboplus.com}"
REDIS_URL_VAL="redis://:${REDIS_PASSWORD}@127.0.0.1:6379"

# Service URLs (all services run on localhost in all-in-one mode)
export AUTH_SERVICE_URL="http://localhost:3000"
export USER_SERVICE_URL="http://localhost:3001"
export WALLET_SERVICE_URL="http://localhost:3002"
export PAYMENT_SERVICE_URL="http://localhost:3003"
export CONTENT_SERVICE_URL="http://localhost:3004"
export SEARCH_SERVICE_URL="http://localhost:3005"
export NOTIFICATION_SERVICE_URL="http://localhost:3006"
export REWARD_SERVICE_URL="http://localhost:3007"
export ANALYTICS_SERVICE_URL="http://localhost:3008"
export RECOMMENDATION_SERVICE_URL="http://localhost:3009"
export REALITY_SERVICE_URL="http://localhost:3010"
export MOVIE_SERVICE_URL="http://localhost:3011"
export COMEDY_SERVICE_URL="http://localhost:3012"
export API_GATEWAY_URL="http://localhost:3013"
export GAMES_SERVICE_URL="http://localhost:3014"
export QUEUE_SERVICE_URL="http://localhost:3015"
export LIFESTYLE_SERVICE_URL="http://localhost:3016"
export VERTICAL_SERVICE_URL="http://localhost:3017"
export CREATOR_SERVICE_URL="http://localhost:3018"
export CREATOR_APP_URL="http://localhost:4014"
export ADMIN_SERVICE_URL="http://localhost:4016"
export MEDIA_SERVICE_URL="http://localhost:3019"
export SUPPORT_SERVICE_URL="http://localhost:3020"
export SPORTS_SERVICE_URL="http://localhost:3021"
export MODERATION_SERVICE_URL="http://localhost:3022"
export ENGAGEMENT_SERVICE_URL="http://localhost:3023"
export MESSAGING_SERVICE_URL="http://localhost:3024"
export REFERRAL_SERVICE_URL="http://localhost:3025"
export SUBSCRIPTION_SERVICE_URL="http://localhost:3026"

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r svc_name db_user db_pass db_name port <<< "$entry"
  svc_path="${SVC_PATHS[$svc_name]}"
  main_js="${svc_path}/dist/main.js"

  cat > "/app/service-wrappers/${svc_name}.sh" << WRAPPER
#!/bin/bash
export ALL_IN_ONE="true"
export DATABASE_URL="postgresql://${db_user}:${db_pass}@127.0.0.1:5432/${db_name}?schema=public"
export DATABASE_PASSWORD="${db_pass}"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_USER="${db_user}"
export DATABASE_NAME="${db_name}"
export PORT="${port}"
export NODE_ENV="production"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
export GATEWAY_SECRET="${GATEWAY_SECRET}"
export WEBHOOK_SECRET="${WEBHOOK_SECRET}"
export JWT_ISSUER="${JWT_ISSUER:-azeebo-auth}"
export JWT_AUDIENCE="${JWT_AUDIENCE:-azeebo-api}"
export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-30m}"
export JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN:-7d}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export REDIS_URL="${REDIS_URL_VAL}"
export EVENT_BUS_REDIS_URL="${EVENT_BUS_REDIS_URL:-redis://:${REDIS_PASSWORD}@127.0.0.1:6379}"
export FEATURE_FLAG_REDIS_URL="${FEATURE_FLAG_REDIS_URL:-redis://:${REDIS_PASSWORD}@127.0.0.1:6379}"
export API_GATEWAY_URL="${API_GATEWAY_URL}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL}"
export USER_SERVICE_URL="${USER_SERVICE_URL}"
export WALLET_SERVICE_URL="${WALLET_SERVICE_URL}"
export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}"
export REWARD_SERVICE_URL="${REWARD_SERVICE_URL}"
export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL}"
export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL}"
export REALITY_SERVICE_URL="${REALITY_SERVICE_URL}"
export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL}"
export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL}"
export GAMES_SERVICE_URL="${GAMES_SERVICE_URL}"
export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL}"
export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL}"
export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL}"
export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL}"
export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL}"
export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL}"
export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL}"
export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL}"
export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL}"
export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL}"
export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL}"
export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL}"
export PAYSTACK_SECRET_KEY="${PAYSTACK_SECRET_KEY:-}"
export PAYSTACK_WEBHOOK_SECRET="${PAYSTACK_WEBHOOK_SECRET:-}"
export FLUTTERWAVE_SECRET_KEY="${FLW_SECRET_KEY:-}"
export FLUTTERWAVE_WEBHOOK_SECRET="${FLW_WEBHOOK_SECRET:-}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"
export TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
export TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
export TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"
export NODE_OPTIONS="--max-old-space-size=512"
if [ "$svc_name" = "auth-service" ]; then
  /app/service-wrappers/auth-service-flush.sh || true
fi
exec node /app/${main_js}
WRAPPER
  chmod +x "/app/service-wrappers/${svc_name}.sh"
done

# Flush stale rate limit keys on auth-service startup
cat > /app/service-wrappers/auth-service-flush.sh << 'FLUSH'
#!/bin/bash
# Wait for Redis to be ready, then flush rate limit keys
for i in $(seq 1 30); do
  if redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning keys "rate_limit:*" | xargs -r redis-cli -a "$REDIS_PASSWORD" --no-auth-warning del >/dev/null 2>&1
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning keys "ratelimit:*" | xargs -r redis-cli -a "$REDIS_PASSWORD" --no-auth-warning del >/dev/null 2>&1
    echo "    Flushed stale rate limit keys from Redis"
    exit 0
  fi
  sleep 1
done
echo "    WARNING: Could not flush rate limit keys (Redis not ready)"
FLUSH
chmod +x /app/service-wrappers/auth-service-flush.sh

# API gateway wrapper (routes to services)
cat > /app/service-wrappers/api-gateway.sh << WRAPPER
#!/bin/bash
export ALL_IN_ONE="true"
export NODE_ENV="production"
export NODE_OPTIONS="--max-old-space-size=512"
export PORT="3013"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export GATEWAY_SECRET="${GATEWAY_SECRET}"
export REDIS_URL="${REDIS_URL_VAL}"
export EVENT_BUS_REDIS_URL="${EVENT_BUS_REDIS_URL:-redis://:${REDIS_PASSWORD}@127.0.0.1:6379}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export API_GATEWAY_URL="${API_GATEWAY_URL}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL}"
export USER_SERVICE_URL="${USER_SERVICE_URL}"
export WALLET_SERVICE_URL="${WALLET_SERVICE_URL}"
export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}"
export REWARD_SERVICE_URL="${REWARD_SERVICE_URL}"
export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL}"
export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL}"
export REALITY_SERVICE_URL="${REALITY_SERVICE_URL}"
export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL}"
export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL}"
export GAMES_SERVICE_URL="${GAMES_SERVICE_URL}"
export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL}"
export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL}"
export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL}"
export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL}"
export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL}"
export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL}"
export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL}"
export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL}"
export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL}"
export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL}"
export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL}"
export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL}"
export PAYSTACK_SECRET_KEY="${PAYSTACK_SECRET_KEY:-}"
export PAYSTACK_WEBHOOK_SECRET="${PAYSTACK_WEBHOOK_SECRET:-}"
export FLUTTERWAVE_SECRET_KEY="${FLW_SECRET_KEY:-}"
export FLUTTERWAVE_WEBHOOK_SECRET="${FLW_WEBHOOK_SECRET:-}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"
export TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
export TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
export TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"
cd /app/services/gateway/api-gateway
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/api-gateway.sh

# Admin app wrapper
cat > /app/service-wrappers/admin-app.sh << WRAPPER
#!/bin/bash
export ALL_IN_ONE="true"
export NODE_OPTIONS="--max-old-space-size=512"
export DATABASE_URL="postgresql://azeebo:${ADMIN_DB_PASSWORD}@127.0.0.1:5432/azeebo_admin?schema=public"
export DATABASE_PASSWORD="${ADMIN_DB_PASSWORD}"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_USER="azeebo"
export DATABASE_NAME="azeebo_admin"
export PORT="4016"
export NODE_ENV="production"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export GATEWAY_SECRET="${GATEWAY_SECRET}"
export API_GATEWAY_URL="${API_GATEWAY_URL}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL}"
export USER_SERVICE_URL="${USER_SERVICE_URL}"
export WALLET_SERVICE_URL="${WALLET_SERVICE_URL}"
export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}"
export REWARD_SERVICE_URL="${REWARD_SERVICE_URL}"
export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL}"
export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL}"
export REALITY_SERVICE_URL="${REALITY_SERVICE_URL}"
export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL}"
export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL}"
export GAMES_SERVICE_URL="${GAMES_SERVICE_URL}"
export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL}"
export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL}"
export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL}"
export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL}"
export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL}"
export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL}"
export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL}"
export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL}"
export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL}"
export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL}"
export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL}"
export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL}"
export PAYSTACK_SECRET_KEY="${PAYSTACK_SECRET_KEY:-}"
export PAYSTACK_WEBHOOK_SECRET="${PAYSTACK_WEBHOOK_SECRET:-}"
export FLUTTERWAVE_SECRET_KEY="${FLW_SECRET_KEY:-}"
export FLUTTERWAVE_WEBHOOK_SECRET="${FLW_WEBHOOK_SECRET:-}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"
export TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
export TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
export TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"
cd /app/apps/admin
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/admin-app.sh

# Creator portal wrapper
cat > /app/service-wrappers/creator-app.sh << WRAPPER
#!/bin/bash
export ALL_IN_ONE="true"
export NODE_OPTIONS="--max-old-space-size=512"
export DATABASE_URL="postgresql://azeebo:${CREATOR_DB_PASSWORD}@127.0.0.1:5432/azeebo_creator?schema=public"
export DATABASE_PASSWORD="${CREATOR_DB_PASSWORD}"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_USER="azeebo"
export DATABASE_NAME="azeebo_creator"
export PORT="4014"
export NODE_ENV="production"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export GATEWAY_SECRET="${GATEWAY_SECRET}"
export CREATOR_ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export API_GATEWAY_URL="${API_GATEWAY_URL}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL}"
export USER_SERVICE_URL="${USER_SERVICE_URL}"
export WALLET_SERVICE_URL="${WALLET_SERVICE_URL}"
export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}"
export REWARD_SERVICE_URL="${REWARD_SERVICE_URL}"
export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL}"
export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL}"
export REALITY_SERVICE_URL="${REALITY_SERVICE_URL}"
export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL}"
export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL}"
export GAMES_SERVICE_URL="${GAMES_SERVICE_URL}"
export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL}"
export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL}"
export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL}"
export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL}"
export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL}"
export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL}"
export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL}"
export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL}"
export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL}"
export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL}"
export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL}"
export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL}"
export PAYSTACK_SECRET_KEY="${PAYSTACK_SECRET_KEY:-}"
export PAYSTACK_WEBHOOK_SECRET="${PAYSTACK_WEBHOOK_SECRET:-}"
export FLUTTERWAVE_SECRET_KEY="${FLW_SECRET_KEY:-}"
export FLUTTERWAVE_WEBHOOK_SECRET="${FLW_WEBHOOK_SECRET:-}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"
export TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
export TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
export TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"
cd /app/apps/creator
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/creator-app.sh

# Web app wrapper (standalone mode)
cat > /app/service-wrappers/web-app.sh << WRAPPER
#!/bin/bash
export ALL_IN_ONE="true"
export NODE_ENV="production"
export NODE_OPTIONS="--max-old-space-size=512"
export PORT="4000"
export HOSTNAME="0.0.0.0"
export API_GATEWAY_URL="${API_GATEWAY_URL}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL}"
export USER_SERVICE_URL="${USER_SERVICE_URL}"
export WALLET_SERVICE_URL="${WALLET_SERVICE_URL}"
export PAYMENT_SERVICE_URL="${PAYMENT_SERVICE_URL}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}"
export REWARD_SERVICE_URL="${REWARD_SERVICE_URL}"
export ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL}"
export RECOMMENDATION_SERVICE_URL="${RECOMMENDATION_SERVICE_URL}"
export REALITY_SERVICE_URL="${REALITY_SERVICE_URL}"
export MOVIE_SERVICE_URL="${MOVIE_SERVICE_URL}"
export COMEDY_SERVICE_URL="${COMEDY_SERVICE_URL}"
export GAMES_SERVICE_URL="${GAMES_SERVICE_URL}"
export QUEUE_SERVICE_URL="${QUEUE_SERVICE_URL}"
export LIFESTYLE_SERVICE_URL="${LIFESTYLE_SERVICE_URL}"
export VERTICAL_SERVICE_URL="${VERTICAL_SERVICE_URL}"
export CREATOR_SERVICE_URL="${CREATOR_SERVICE_URL}"
export MEDIA_SERVICE_URL="${MEDIA_SERVICE_URL}"
export SUPPORT_SERVICE_URL="${SUPPORT_SERVICE_URL}"
export SPORTS_SERVICE_URL="${SPORTS_SERVICE_URL}"
export MODERATION_SERVICE_URL="${MODERATION_SERVICE_URL}"
export ENGAGEMENT_SERVICE_URL="${ENGAGEMENT_SERVICE_URL}"
export MESSAGING_SERVICE_URL="${MESSAGING_SERVICE_URL}"
export REFERRAL_SERVICE_URL="${REFERRAL_SERVICE_URL}"
export SUBSCRIPTION_SERVICE_URL="${SUBSCRIPTION_SERVICE_URL}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}}"
export PAYSTACK_SECRET_KEY="${PAYSTACK_SECRET_KEY:-}"
export PAYSTACK_WEBHOOK_SECRET="${PAYSTACK_WEBHOOK_SECRET:-}"
export FLUTTERWAVE_SECRET_KEY="${FLW_SECRET_KEY:-}"
export FLUTTERWAVE_WEBHOOK_SECRET="${FLW_WEBHOOK_SECRET:-}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-}"
export TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
export TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
export TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"
# Verify standalone server exists before trying to start
if [ ! -f /app/apps/web/standalone/server.js ]; then
  echo "ERROR: /app/apps/web/standalone/server.js not found!"
  echo "  Listing /app/apps/web/ directory:"
  ls -la /app/apps/web/ 2>&1 || echo "  /app/apps/web/ does not exist"
  echo "  Listing /app/apps/ directory:"
  ls -la /app/apps/ 2>&1 || echo "  /app/apps/ does not exist"
  echo "  The web app will not start until this file is present."
  echo "  This usually means the Docker image was built without the Next.js standalone output."
  sleep infinity
fi
cd /app/apps/web/standalone
exec node server.js
WRAPPER
chmod +x /app/service-wrappers/web-app.sh

echo "==> Wrapper scripts generated."

# ============================================================
# 11. Generate SSL certificates (self-signed for internal use)
# ============================================================
echo "==> Generating SSL certificates..."
mkdir -p /app/certs

SSL_DOMAIN="${SSL_DOMAIN:-localhost}"
SSL_DAYS="${SSL_DAYS:-365}"

if [ ! -f /app/certs/server.crt ] || [ ! -f /app/certs/server.key ]; then
  openssl req -x509 -nodes -days "$SSL_DAYS" \
    -newkey rsa:2048 \
    -keyout /app/certs/server.key \
    -out /app/certs/server.crt \
    -subj "/C=NG/ST=Lagos/L=Lagos/O=Azeebo+/CN=$SSL_DOMAIN" \
    -addext "subjectAltName=DNS:$SSL_DOMAIN,DNS:localhost,DNS:*.azeeboplus.com,IP:127.0.0.1" \
    2>&1
  chmod 600 /app/certs/server.key
  chmod 644 /app/certs/server.crt
  echo "    SSL certificate generated for $SSL_DOMAIN (valid $SSL_DAYS days)."
else
  echo "    SSL certificates already exist, skipping generation."
fi

# ============================================================
# 12. Hand off to supervisord
# ============================================================
echo "==> Starting supervisord (manages all processes)..."

# Log memory status before starting services
echo "==> System memory status:"
free -h || cat /proc/meminfo | head -5

exec /usr/bin/supervisord -c /etc/supervisord.conf
