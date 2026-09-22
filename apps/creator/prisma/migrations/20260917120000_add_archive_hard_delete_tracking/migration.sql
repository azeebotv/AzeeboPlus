-- Hard-delete sweeper support: track when a content item entered 'archived'
-- and when its stored blob objects were permanently purged.
ALTER TABLE "content_items" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN "mediaPurgedAt" TIMESTAMP(3);

-- Backfill: pre-existing archives were stamped by deleteContent's
-- `status: 'archived'` update, so updatedAt is the archive time.
-- The WHERE clause keeps the window honest: an item re-archived moments
-- before this migration ran (updatedAt within the last 5 minutes) is left
-- alone — its archive stamp comes from the new code path, not this backfill.
UPDATE "content_items"
SET "archivedAt" = "updatedAt"
WHERE "status" = 'archived'
  AND "archivedAt" IS NULL
  AND "updatedAt" < NOW() - INTERVAL '5 minutes';

CREATE INDEX "content_items_status_archivedAt_idx" ON "content_items"("status", "archivedAt");
