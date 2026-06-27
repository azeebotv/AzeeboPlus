-- ============================================================
-- 001: Sync user-service schema to shared database
-- Adds missing columns to watch_history and audit_logs tables
-- that exist in the user-service Prisma schema but not in the
-- shared azeebo_plus_dev database.
-- ============================================================

-- watch_history: add missing 'contentType' and 'universe' columns
ALTER TABLE watch_history ADD COLUMN IF NOT EXISTS "contentType" TEXT NOT NULL DEFAULT 'video';
ALTER TABLE watch_history ADD COLUMN IF NOT EXISTS "universe" TEXT NOT NULL DEFAULT 'unknown';

-- audit_logs: add missing 'actorRole' and 'targetType' columns
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "actorRole" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "targetType" TEXT NOT NULL DEFAULT 'unknown';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watch_history_userId ON watch_history("userId");
CREATE INDEX IF NOT EXISTS idx_watch_history_contentId ON watch_history("contentId");
CREATE INDEX IF NOT EXISTS idx_watch_history_contentType ON watch_history("contentType");
CREATE INDEX IF NOT EXISTS idx_watch_history_watchedAt ON watch_history("watchedAt");

-- Table ownership
ALTER TABLE watch_history OWNER TO azeebo;
ALTER TABLE audit_logs OWNER TO azeebo;
