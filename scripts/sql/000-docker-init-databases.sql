-- ============================================================
-- Azeebo+ Database Initialization Script
-- Creates separate databases for each microservice
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to create a database and grant privileges
CREATE OR REPLACE FUNCTION create_service_db(db_name TEXT, db_user TEXT, db_password TEXT) 
RETURNS void AS $$
BEGIN
  -- Create the user if not exists
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = db_user) THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', db_user, db_password);
  END IF;

  -- Create the database if not exists
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = db_name) THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', db_name, db_user);
  END IF;

  -- Grant privileges
  EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', db_name, db_user);
  EXECUTE format('ALTER DATABASE %I OWNER TO %I', db_name, db_user);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('azeebo_auth', 'auth_user', current_setting('app.settings.auth_password', true));
SELECT create_service_db('azeebo_user', 'user_user', current_setting('app.settings.user_password', true));
SELECT create_service_db('azeebo_wallet', 'wallet_user', current_setting('app.settings.wallet_password', true));
SELECT create_service_db('azeebo_payment', 'payment_user', current_setting('app.settings.payment_password', true));
SELECT create_service_db('azeebo_content', 'content_user', current_setting('app.settings.content_password', true));
SELECT create_service_db('azeebo_search', 'search_user', current_setting('app.settings.search_password', true));
SELECT create_service_db('azeebo_media', 'media_user', current_setting('app.settings.media_password', true));

-- ============================================================
-- ENGAGEMENT DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('azeebo_notification', 'notification_user', current_setting('app.settings.notification_password', true));
SELECT create_service_db('azeebo_reward', 'reward_user', current_setting('app.settings.reward_password', true));
SELECT create_service_db('azeebo_engagement', 'engagement_user', current_setting('app.settings.engagement_password', true));
SELECT create_service_db('azeebo_messaging', 'messaging_user', current_setting('app.settings.messaging_password', true));
SELECT create_service_db('azeebo_referral', 'referral_user', current_setting('app.settings.referral_password', true));
SELECT create_service_db('azeebo_subscription', 'subscription_user', current_setting('app.settings.subscription_password', true));

-- ============================================================
-- INTELLIGENCE DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('azeebo_analytics', 'analytics_user', current_setting('app.settings.analytics_password', true));
SELECT create_service_db('azeebo_recommendation', 'recommendation_user', current_setting('app.settings.recommendation_password', true));

-- ============================================================
-- UNIVERSES DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('azeebo_reality', 'reality_user', current_setting('app.settings.reality_password', true));
SELECT create_service_db('azeebo_movie', 'movie_user', current_setting('app.settings.movie_password', true));
SELECT create_service_db('azeebo_comedy', 'comedy_user', current_setting('app.settings.comedy_password', true));
SELECT create_service_db('azeebo_games', 'games_user', current_setting('app.settings.games_password', true));
SELECT create_service_db('azeebo_sports', 'sports_user', current_setting('app.settings.sports_password', true));
SELECT create_service_db('azeebo_lifestyle', 'lifestyle_user', current_setting('app.settings.lifestyle_password', true));
SELECT create_service_db('azeebo_vertical', 'vertical_user', current_setting('app.settings.vertical_password', true));
SELECT create_service_db('azeebo_creator', 'creator_user', current_setting('app.settings.creator_password', true));

-- ============================================================
-- OPERATIONS DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('azeebo_queue', 'queue_user', current_setting('app.settings.queue_password', true));
SELECT create_service_db('azeebo_support', 'support_user', current_setting('app.settings.support_password', true));
SELECT create_service_db('azeebo_moderation', 'moderation_user', current_setting('app.settings.moderation_password', true));

-- ============================================================
-- FRONTEND DATABASES
-- ============================================================
SELECT create_service_db('azeebo_admin', 'admin_user', current_setting('app.settings.admin_password', true));
SELECT create_service_db('azeebo_creator', 'creator_user', current_setting('app.settings.creator_password', true));

-- ============================================================
-- Cleanup helper function
-- ============================================================
DROP FUNCTION IF EXISTS create_service_db(TEXT, TEXT, TEXT);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'All service databases initialized successfully';
END $$;
