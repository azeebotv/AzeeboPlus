#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE azeebo_auth;
    CREATE DATABASE azeebo_user;
    CREATE DATABASE azeebo_wallet;
    CREATE DATABASE azeebo_payment;
    CREATE DATABASE azeebo_content;
    CREATE DATABASE azeebo_media;
    CREATE DATABASE azeebo_search;
    CREATE DATABASE azeebo_notification;
    CREATE DATABASE azeebo_reward;
    CREATE DATABASE azeebo_analytics;
    CREATE DATABASE azeebo_recommendation;
    CREATE DATABASE azeebo_reality;
    CREATE DATABASE azeebo_movie;
    CREATE DATABASE azeebo_games;
    CREATE DATABASE azeebo_comedy;
    CREATE DATABASE azeebo_sports;
    CREATE DATABASE azeebo_lifestyle;
    CREATE DATABASE azeebo_vertical;
    CREATE DATABASE azeebo_creator;
    CREATE DATABASE azeebo_support;
    CREATE DATABASE azeebo_moderation;
    CREATE DATABASE azeebo_queue;
    CREATE DATABASE azeebo_engagement;
    CREATE DATABASE azeebo_messaging;
    CREATE DATABASE azeebo_referral;
    CREATE DATABASE azeebo_subscription;
    CREATE DATABASE azeebo_admin;
    CREATE DATABASE azeebo_creator;

    CREATE USER azeebo WITH PASSWORD '${DB_PASSWORD}';

    GRANT ALL PRIVILEGES ON DATABASE azeebo_auth TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_user TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_wallet TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_payment TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_content TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_media TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_search TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_notification TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_reward TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_analytics TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_recommendation TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_reality TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_movie TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_games TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_comedy TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_sports TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_lifestyle TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_vertical TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_creator TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_support TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_moderation TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_queue TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_engagement TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_messaging TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_referral TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_subscription TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_admin TO azeebo;
    GRANT ALL PRIVILEGES ON DATABASE azeebo_creator TO azeebo;
EOSQL
