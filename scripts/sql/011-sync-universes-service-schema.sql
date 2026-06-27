-- ============================================================
-- 011: Sync universes-service schema to shared database
-- Ensures universe-specific tables exist for reality, movies,
-- comedy, games, sports, lifestyle, vertical, and creator.
-- ============================================================

-- Reality show seasons table
CREATE TABLE IF NOT EXISTS reality_seasons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "showId" TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reality show episodes table
CREATE TABLE IF NOT EXISTS reality_episodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  "contentId" TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("seasonId") REFERENCES reality_seasons(id) ON DELETE CASCADE
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  "contentId" TEXT,
  "releaseYear" INTEGER,
  genre TEXT,
  duration INTEGER,
  rating TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comedy shows table
CREATE TABLE IF NOT EXISTS comedy_shows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  "contentId" TEXT,
  "comedian" TEXT,
  "showType" TEXT DEFAULT 'standup',
  duration INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'trivia',
  config JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sports events table
CREATE TABLE IF NOT EXISTS sports_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  "eventType" TEXT NOT NULL DEFAULT 'match',
  "scheduledAt" TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lifestyle categories table
CREATE TABLE IF NOT EXISTS lifestyle_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  "parentId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL,
  displayName TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  "followerCount" INTEGER NOT NULL DEFAULT 0,
  "contentCount" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reality_seasons_showId ON reality_seasons("showId");
CREATE INDEX IF NOT EXISTS idx_reality_episodes_seasonId ON reality_episodes("seasonId");
CREATE INDEX IF NOT EXISTS idx_movies_releaseYear ON movies("releaseYear");
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_comedy_shows_comedian ON comedy_shows("comedian");
CREATE INDEX IF NOT EXISTS idx_games_type ON games(type);
CREATE INDEX IF NOT EXISTS idx_sports_events_sport ON sports_events(sport);
CREATE INDEX IF NOT EXISTS idx_sports_events_scheduledAt ON sports_events("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_creators_userId ON creators("userId");
CREATE INDEX IF NOT EXISTS idx_creators_verified ON creators(verified);

-- Table ownership
ALTER TABLE reality_seasons OWNER TO azeebo;
ALTER TABLE reality_episodes OWNER TO azeebo;
ALTER TABLE movies OWNER TO azeebo;
ALTER TABLE comedy_shows OWNER TO azeebo;
ALTER TABLE games OWNER TO azeebo;
ALTER TABLE sports_events OWNER TO azeebo;
ALTER TABLE lifestyle_categories OWNER TO azeebo;
ALTER TABLE creators OWNER TO azeebo;
