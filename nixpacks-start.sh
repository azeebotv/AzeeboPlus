#!/bin/bash
# ============================================================
# Azeebo+ Nixpacks Startup Script
# ============================================================
# Runs inside the Nixpacks container after build.
# Waits for external PostgreSQL/Redis (Coolify-managed),
# runs Prisma migrations, generates per-service wrapper
# scripts, then starts all services with auto-restart.
#
# Required environment variables (set in Coolify UI):
#   POSTGRES_HOST     — Coolify PostgreSQL hostname
#   POSTGRES_PORT     — default 5432
#   POSTGRES_USER     — PostgreSQL user
#   POSTGRES_PASSWORD — PostgreSQL password
#   POSTGRES_DB       — main database name
#   REDIS_URL         — Coolify Redis connection URL
#   JWT_ACCESS_SECRET
#   JWT_REFRESH_SECRET
# ============================================================
set -e

echo "==> Azeebo+ Nixpacks starting..."

# ============================================================
# 1. Resolve connection details
# ============================================================
DB_HOST="${POSTGRES_HOST:?POSTGRES_HOST is required}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:?POSTGRES_USER is required}"
DB_PASS="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
DB_NAME="${POSTGRES_DB:-azeebo_plus}"

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# ============================================================
# 2. Wait for PostgreSQL
# ============================================================
echo "==> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
for i in $(seq 1 60); do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "==> PostgreSQL is ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: PostgreSQL not ready after 60s."
    exit 1
  fi
  sleep 1
done

# ============================================================
# 3. Wait for Redis
# ============================================================
if [ -n "$REDIS_URL" ]; then
  echo "==> Waiting for Redis..."
  for i in $(seq 1 30); do
    if redis-cli -h "${REDIS_HOST:-redis}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
      echo "==> Redis is ready."
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "WARNING: Redis not ready, continuing anyway..."
    fi
    sleep 1
  done
fi

# ============================================================
# 4. Set default DB passwords (all default to POSTGRES_PASSWORD)
# ============================================================
AUTH_DB_PASSWORD="${AUTH_DB_PASSWORD:-$DB_PASS}"
USER_DB_PASSWORD="${USER_DB_PASSWORD:-$DB_PASS}"
WALLET_DB_PASSWORD="${WALLET_DB_PASSWORD:-$DB_PASS}"
PAYMENT_DB_PASSWORD="${PAYMENT_DB_PASSWORD:-$DB_PASS}"
CONTENT_DB_PASSWORD="${CONTENT_DB_PASSWORD:-$DB_PASS}"
SEARCH_DB_PASSWORD="${SEARCH_DB_PASSWORD:-$DB_PASS}"
NOTIFICATION_DB_PASSWORD="${NOTIFICATION_DB_PASSWORD:-$DB_PASS}"
REWARD_DB_PASSWORD="${REWARD_DB_PASSWORD:-$DB_PASS}"
ANALYTICS_DB_PASSWORD="${ANALYTICS_DB_PASSWORD:-$DB_PASS}"
RECOMMENDATION_DB_PASSWORD="${RECOMMENDATION_DB_PASSWORD:-$DB_PASS}"
REALITY_DB_PASSWORD="${REALITY_DB_PASSWORD:-$DB_PASS}"
MOVIE_DB_PASSWORD="${MOVIE_DB_PASSWORD:-$DB_PASS}"
COMEDY_DB_PASSWORD="${COMEDY_DB_PASSWORD:-$DB_PASS}"
GAMES_DB_PASSWORD="${GAMES_DB_PASSWORD:-$DB_PASS}"
QUEUE_DB_PASSWORD="${QUEUE_DB_PASSWORD:-$DB_PASS}"
LIFESTYLE_DB_PASSWORD="${LIFESTYLE_DB_PASSWORD:-$DB_PASS}"
VERTICAL_DB_PASSWORD="${VERTICAL_DB_PASSWORD:-$DB_PASS}"
CREATOR_DB_PASSWORD="${CREATOR_DB_PASSWORD:-$DB_PASS}"
MEDIA_DB_PASSWORD="${MEDIA_DB_PASSWORD:-$DB_PASS}"
SUPPORT_DB_PASSWORD="${SUPPORT_DB_PASSWORD:-$DB_PASS}"
SPORTS_DB_PASSWORD="${SPORTS_DB_PASSWORD:-$DB_PASS}"
MODERATION_DB_PASSWORD="${MODERATION_DB_PASSWORD:-$DB_PASS}"
ENGAGEMENT_DB_PASSWORD="${ENGAGEMENT_DB_PASSWORD:-$DB_PASS}"
MESSAGING_DB_PASSWORD="${MESSAGING_DB_PASSWORD:-$DB_PASS}"
REFERRAL_DB_PASSWORD="${REFERRAL_DB_PASSWORD:-$DB_PASS}"
SUBSCRIPTION_DB_PASSWORD="${SUBSCRIPTION_DB_PASSWORD:-$DB_PASS}"
ADMIN_DB_PASSWORD="${ADMIN_DB_PASSWORD:-$DB_PASS}"
CREATOR_PORTAL_DB_PASSWORD="${CREATOR_PORTAL_DB_PASSWORD:-$DB_PASS}"

# ============================================================
# 5. Run Prisma migrations for all services
# ============================================================
echo "==> Running Prisma migrations..."

MIGRATE_SERVICES=(
  "services/core/auth-service:auth-service:auth_db:auth_user:${AUTH_DB_PASSWORD}"
  "services/core/user-service:user-service:user_db:user_user:${USER_DB_PASSWORD}"
  "services/core/wallet-service:wallet-service:wallet_db:wallet_user:${WALLET_DB_PASSWORD}"
  "services/core/payment-service:payment-service:payment_db:payment_user:${PAYMENT_DB_PASSWORD}"
  "services/core/content-service:content-service:content_db:content_user:${CONTENT_DB_PASSWORD}"
  "services/core/search-service:search-service:search_db:search_user:${SEARCH_DB_PASSWORD}"
  "services/engagement/notification-service:notification-service:notification_db:notification_user:${NOTIFICATION_DB_PASSWORD}"
  "services/engagement/reward-service:reward-service:reward_db:reward_user:${REWARD_DB_PASSWORD}"
  "services/intelligence/analytics-service:analytics-service:analytics_db:analytics_user:${ANALYTICS_DB_PASSWORD}"
  "services/intelligence/recommendation-service:recommendation-service:recommendation_db:recommendation_user:${RECOMMENDATION_DB_PASSWORD}"
  "services/universes/reality-service:reality-service:reality_db:reality_user:${REALITY_DB_PASSWORD}"
  "services/universes/movie-service:movie-service:movie_db:movie_user:${MOVIE_DB_PASSWORD}"
  "services/universes/comedy-service:comedy-service:comedy_db:comedy_user:${COMEDY_DB_PASSWORD}"
  "services/universes/games-service:games-service:games_db:games_user:${GAMES_DB_PASSWORD}"
  "services/operations/queue-service:queue-service:queue_db:queue_user:${QUEUE_DB_PASSWORD}"
  "services/universes/lifestyle-service:lifestyle-service:lifestyle_db:lifestyle_user:${LIFESTYLE_DB_PASSWORD}"
  "services/universes/vertical-service:vertical-service:vertical_db:vertical_user:${VERTICAL_DB_PASSWORD}"
  "services/universes/creator-service:creator-service:creator_db:creator_user:${CREATOR_DB_PASSWORD}"
  "services/core/media-service:media-service:media_db:media_user:${MEDIA_DB_PASSWORD}"
  "services/operations/support-service:support-service:support_db:support_user:${SUPPORT_DB_PASSWORD}"
  "services/universes/sports-service:sports-service:sports_db:sports_user:${SPORTS_DB_PASSWORD}"
  "services/operations/moderation-service:moderation-service:moderation_db:moderation_user:${MODERATION_DB_PASSWORD}"
  "services/engagement/engagement-service:engagement-service:engagement_db:engagement_user:${ENGAGEMENT_DB_PASSWORD}"
  "services/engagement/messaging-service:messaging-service:messaging_db:messaging_user:${MESSAGING_DB_PASSWORD}"
  "services/engagement/referral-service:referral-service:referral_db:referral_user:${REFERRAL_DB_PASSWORD}"
  "services/engagement/subscription-service:subscription-service:subscription_db:subscription_user:${SUBSCRIPTION_DB_PASSWORD}"
  "apps/admin:admin-app:admin_db:${DB_USER}:${ADMIN_DB_PASSWORD}"
  "apps/creator-portal:creator-portal-app:creator_portal_db:${DB_USER}:${CREATOR_PORTAL_DB_PASSWORD}"
)

for entry in "${MIGRATE_SERVICES[@]}"; do
  IFS=':' read -r svc_dir svc_name db_name db_user db_pass <<< "$entry"
  echo "    Migrating $svc_name..."

  SVC_DATABASE_URL="postgresql://${db_user}:${db_pass}@${DB_HOST}:${DB_PORT}/${db_name}?schema=public"

  DATABASE_URL="$SVC_DATABASE_URL" \
    npx --yes prisma migrate deploy --schema="$svc_dir/prisma/schema.prisma" 2>&1 || \
    echo "    WARNING: Migration failed for $svc_name (may not have migrations yet)"

  pnpm --filter "@azeebo/$svc_name" prisma:generate 2>/dev/null || true
done

echo "==> Migrations complete."

# ============================================================
# 6. Generate per-service wrapper scripts
# ============================================================
echo "==> Generating service wrapper scripts..."

mkdir -p /app/service-wrappers

# Service definitions: name:db_user:db_password:db_name:port
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

# Map service names to monorepo paths
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

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r svc_name db_user db_pass db_name port <<< "$entry"
  svc_path="${SVC_PATHS[$svc_name]}"
  main_js="${svc_path}/dist/${svc_path}/src/main.js"

  cat > "/app/service-wrappers/${svc_name}.sh" << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://${db_user}:${db_pass}@${DB_HOST}:${DB_PORT}/${db_name}?schema=public"
export PORT="${port}"
export NODE_ENV="production"
exec node /app/${main_js}
WRAPPER
  chmod +x "/app/service-wrappers/${svc_name}.sh"
done

# API gateway wrapper (no database, just service routing)
cat > /app/service-wrappers/api-gateway.sh << 'WRAPPER'
#!/bin/bash
export NODE_ENV="production"
export PORT="3013"
exec node /app/services/gateway/api-gateway/dist/services/gateway/api-gateway/src/main.js
WRAPPER
chmod +x /app/service-wrappers/api-gateway.sh

# Admin app wrapper
cat > /app/service-wrappers/admin-app.sh << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/admin_db?schema=public"
export PORT="4016"
export NODE_ENV="production"
exec node /app/apps/admin/dist/main.js
WRAPPER
chmod +x /app/service-wrappers/admin-app.sh

# Creator portal wrapper
cat > /app/service-wrappers/creator-portal-app.sh << WRAPPER
#!/bin/bash
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/creator_portal_db?schema=public"
export PORT="4014"
export NODE_ENV="production"
exec node /app/apps/creator-portal/dist/main.js
WRAPPER
chmod +x /app/service-wrappers/creator-portal-app.sh

# Web app wrapper
cat > /app/service-wrappers/web-app.sh << WRAPPER
#!/bin/bash
export NODE_ENV="production"
export PORT="4000"
export API_GATEWAY_URL="http://localhost:3013"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}"
exec npx --yes next start -p 4000
WRAPPER
chmod +x /app/service-wrappers/web-app.sh

echo "==> Wrapper scripts generated."

# ============================================================
# 7. Start all services with auto-restart
# ============================================================
echo "==> Starting all services..."

# List of all services to run
ALL_SERVICES=(
  "/app/service-wrappers/auth-service.sh"
  "/app/service-wrappers/user-service.sh"
  "/app/service-wrappers/wallet-service.sh"
  "/app/service-wrappers/payment-service.sh"
  "/app/service-wrappers/content-service.sh"
  "/app/service-wrappers/search-service.sh"
  "/app/service-wrappers/notification-service.sh"
  "/app/service-wrappers/reward-service.sh"
  "/app/service-wrappers/analytics-service.sh"
  "/app/service-wrappers/recommendation-service.sh"
  "/app/service-wrappers/reality-service.sh"
  "/app/service-wrappers/movie-service.sh"
  "/app/service-wrappers/comedy-service.sh"
  "/app/service-wrappers/api-gateway.sh"
  "/app/service-wrappers/games-service.sh"
  "/app/service-wrappers/queue-service.sh"
  "/app/service-wrappers/lifestyle-service.sh"
  "/app/service-wrappers/vertical-service.sh"
  "/app/service-wrappers/creator-service.sh"
  "/app/service-wrappers/media-service.sh"
  "/app/service-wrappers/support-service.sh"
  "/app/service-wrappers/sports-service.sh"
  "/app/service-wrappers/moderation-service.sh"
  "/app/service-wrappers/engagement-service.sh"
  "/app/service-wrappers/messaging-service.sh"
  "/app/service-wrappers/referral-service.sh"
  "/app/service-wrappers/subscription-service.sh"
  "/app/service-wrappers/admin-app.sh"
  "/app/service-wrappers/creator-portal-app.sh"
  "/app/service-wrappers/web-app.sh"
)

# Parallel arrays: PID ↔ service path
PIDS=()
SVCS=()

cleanup() {
  echo ""
  echo "==> Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  wait
  echo "==> All services stopped."
  exit 0
}

trap cleanup SIGTERM SIGINT

start_service() {
  local svc="$1"
  local name
  name=$(basename "$svc" .sh)
  "$svc" &
  local pid=$!
  PIDS+=("$pid")
  SVCS+=("$svc")
  echo "    Started ${name} (PID: ${pid})"
}

for svc in "${ALL_SERVICES[@]}"; do
  start_service "$svc"
done

echo "==> All ${#ALL_SERVICES[@]} services started. Monitoring..."

# Monitor and restart crashed services
while true; do
  for i in "${!PIDS[@]}"; do
    if ! kill -0 "${PIDS[$i]}" 2>/dev/null; then
      local_name=$(basename "${SVCS[$i]}" .sh)
      echo "    ${local_name} crashed (PID: ${PIDS[$i]}), restarting..."
      "${SVCS[$i]}" &
      PIDS[$i]=$!
      echo "    ${local_name} restarted (PID: ${PIDS[$i]})"
    fi
  done
  sleep 5
done
