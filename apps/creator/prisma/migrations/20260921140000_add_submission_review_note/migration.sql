-- Reviewer note on the portal's submission mirror: creators see the WHY
-- (rejection reason / feedback) synced from creator-service reviewNote.
ALTER TABLE "challenge_submissions" ADD COLUMN "reviewNote" TEXT;
