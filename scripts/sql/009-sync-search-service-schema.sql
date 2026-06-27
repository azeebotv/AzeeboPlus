-- ============================================================
-- 009: Sync search-service schema to shared database
-- Ensures search indexes and analytics tables exist.
-- ============================================================

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query TEXT NOT NULL,
  "userId" TEXT,
  results_count INTEGER NOT NULL DEFAULT 0,
  "clickedResultId" TEXT,
  "searchDuration" INTEGER,
  filters JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_userId ON search_analytics("userId");
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_createdAt ON search_analytics("createdAt");
CREATE INDEX IF NOT EXISTS idx_saved_searches_userId ON saved_searches("userId");

-- Table ownership
ALTER TABLE search_analytics OWNER TO azeebo;
ALTER TABLE saved_searches OWNER TO azeebo;
