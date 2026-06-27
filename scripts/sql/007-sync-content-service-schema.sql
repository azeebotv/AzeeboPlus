-- ============================================================
-- 007: Sync content-service schema to shared database
-- Ensures content, content_items, premium_content, tags,
-- and content_tags tables exist for the content domain.
-- ============================================================

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'video',
  status TEXT NOT NULL DEFAULT 'draft',
  "creatorId" TEXT,
  universe TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content items (individual media files within content)
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentId" TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  url TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  duration INTEGER,
  size BIGINT,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("contentId") REFERENCES content(id) ON DELETE CASCADE
);

-- Premium content (pay-per-view / subscription-gated)
CREATE TABLE IF NOT EXISTS premium_content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentId" TEXT UNIQUE NOT NULL,
  "pricingModel" TEXT NOT NULL DEFAULT 'ppv',
  price DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "trialPeriodDays" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("contentId") REFERENCES content(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content-tag junction
CREATE TABLE IF NOT EXISTS content_tags (
  "contentId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("contentId", "tagId"),
  FOREIGN KEY ("contentId") REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_creatorId ON content("creatorId");
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_universe ON content(universe);
CREATE INDEX IF NOT EXISTS idx_content_createdAt ON content("createdAt");
CREATE INDEX IF NOT EXISTS idx_content_items_contentId ON content_items("contentId");
CREATE INDEX IF NOT EXISTS idx_premium_content_contentId ON premium_content("contentId");
CREATE INDEX IF NOT EXISTS idx_content_tags_tagId ON content_tags("tagId");

-- Table ownership
ALTER TABLE content OWNER TO azeebo;
ALTER TABLE content_items OWNER TO azeebo;
ALTER TABLE premium_content OWNER TO azeebo;
ALTER TABLE tags OWNER TO azeebo;
ALTER TABLE content_tags OWNER TO azeebo;
