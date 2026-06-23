#!/bin/bash
set -e

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
create_db_and_user "auth_db" "auth_user" "${AUTH_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "user_db" "user_user" "${USER_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "wallet_db" "wallet_user" "${WALLET_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "payment_db" "payment_user" "${PAYMENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "content_db" "content_user" "${CONTENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "search_db" "search_user" "${SEARCH_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "media_db" "media_user" "${MEDIA_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# ENGAGEMENT DOMAIN
# ============================================================
create_db_and_user "notification_db" "notification_user" "${NOTIFICATION_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "reward_db" "reward_user" "${REWARD_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "engagement_db" "engagement_user" "${ENGAGEMENT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "messaging_db" "messaging_user" "${MESSAGING_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "referral_db" "referral_user" "${REFERRAL_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "subscription_db" "subscription_user" "${SUBSCRIPTION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# INTELLIGENCE DOMAIN
# ============================================================
create_db_and_user "analytics_db" "analytics_user" "${ANALYTICS_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "recommendation_db" "recommendation_user" "${RECOMMENDATION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# UNIVERSES DOMAIN
# ============================================================
create_db_and_user "reality_db" "reality_user" "${REALITY_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "movie_db" "movie_user" "${MOVIE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "comedy_db" "comedy_user" "${COMEDY_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "games_db" "games_user" "${GAMES_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "sports_db" "sports_user" "${SPORTS_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "lifestyle_db" "lifestyle_user" "${LIFESTYLE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "vertical_db" "vertical_user" "${VERTICAL_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "creator_db" "creator_user" "${CREATOR_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# OPERATIONS DOMAIN
# ============================================================
create_db_and_user "queue_db" "queue_user" "${QUEUE_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "support_db" "support_user" "${SUPPORT_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "moderation_db" "moderation_user" "${MODERATION_DB_PASSWORD:-azeebo_dev_2024}"

# ============================================================
# FRONTEND
# ============================================================
create_db_and_user "admin_db" "admin_user" "${ADMIN_DB_PASSWORD:-azeebo_dev_2024}"
create_db_and_user "creator_portal_db" "creator_portal_user" "${CREATOR_PORTAL_DB_PASSWORD:-azeebo_dev_2024}"

echo "All service databases initialized successfully!"
