-- ============================================================
-- Azeebo+ Coolify PostgreSQL Init Script
-- ============================================================
-- Paste this into the Coolify PostgreSQL "Init Script" field.
-- Creates all 28 service databases with the same user
-- that Coolify creates for the main database.
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all service databases
-- Uses the default PostgreSQL user (the one Coolify creates)
DO $$
DECLARE
  db_name TEXT;
  db_names TEXT[] := ARRAY[
    'auth_db', 'user_db', 'wallet_db', 'payment_db', 'content_db', 'search_db',
    'media_db', 'notification_db', 'reward_db', 'engagement_db', 'messaging_db',
    'referral_db', 'subscription_db', 'analytics_db', 'recommendation_db',
    'reality_db', 'movie_db', 'comedy_db', 'games_db', 'sports_db',
    'lifestyle_db', 'vertical_db', 'creator_db',
    'queue_db', 'support_db', 'moderation_db',
    'admin_db', 'creator_portal_db'
  ];
  current_user_name TEXT;
BEGIN
  -- Get the current user (the one Coolify created)
  SELECT current_user INTO current_user_name;

  FOREACH db_name IN ARRAY db_names LOOP
    -- Create database owned by the current user
    EXECUTE format('CREATE DATABASE %I OWNER %I', db_name, current_user_name);
    RAISE NOTICE 'Created database: %', db_name;
  END LOOP;

  RAISE NOTICE 'All 28 service databases created successfully.';
END $$;
