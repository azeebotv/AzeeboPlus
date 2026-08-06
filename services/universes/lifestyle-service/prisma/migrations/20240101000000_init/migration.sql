-- Create users table (referenced by FK constraints in this schema)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "coverImage" TEXT,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "prize" TEXT,
    "rules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "participantCount" INT NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge_submissions table
CREATE TABLE IF NOT EXISTS "challenge_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "challengeId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "votes" INT NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge_votes table
CREATE TABLE IF NOT EXISTS "challenge_votes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key constraints (idempotent — only add if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'challenges_createdById_fkey'
        AND conrelid = 'challenges'::regclass
    ) THEN
        ALTER TABLE "challenges"
        ADD CONSTRAINT "challenges_createdById_fkey"
        FOREIGN KEY ("createdById")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'challenge_submissions_challengeId_fkey'
        AND conrelid = 'challenge_submissions'::regclass
    ) THEN
        ALTER TABLE "challenge_submissions"
        ADD CONSTRAINT "challenge_submissions_challengeId_fkey"
        FOREIGN KEY ("challengeId")
        REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'challenge_submissions_userId_fkey'
        AND conrelid = 'challenge_submissions'::regclass
    ) THEN
        ALTER TABLE "challenge_submissions"
        ADD CONSTRAINT "challenge_submissions_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'challenge_votes_userId_fkey'
        AND conrelid = 'challenge_votes'::regclass
    ) THEN
        ALTER TABLE "challenge_votes"
        ADD CONSTRAINT "challenge_votes_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'challenge_votes_submissionId_fkey'
        AND conrelid = 'challenge_votes'::regclass
    ) THEN
        ALTER TABLE "challenge_votes"
        ADD CONSTRAINT "challenge_votes_submissionId_fkey"
        FOREIGN KEY ("submissionId")
        REFERENCES "challenge_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "challenges_slug_key" ON "challenges"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_submissions_challengeId_userId_key" ON "challenge_submissions"("challengeId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_votes_userId_submissionId_key" ON "challenge_votes"("userId", "submissionId");

-- Regular indexes
CREATE INDEX IF NOT EXISTS "challenges_type_idx" ON "challenges"("type");
CREATE INDEX IF NOT EXISTS "challenges_status_idx" ON "challenges"("status");
CREATE INDEX IF NOT EXISTS "challenges_startDate_idx" ON "challenges"("startDate");
CREATE INDEX IF NOT EXISTS "challenges_endDate_idx" ON "challenges"("endDate");
CREATE INDEX IF NOT EXISTS "challenges_createdById_idx" ON "challenges"("createdById");

CREATE INDEX IF NOT EXISTS "challenge_submissions_challengeId_idx" ON "challenge_submissions"("challengeId");
CREATE INDEX IF NOT EXISTS "challenge_submissions_userId_idx" ON "challenge_submissions"("userId");
CREATE INDEX IF NOT EXISTS "challenge_submissions_status_idx" ON "challenge_submissions"("status");

CREATE INDEX IF NOT EXISTS "challenge_votes_submissionId_idx" ON "challenge_votes"("submissionId");
CREATE INDEX IF NOT EXISTS "challenge_votes_userId_idx" ON "challenge_votes"("userId");
