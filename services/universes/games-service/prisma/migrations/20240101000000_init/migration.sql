-- Squashed baseline: full schema as of the current schema.prisma.
-- Replaces the stub 20240101000000_init (which was empty) with the full table
-- set that the 2026-09-08 drift_sync had created. The drift_sync folder is
-- removed; this init is now the single baseline migration.
--
-- Replay safety:
--   * Fresh database (CI shadow / new env): CREATE TABLE / INDEX are IF NOT
--     EXISTS (always valid), FK constraints are plain ADD CONSTRAINT (correct
--     when no constraint exists yet) — produces the complete schema.prisma.
--   * Live database that already recorded 20240101000000_init: Prisma skips
--     an unchanged-named migration, so the new body is never re-applied.
--
-- PostgreSQL note: ADD CONSTRAINT IF NOT EXISTS does not exist in any PG
-- version, so FKs are plain ADD CONSTRAINT. Tables and indexes use IF NOT
-- EXISTS where PG supports it. Matching content/search/reward baseline style.

-- Games-service drift sync — REVIEWED
--
-- Creates the service's full table set (challenges/questions/sessions/
-- tournaments/games + anchor users + monetization tables): the 2024 init
-- was a stub, so live DBs only had these via hand-creation.
--
-- Verification (2026-09-10, dev DB):
--   FKs stay intra-service (every target table is created in this file);
--   replay from empty produces the complete schema.prisma shape.

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "questions" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" JSONB,
    "points" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "game_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "questionId" TEXT,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "score_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tournaments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "entryFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "prizePool" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tournament_prizes" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tournament_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "game_questions" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" JSONB,
    "points" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "timeLimit" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "game_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "game_play_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_play_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "player1Score" INTEGER NOT NULL DEFAULT 0,
    "player2Score" INTEGER NOT NULL DEFAULT 0,
    "round" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winnerId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tips" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorProfileId" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "creator_earnings" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorProfileId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "challenges_type_idx" ON "challenges"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "challenges_status_idx" ON "challenges"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "questions_challengeId_idx" ON "questions"("challengeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_sessions_userId_idx" ON "game_sessions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_sessions_challengeId_idx" ON "game_sessions"("challengeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_sessions_questionId_idx" ON "game_sessions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "game_sessions_userId_challengeId_key" ON "game_sessions"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "score_entries_userId_key" ON "score_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "score_entries_userId_idx" ON "score_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournaments_startsAt_idx" ON "tournaments"("startsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_prizes_tournamentId_idx" ON "tournament_prizes"("tournamentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_entries_userId_idx" ON "tournament_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_entries_tournamentId_idx" ON "tournament_entries"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_entries_userId_tournamentId_key" ON "tournament_entries"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "games_category_idx" ON "games"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "games_isActive_idx" ON "games"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_questions_gameId_idx" ON "game_questions"("gameId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_answers_sessionId_idx" ON "game_answers"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_answers_questionId_idx" ON "game_answers"("questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_play_sessions_userId_idx" ON "game_play_sessions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "game_play_sessions_gameId_idx" ON "game_play_sessions"("gameId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_matches_status_idx" ON "tournament_matches"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_matches_player1Id_idx" ON "tournament_matches"("player1Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_matches_player2Id_idx" ON "tournament_matches"("player2Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tournament_matches_winnerId_idx" ON "tournament_matches"("winnerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tips_fromUserId_idx" ON "tips"("fromUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tips_toUserId_idx" ON "tips"("toUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_creatorId_idx" ON "subscriptions"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_creatorProfileId_idx" ON "subscriptions"("creatorProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_creatorId_key" ON "subscriptions"("userId", "creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_creatorId_idx" ON "creator_earnings"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_creatorProfileId_idx" ON "creator_earnings"("creatorProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_status_idx" ON "creator_earnings"("status");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_prizes" ADD CONSTRAINT "tournament_prizes_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_answers" ADD CONSTRAINT "game_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_play_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_answers" ADD CONSTRAINT "game_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_play_sessions" ADD CONSTRAINT "game_play_sessions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

