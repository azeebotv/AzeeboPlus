-- ============================================================
-- 012: Sync media-service schema to shared database
-- Ensures media, uploads, and premium_content_media tables
-- exist for file uploads and premium media management.
-- ============================================================

-- Media files table
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  filename TEXT NOT NULL,
  originalName TEXT,
  mimeType TEXT NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  bucket TEXT,
  key TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploads tracking table
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "presignedUrl" TEXT,
  "mediaId" TEXT,
  error TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Premium content media links
CREATE TABLE IF NOT EXISTS premium_content_media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "premiumContentId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("premiumContentId", "mediaId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_userId ON media("userId");
CREATE INDEX IF NOT EXISTS idx_media_mimeType ON media(mimeType);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_createdAt ON media("createdAt");
CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId");
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_premium_content_media_mediaId ON premium_content_media("mediaId");

-- Table ownership
ALTER TABLE media OWNER TO azeebo;
ALTER TABLE uploads OWNER TO azeebo;
ALTER TABLE premium_content_media OWNER TO azeebo;
