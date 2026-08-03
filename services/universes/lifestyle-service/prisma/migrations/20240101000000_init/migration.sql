-- Create challenges table
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "coverImage" TEXT,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "prize" TEXT,
    "rules" TEXT,
    "status" TEXT NOT NULL DEFAULT "draft",
    "participantCount" INT NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge_submissions table
CREATE TABLE "challenge_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid(),
    "challengeId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT "pending",
    "votes" INT NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create challenge_votes table
CREATE TABLE "challenge_votes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid(),
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key constraints
ALTER TABLE "challenges" 
ADD CONSTRAINT "challenges_createdById_fkey" 
FOREIGN KEY ("createdById") 
REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge_submissions" 
ADD CONSTRAINT "challenge_submissions_challengeId_fkey" 
FOREIGN KEY ("challengeId") 
REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "challenge_submissions" 
ADD CONSTRAINT "challenge_submissions_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "challenge_votes" 
ADD CONSTRAINT "challenge_votes_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge_votes" 
ADD CONSTRAINT "challenge_votes_submissionId_fkey" 
FOREIGN KEY ("submissionId") 
REFERENCES "challenge_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique indexes
CREATE UNIQUE INDEX "challenges_slug_key" ON "challenges"("slug");
CREATE UNIQUE INDEX "challenge_submissions_challengeId_userId_key" ON "challenge_submissions"("challengeId", "userId");
CREATE UNIQUE INDEX "challenge_votes_userId_submissionId_key" ON "challenge_votes"("userId", "submissionId");

-- Regular indexes
CREATE INDEX "challenges_type_idx" ON "challenges"("type");
CREATE INDEX "challenges_status_idx" ON "challenges"("status");
CREATE INDEX "challenges_startDate_idx" ON "challenges"("startDate");
CREATE INDEX "challenges_endDate_idx" ON "challenges"("endDate");
CREATE INDEX "challenges_createdById_idx" ON "challenges"("createdById");

CREATE INDEX "challenge_submissions_challengeId_idx" ON "challenge_submissions"("challengeId");
CREATE INDEX "challenge_submissions_userId_idx" ON "challenge_submissions"("userId");
CREATE INDEX "challenge_submissions_status_idx" ON "challenge_submissions"("status");

CREATE INDEX "challenge_votes_submissionId_idx" ON "challenge_votes"("submissionId");
CREATE INDEX "challenge_votes_userId_idx" ON "challenge_votes"("userId");
