#!/bin/bash
set -euo pipefail

# ============================================================
# Azeebo+ Database Initialization Script
# Creates separate databases for each microservice
# ============================================================

echo "Starting Azeebo+ database initialization..."

# Helper function
create_db_and_user() {
  local db_name=$1
  local db_user=$2
  local db_password=$3
  
  echo "  Creating database: $db_name with user: $db_user"
  
  # Create user if not exists
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${db_user}') THEN
        CREATE ROLE ${db_user} WITH LOGIN PASSWORD '${db_password}';
      END IF;
    END
    \$\$;
EOSQL

  # Create database if not exists
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${db_name} OWNER ${db_user}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\gexec
    
    GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${db_user};
    ALTER DATABASE ${db_name} OWNER TO ${db_user};
EOSQL

  # Enable extensions in the new database
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL
}

echo "Creating service databases..."

# ============================================================
# CORE DOMAIN
# ============================================================
create_db_and_user "azeebo_auth" "azeebo" "${AUTH_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_user" "azeebo" "${USER_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_wallet" "azeebo" "${WALLET_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_payment" "azeebo" "${PAYMENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_content" "azeebo" "${CONTENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_search" "azeebo" "${SEARCH_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_media" "azeebo" "${MEDIA_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# ENGAGEMENT DOMAIN
# ============================================================
create_db_and_user "azeebo_notification" "azeebo" "${NOTIFICATION_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_reward" "azeebo" "${REWARD_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_engagement" "azeebo" "${ENGAGEMENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_messaging" "azeebo" "${MESSAGING_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_referral" "azeebo" "${REFERRAL_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_subscription" "azeebo" "${SUBSCRIPTION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# INTELLIGENCE DOMAIN
# ============================================================
create_db_and_user "azeebo_analytics" "azeebo" "${ANALYTICS_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_recommendation" "azeebo" "${RECOMMENDATION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# UNIVERSES DOMAIN
# ============================================================
create_db_and_user "azeebo_reality" "azeebo" "${REALITY_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_movie" "azeebo" "${MOVIE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_comedy" "azeebo" "${COMEDY_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_games" "azeebo" "${GAMES_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_sports" "azeebo" "${SPORTS_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_lifestyle" "azeebo" "${LIFESTYLE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_vertical" "azeebo" "${VERTICAL_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_creator" "azeebo" "${CREATOR_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# OPERATIONS DOMAIN
# ============================================================
create_db_and_user "azeebo_queue" "azeebo" "${QUEUE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_support" "azeebo" "${SUPPORT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_moderation" "azeebo" "${MODERATION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# FRONTEND
# ============================================================
create_db_and_user "azeebo_admin" "azeebo" "${ADMIN_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "azeebo_creator_portal" "azeebo" "${CREATOR_PORTAL_DB_PASSWORD:-azeebo_dev_2024}"

echo "All service databases initialized successfully!"
