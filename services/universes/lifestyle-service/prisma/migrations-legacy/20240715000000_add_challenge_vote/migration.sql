-- Create ChallengeVote table (idempotent — table may already exist from init migration)
CREATE TABLE IF NOT EXISTS "challenge_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_votes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint (IF NOT EXISTS prevents errors on re-runs)
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_votes_userId_submissionId_key" ON "challenge_votes"("userId", "submissionId");

-- Create indexes (IF NOT EXISTS prevents errors on re-runs)
CREATE INDEX IF NOT EXISTS "challenge_votes_submissionId_idx" ON "challenge_votes"("submissionId");
CREATE INDEX IF NOT EXISTS "challenge_votes_userId_idx" ON "challenge_votes"("userId");

-- Add foreign key constraint (only if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'challenge_votes_submissionId_fkey' 
        AND conrelid = 'challenge_votes'::regclass
    ) THEN
        ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_submissionId_fkey" 
        FOREIGN KEY ("submissionId") REFERENCES "challenge_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
