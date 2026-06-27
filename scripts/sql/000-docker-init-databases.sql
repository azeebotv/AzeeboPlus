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
SELECT create_service_db('auth_db', 'auth_user', current_setting('app.settings.auth_password', true));
SELECT create_service_db('user_db', 'user_user', current_setting('app.settings.user_password', true));
SELECT create_service_db('wallet_db', 'wallet_user', current_setting('app.settings.wallet_password', true));
SELECT create_service_db('payment_db', 'payment_user', current_setting('app.settings.payment_password', true));
SELECT create_service_db('content_db', 'content_user', current_setting('app.settings.content_password', true));
SELECT create_service_db('search_db', 'search_user', current_setting('app.settings.search_password', true));
SELECT create_service_db('media_db', 'media_user', current_setting('app.settings.media_password', true));

-- ============================================================
-- ENGAGEMENT DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('notification_db', 'notification_user', current_setting('app.settings.notification_password', true));
SELECT create_service_db('reward_db', 'reward_user', current_setting('app.settings.reward_password', true));
SELECT create_service_db('engagement_db', 'engagement_user', current_setting('app.settings.engagement_password', true));
SELECT create_service_db('messaging_db', 'messaging_user', current_setting('app.settings.messaging_password', true));
SELECT create_service_db('referral_db', 'referral_user', current_setting('app.settings.referral_password', true));
SELECT create_service_db('subscription_db', 'subscription_user', current_setting('app.settings.subscription_password', true));

-- ============================================================
-- INTELLIGENCE DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('analytics_db', 'analytics_user', current_setting('app.settings.analytics_password', true));
SELECT create_service_db('recommendation_db', 'recommendation_user', current_setting('app.settings.recommendation_password', true));

-- ============================================================
-- UNIVERSES DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('reality_db', 'reality_user', current_setting('app.settings.reality_password', true));
SELECT create_service_db('movie_db', 'movie_user', current_setting('app.settings.movie_password', true));
SELECT create_service_db('comedy_db', 'comedy_user', current_setting('app.settings.comedy_password', true));
SELECT create_service_db('games_db', 'games_user', current_setting('app.settings.games_password', true));
SELECT create_service_db('sports_db', 'sports_user', current_setting('app.settings.sports_password', true));
SELECT create_service_db('lifestyle_db', 'lifestyle_user', current_setting('app.settings.lifestyle_password', true));
SELECT create_service_db('vertical_db', 'vertical_user', current_setting('app.settings.vertical_password', true));
SELECT create_service_db('creator_db', 'creator_user', current_setting('app.settings.creator_password', true));

-- ============================================================
-- OPERATIONS DOMAIN DATABASES
-- ============================================================
SELECT create_service_db('queue_db', 'queue_user', current_setting('app.settings.queue_password', true));
SELECT create_service_db('support_db', 'support_user', current_setting('app.settings.support_password', true));
SELECT create_service_db('moderation_db', 'moderation_user', current_setting('app.settings.moderation_password', true));

-- ============================================================
-- FRONTEND DATABASES
-- ============================================================
SELECT create_service_db('admin_db', 'admin_user', current_setting('app.settings.admin_password', true));
SELECT create_service_db('creator_portal_db', 'creator_portal_user', current_setting('app.settings.creator_portal_password', true));

-- ============================================================
-- Cleanup helper function
-- ============================================================
DROP FUNCTION IF EXISTS create_service_db(TEXT, TEXT, TEXT);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'All service databases initialized successfully';
END $$;
