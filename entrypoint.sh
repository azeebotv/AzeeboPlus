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
POSTGRES_DB="${POSTGRES_DB:-azeebo_plus}"
REDIS_PASSWORD="${REDIS_PASSWORD:?REDIS_PASSWORD is required}"

echo "==> Starting Azeebo+ all-in-one container..."

# ============================================================
# 1. Initialize PostgreSQL if empty
# ============================================================
if [ ! -f "$POSTGRES_DATA/PG_VERSION" ]; then
  echo "==> Initializing PostgreSQL data directory..."
  mkdir -p "$POSTGRES_DATA"
  chown -R postgres:postgres "$POSTGRES_DATA"
  su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D $POSTGRES_DATA --encoding=UTF8 --locale=C"
fi

# Configure PostgreSQL
chown -R postgres:postgres "$POSTGRES_DATA"
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
host    all   all  127.0.0.1/32   trust
host    all   all  ::1/128        trust
PGHBA

# ============================================================
# 2. Start PostgreSQL temporarily
# ============================================================
echo "==> Starting PostgreSQL temporarily..."
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $POSTGRES_DATA -l /var/log/postgresql/postgresql-temp.log start -w"

# Wait for PostgreSQL to be ready
for i in $(seq 1 30); do
  if su - postgres -c "pg_isready -h localhost -p 5432" > /dev/null 2>&1; then
    echo "==> PostgreSQL is ready."
    break
  fi
  echo "    Waiting for PostgreSQL... ($i/30)"
  sleep 1
done

# ============================================================
# 3. Create superuser and default database
# ============================================================
echo "==> Configuring PostgreSQL user and database..."
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';\"" || true
su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'\" | grep -q 1" || \
  su - postgres -c "psql -c \"CREATE USER $POSTGRES_USER WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';\""
su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'\" | grep -q 1" || \
  su - postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""

# ============================================================
# 4. Create all service databases
# ============================================================
echo "==> Creating service databases..."

DBS=(
  "auth_db:auth_user:${AUTH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "user_db:user_user:${USER_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "wallet_db:wallet_user:${WALLET_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "payment_db:payment_user:${PAYMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "content_db:content_user:${CONTENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "search_db:search_user:${SEARCH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "notification_db:notification_user:${NOTIFICATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "reward_db:reward_user:${REWARD_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "analytics_db:analytics_user:${ANALYTICS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "recommendation_db:recommendation_user:${RECOMMENDATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "reality_db:reality_user:${REALITY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "movie_db:movie_user:${MOVIE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "comedy_db:comedy_user:${COMEDY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "games_db:games_user:${GAMES_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "queue_db:queue_user:${QUEUE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "lifestyle_db:lifestyle_user:${LIFESTYLE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "vertical_db:vertical_user:${VERTICAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "creator_db:creator_user:${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "media_db:media_user:${MEDIA_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "support_db:support_user:${SUPPORT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "sports_db:sports_user:${SPORTS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "moderation_db:moderation_user:${MODERATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "engagement_db:engagement_user:${ENGAGEMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "messaging_db:messaging_user:${MESSAGING_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "referral_db:referral_user:${REFERRAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "subscription_db:subscription_user:${SUBSCRIPTION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "admin_db:admin_user:${ADMIN_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "creator_portal_db:creator_portal_user:${CREATOR_PORTAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
)

for entry in "${DBS[@]}"; do
  IFS=':' read -r db_name db_user db_pass <<< "$entry"

  # Create user
  su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='$db_user'\" | grep -q 1" || \
    su - postgres -c "psql -c \"CREATE USER $db_user WITH PASSWORD '$db_pass';\""
  echo "    User $db_user ready."

  # Create database
  su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='$db_name'\" | grep -q 1" || \
    su - postgres -c "psql -c \"CREATE DATABASE $db_name OWNER $db_user;\""
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
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
requirepass $REDIS_PASSWORD
dir /var/lib/redis
 logfile ""
REDISCONF
mkdir -p /var/lib/redis
chown -R redis:redis /var/lib/redis

# ============================================================
# 6. Configure PgBouncer
# ============================================================
echo "==> Configuring PgBouncer..."
mkdir -p /etc/pgbouncer /var/log/pgbouncer /var/run/pgbouncer
cat > /etc/pgbouncer/pgbouncer.ini << PGBOUNCERINI
[databases]
$POSTGRES_DB = host=127.0.0.1 port=5432 dbname=$POSTGRES_DB
auth_db = host=127.0.0.1 port=5432 dbname=auth_db
user_db = host=127.0.0.1 port=5432 dbname=user_db
wallet_db = host=127.0.0.1 port=5432 dbname=wallet_db
payment_db = host=127.0.0.1 port=5432 dbname=payment_db
content_db = host=127.0.0.1 port=5432 dbname=content_db
search_db = host=127.0.0.1 port=5432 dbname=search_db
notification_db = host=127.0.0.1 port=5432 dbname=notification_db
reward_db = host=127.0.0.1 port=5432 dbname=reward_db
analytics_db = host=127.0.0.1 port=5432 dbname=analytics_db
recommendation_db = host=127.0.0.1 port=5432 dbname=recommendation_db
reality_db = host=127.0.0.1 port=5432 dbname=reality_db
movie_db = host=127.0.0.1 port=5432 dbname=movie_db
comedy_db = host=127.0.0.1 port=5432 dbname=comedy_db
games_db = host=127.0.0.1 port=5432 dbname=games_db
queue_db = host=127.0.0.1 port=5432 dbname=queue_db
lifestyle_db = host=127.0.0.1 port=5432 dbname=lifestyle_db
vertical_db = host=127.0.0.1 port=5432 dbname=vertical_db
creator_db = host=127.0.0.1 port=5432 dbname=creator_db
media_db = host=127.0.0.1 port=5432 dbname=media_db
support_db = host=127.0.0.1 port=5432 dbname=support_db
sports_db = host=127.0.0.1 port=5432 dbname=sports_db
moderation_db = host=127.0.0.1 port=5432 dbname=moderation_db
engagement_db = host=127.0.0.1 port=5432 dbname=engagement_db
messaging_db = host=127.0.0.1 port=5432 dbname=messaging_db
referral_db = host=127.0.0.1 port=5432 dbname=referral_db
subscription_db = host=127.0.0.1 port=5432 dbname=subscription_db
admin_db = host=127.0.0.1 port=5432 dbname=admin_db
creator_portal_db = host=127.0.0.1 port=5432 dbname=creator_portal_db

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = trust
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
chown -R pgbouncer:pgbouncer /var/run/pgbouncer

# ============================================================
# 7. Run Prisma migrations
# ============================================================
echo "==> Running Prisma migrations..."

MIGRATE_SERVICES=(
  "services/core/auth-service:auth-service:auth_db:auth_user:${AUTH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/user-service:user-service:user_db:user_user:${USER_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/wallet-service:wallet-service:wallet_db:wallet_user:${WALLET_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/payment-service:payment-service:payment_db:payment_user:${PAYMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/content-service:content-service:content_db:content_user:${CONTENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/core/search-service:search-service:search_db:search_user:${SEARCH_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/notification-service:notification-service:notification_db:notification_user:${NOTIFICATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/reward-service:reward-service:reward_db:reward_user:${REWARD_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/intelligence/analytics-service:analytics-service:analytics_db:analytics_user:${ANALYTICS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/intelligence/recommendation-service:recommendation-service:recommendation_db:recommendation_user:${RECOMMENDATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/reality-service:reality-service:reality_db:reality_user:${REALITY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/movie-service:movie-service:movie_db:movie_user:${MOVIE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/comedy-service:comedy-service:comedy_db:comedy_user:${COMEDY_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/games-service:games-service:games_db:games_user:${GAMES_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/queue-service:queue-service:queue_db:queue_user:${QUEUE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/lifestyle-service:lifestyle-service:lifestyle_db:lifestyle_user:${LIFESTYLE_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/vertical-service:vertical-service:vertical_db:vertical_user:${VERTICAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/creator-service:creator-service:creator_db:creator_user:${CREATOR_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/support-service:support-service:support_db:support_user:${SUPPORT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/universes/sports-service:sports-service:sports_db:sports_user:${SPORTS_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/operations/moderation-service:moderation-service:moderation_db:moderation_user:${MODERATION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/engagement-service:engagement-service:engagement_db:engagement_user:${ENGAGEMENT_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/messaging-service:messaging-service:messaging_db:messaging_user:${MESSAGING_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/referral-service:referral-service:referral_db:referral_user:${REFERRAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"
  "services/engagement/subscription-service:subscription-service:subscription_db:subscription_user:${SUBSCRIPTION_DB_PASSWORD:-$POSTGRES_PASSWORD}"
)

for entry in "${MIGRATE_SERVICES[@]}"; do
  IFS=':' read -r svc_dir svc_name db_name db_user db_pass <<< "$entry"
  echo "    Migrating $svc_name..."

  DATABASE_URL="postgresql://$db_user:$db_pass@127.0.0.1:5432/$db_name?schema=public" \
    pnpm exec prisma migrate deploy --schema="$svc_dir/prisma/schema.prisma" 2>&1 || \
    echo "    WARNING: Migration failed for $svc_name (may not have migrations yet)"
done

# ============================================================
# 8. Stop temporary PostgreSQL (supervisord will restart it)
# ============================================================
echo "==> Stopping temporary PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $POSTGRES_DATA stop -m fast" || true

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
CREATOR_PORTAL_DB_PASSWORD="${CREATOR_PORTAL_DB_PASSWORD:-$POSTGRES_PASSWORD}"

# Export DATABASE_URL for each service
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?schema=public"
export AUTH_DATABASE_URL="postgresql://auth_user:${AUTH_DB_PASSWORD}@127.0.0.1:5432/auth_db?schema=public"
export USER_DATABASE_URL="postgresql://user_user:${USER_DB_PASSWORD}@127.0.0.1:5432/user_db?schema=public"
export WALLET_DATABASE_URL="postgresql://wallet_user:${WALLET_DB_PASSWORD}@127.0.0.1:5432/wallet_db?schema=public"
export PAYMENT_DATABASE_URL="postgresql://payment_user:${PAYMENT_DB_PASSWORD}@127.0.0.1:5432/payment_db?schema=public"
export CONTENT_DATABASE_URL="postgresql://content_user:${CONTENT_DB_PASSWORD}@127.0.0.1:5432/content_db?schema=public"
export SEARCH_DATABASE_URL="postgresql://search_user:${SEARCH_DB_PASSWORD}@127.0.0.1:5432/search_db?schema=public"
export NOTIFICATION_DATABASE_URL="postgresql://notification_user:${NOTIFICATION_DB_PASSWORD}@127.0.0.1:5432/notification_db?schema=public"
export REWARD_DATABASE_URL="postgresql://reward_user:${REWARD_DB_PASSWORD}@127.0.0.1:5432/reward_db?schema=public"
export ANALYTICS_DATABASE_URL="postgresql://analytics_user:${ANALYTICS_DB_PASSWORD}@127.0.0.1:5432/analytics_db?schema=public"
export RECOMMENDATION_DATABASE_URL="postgresql://recommendation_user:${RECOMMENDATION_DB_PASSWORD}@127.0.0.1:5432/recommendation_db?schema=public"
export REALITY_DATABASE_URL="postgresql://reality_user:${REALITY_DB_PASSWORD}@127.0.0.1:5432/reality_db?schema=public"
export MOVIE_DATABASE_URL="postgresql://movie_user:${MOVIE_DB_PASSWORD}@127.0.0.1:5432/movie_db?schema=public"
export COMEDY_DATABASE_URL="postgresql://comedy_user:${COMEDY_DB_PASSWORD}@127.0.0.1:5432/comedy_db?schema=public"
export GAMES_DATABASE_URL="postgresql://games_user:${GAMES_DB_PASSWORD}@127.0.0.1:5432/games_db?schema=public"
export QUEUE_DATABASE_URL="postgresql://queue_user:${QUEUE_DB_PASSWORD}@127.0.0.1:5432/queue_db?schema=public"
export LIFESTYLE_DATABASE_URL="postgresql://lifestyle_user:${LIFESTYLE_DB_PASSWORD}@127.0.0.1:5432/lifestyle_db?schema=public"
export VERTICAL_DATABASE_URL="postgresql://vertical_user:${VERTICAL_DB_PASSWORD}@127.0.0.1:5432/vertical_db?schema=public"
export CREATOR_DATABASE_URL="postgresql://creator_user:${CREATOR_DB_PASSWORD}@127.0.0.1:5432/creator_db?schema=public"
export MEDIA_DATABASE_URL="postgresql://media_user:${MEDIA_DB_PASSWORD}@127.0.0.1:5432/media_db?schema=public"
export SUPPORT_DATABASE_URL="postgresql://support_user:${SUPPORT_DB_PASSWORD}@127.0.0.1:5432/support_db?schema=public"
export SPORTS_DATABASE_URL="postgresql://sports_user:${SPORTS_DB_PASSWORD}@127.0.0.1:5432/sports_db?schema=public"
export MODERATION_DATABASE_URL="postgresql://moderation_user:${MODERATION_DB_PASSWORD}@127.0.0.1:5432/moderation_db?schema=public"
export ENGAGEMENT_DATABASE_URL="postgresql://engagement_user:${ENGAGEMENT_DB_PASSWORD}@127.0.0.1:5432/engagement_db?schema=public"
export MESSAGING_DATABASE_URL="postgresql://messaging_user:${MESSAGING_DB_PASSWORD}@127.0.0.1:5432/messaging_db?schema=public"
export REFERRAL_DATABASE_URL="postgresql://referral_user:${REFERRAL_DB_PASSWORD}@127.0.0.1:5432/referral_db?schema=public"
export SUBSCRIPTION_DATABASE_URL="postgresql://subscription_user:${SUBSCRIPTION_DB_PASSWORD}@127.0.0.1:5432/subscription_db?schema=public"
export ADMIN_DATABASE_URL="postgresql://admin_user:${ADMIN_DB_PASSWORD}@127.0.0.1:5432/admin_db?schema=public"
export CREATOR_PORTAL_DATABASE_URL="postgresql://creator_portal_user:${CREATOR_PORTAL_DB_PASSWORD}@127.0.0.1:5432/creator_portal_db?schema=public"

echo "==> Environment variables configured."

# ============================================================
# 10. Generate wrapper scripts for each service
# ============================================================
echo "==> Generating service wrapper scripts..."

mkdir -p /app/service-wrappers

# Generate a wrapper for each NestJS service
# Format: service_name:db_user:db_password:db_name:port
SERVICES=(
  "auth-service:auth_user:${AUTH_DB_PASSWORD}:auth_db:3000"
  "user-service:user_user:${USER_DB_PASSWORD}:user_db:3001"
  "wallet-service:wallet_user:${WALLET_DB_PASSWORD}:wallet_db:3002"
  "payment-service:payment_user:${PAYMENT_DB_PASSWORD}:payment_db:3003"
  "content-service:content_user:${CONTENT_DB_PASSWORD}:content_db:3004"
  "search-service:search_user:${SEARCH_DB_PASSWORD}:search_db:3005"
  "notification-service:notification_user:${NOTIFICATION_DB_PASSWORD}:notification_db:3006"
  "reward-service:reward_user:${REWARD_DB_PASSWORD}:reward_db:3007"
  "analytics-service:analytics_user:${ANALYTICS_DB_PASSWORD}:analytics_db:3008"
  "recommendation-service:recommendation_user:${RECOMMENDATION_DB_PASSWORD}:recommendation_db:3009"
  "reality-service:reality_user:${REALITY_DB_PASSWORD}:reality_db:3010"
  "movie-service:movie_user:${MOVIE_DB_PASSWORD}:movie_db:3011"
  "comedy-service:comedy_user:${COMEDY_DB_PASSWORD}:comedy_db:3012"
  "api-gateway:api_user:${POSTGRES_PASSWORD:-placeholder}:api_db:3013"
  "games-service:games_user:${GAMES_DB_PASSWORD}:games_db:3014"
  "queue-service:queue_user:${QUEUE_DB_PASSWORD}:queue_db:3015"
  "lifestyle-service:lifestyle_user:${LIFESTYLE_DB_PASSWORD}:lifestyle_db:3016"
  "vertical-service:vertical_user:${VERTICAL_DB_PASSWORD}:vertical_db:3017"
  "creator-service:creator_user:${CREATOR_DB_PASSWORD}:creator_db:3018"
  "media-service:media_user:${MEDIA_DB_PASSWORD}:media_db:3019"
  "support-service:support_user:${SUPPORT_DB_PASSWORD}:support_db:3020"
  "sports-service:sports_user:${SPORTS_DB_PASSWORD}:sports_db:3021"
  "moderation-service:moderation_user:${MODERATION_DB_PASSWORD}:moderation_db:3022"
  "engagement-service:engagement_user:${ENGAGEMENT_DB_PASSWORD}:engagement_db:3023"
  "messaging-service:messaging_user:${MESSAGING_DB_PASSWORD}:messaging_db:3024"
  "referral-service:referral_user:${REFERRAL_DB_PASSWORD}:referral_db:3025"
  "subscription-service:subscription_user:${SUBSCRIPTION_DB_PASSWORD}:subscription_db:3026"
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
SVC_PATHS[queue-service]="services/operations/queue-service"
SVC_PATHS[support-service]="services/operations/support-service"
SVC_PATHS[moderation-service]="services/operations/moderation-service"
SVC_PATHS[api-gateway]="services/gateway/api-gateway"

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r svc_name db_user db_pass db_name port <<< "$entry"
  svc_path="${SVC_PATHS[$svc_name]}"
  main_js="${svc_path}/dist/main.js"

  cat > "/app/service-wrappers/${svc_name}.sh" << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://${db_user}:${db_pass}@127.0.0.1:5432/${db_name}?schema=public"
export PORT="${port}"
export NODE_ENV="production"
exec node /app/${main_js}
WRAPPER
  chmod +x "/app/service-wrappers/${svc_name}.sh"
done

# API gateway wrapper (no database, just service URLs)
cat > /app/service-wrappers/api-gateway.sh << 'WRAPPER'
#!/bin/bash
export NODE_ENV="production"
export PORT="3013"
cd /app/services/gateway/api-gateway
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/api-gateway.sh

# Admin app wrapper
cat > /app/service-wrappers/admin-app.sh << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://admin_user:${ADMIN_DB_PASSWORD}@127.0.0.1:5432/admin_db?schema=public"
export PORT="4016"
export NODE_ENV="production"
cd /app/apps/admin
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/admin-app.sh

# Creator portal wrapper
cat > /app/service-wrappers/creator-portal-app.sh << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://creator_portal_user:${CREATOR_PORTAL_DB_PASSWORD}@127.0.0.1:5432/creator_portal_db?schema=public"
export PORT="4014"
export NODE_ENV="production"
cd /app/apps/creator-portal
exec node dist/main.js
WRAPPER
chmod +x /app/service-wrappers/creator-portal-app.sh

# Web app wrapper
cat > /app/service-wrappers/web-app.sh << WRAPPER
#!/bin/bash
export NODE_ENV="production"
export PORT="4000"
export API_GATEWAY_URL="http://localhost:3013"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}"
cd /app/apps/web
exec pnpm exec next start -p 4000
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
exec /usr/bin/supervisord -c /etc/supervisord.conf
