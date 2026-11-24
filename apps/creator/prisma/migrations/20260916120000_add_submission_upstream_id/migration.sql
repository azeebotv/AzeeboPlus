-- Link local challenge submissions to their creator-service entries
-- (challenge_entries.id) for two-way sync traceability.
ALTER TABLE "challenge_submissions" ADD COLUMN IF NOT EXISTS "upstreamId" TEXT;

CREATE INDEX IF NOT EXISTS "challenge_submissions_upstreamId_idx" ON "challenge_submissions"("upstreamId");
