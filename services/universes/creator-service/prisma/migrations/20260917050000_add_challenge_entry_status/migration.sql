-- Challenge entry review lifecycle: creators see under_review / winner /
-- rejected transitions in the portal instead of a static submitted badge.

ALTER TABLE "challenge_entries" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- Sort/filter by review state (leaderboards, review queues).
CREATE INDEX "challenge_entries_status_idx" ON "challenge_entries"("status");
