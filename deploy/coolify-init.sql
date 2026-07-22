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
    'azeebo_auth', 'azeebo_user', 'azeebo_wallet', 'azeebo_payment', 'azeebo_content', 'azeebo_search',
    'azeebo_media', 'azeebo_notification', 'azeebo_reward', 'azeebo_engagement', 'azeebo_messaging',
    'azeebo_referral', 'azeebo_subscription', 'azeebo_analytics', 'azeebo_recommendation',
    'azeebo_reality', 'azeebo_movie', 'azeebo_comedy', 'azeebo_games', 'azeebo_sports',
    'azeebo_lifestyle', 'azeebo_vertical', 'azeebo_creator',
    'azeebo_queue', 'azeebo_support', 'azeebo_moderation',
    'azeebo_admin', 'azeebo_creator'
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
