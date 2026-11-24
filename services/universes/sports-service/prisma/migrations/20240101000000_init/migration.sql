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

-- Sports-service drift sync — REVIEWED
--
-- Creates the service's full table set (events/teams/predictions/markets/
-- highlights/fan boards/contests/fixture metadata + anchor users +
-- creator/monetization tables): the 2024 init was a stub.
--
-- Verification (2026-09-10, dev DB):
--   FKs stay intra-service (every target table is created in this file);
--   replay from empty produces the complete schema.prisma shape.

-- CreateTable
CREATE TABLE IF NOT EXISTS "sports_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sport" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "event_teams" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prediction_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "predictionMarketId" TEXT,

    CONSTRAINT "prediction_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "highlights" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE IF NOT EXISTS "creator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "fan_boards" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "fan_board_comments" (
    "id" TEXT NOT NULL,
    "fanBoardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_board_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "contests" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entryFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "prizePool" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "contest_prizes" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contest_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "contest_entries" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryData" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sportsEventId" TEXT,

    CONSTRAINT "contest_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prediction_markets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "odds" JSONB,
    "totalPool" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settlementType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "fixture_metadata" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venue" TEXT,
    "referee" TEXT,
    "weather" TEXT,
    "temperature" INTEGER,
    "attendance" INTEGER,
    "broadcast" TEXT[],
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixture_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prediction_rewards" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "correctPredictions" INTEGER NOT NULL DEFAULT 0,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "bonusPool" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_rewards_pkey" PRIMARY KEY ("id")
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
CREATE INDEX IF NOT EXISTS "sports_events_sport_idx" ON "sports_events"("sport");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sports_events_status_idx" ON "sports_events"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sports_events_startsAt_idx" ON "sports_events"("startsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "event_teams_eventId_idx" ON "event_teams"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_entries_userId_idx" ON "prediction_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_entries_eventId_idx" ON "prediction_entries"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_entries_eventId_userId_idx" ON "prediction_entries"("eventId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_entries_predictionMarketId_idx" ON "prediction_entries"("predictionMarketId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_entries_createdAt_idx" ON "prediction_entries"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "highlights_eventId_idx" ON "highlights"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "highlights_creatorId_idx" ON "highlights"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "highlights_createdAt_idx" ON "highlights"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "highlights_viewCount_idx" ON "highlights"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "creator_profiles_userId_key" ON "creator_profiles"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_boards_eventId_idx" ON "fan_boards"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_boards_userId_idx" ON "fan_boards"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_boards_createdAt_idx" ON "fan_boards"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_boards_likes_idx" ON "fan_boards"("likes");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_board_comments_fanBoardId_idx" ON "fan_board_comments"("fanBoardId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_board_comments_userId_idx" ON "fan_board_comments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fan_board_comments_createdAt_idx" ON "fan_board_comments"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contests_eventId_idx" ON "contests"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contests_status_idx" ON "contests"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contests_startsAt_idx" ON "contests"("startsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contests_endsAt_idx" ON "contests"("endsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contest_prizes_contestId_idx" ON "contest_prizes"("contestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contest_entries_contestId_idx" ON "contest_entries"("contestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contest_entries_userId_idx" ON "contest_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contest_entries_score_idx" ON "contest_entries"("score");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contest_entries_sportsEventId_idx" ON "contest_entries"("sportsEventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "contest_entries_contestId_userId_key" ON "contest_entries"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prediction_markets_eventId_key" ON "prediction_markets"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prediction_markets_status_idx" ON "prediction_markets"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "fixture_metadata_eventId_key" ON "fixture_metadata"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prediction_rewards_eventId_key" ON "prediction_rewards"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tips_fromUserId_idx" ON "tips"("fromUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tips_toUserId_idx" ON "tips"("toUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_creatorId_idx" ON "subscriptions"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_creatorId_key" ON "subscriptions"("userId", "creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_creatorId_idx" ON "creator_earnings"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_status_idx" ON "creator_earnings"("status");

-- AddForeignKey
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_entries" ADD CONSTRAINT "prediction_entries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_entries" ADD CONSTRAINT "prediction_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_entries" ADD CONSTRAINT "prediction_entries_predictionMarketId_fkey" FOREIGN KEY ("predictionMarketId") REFERENCES "prediction_markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_boards" ADD CONSTRAINT "fan_boards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_boards" ADD CONSTRAINT "fan_boards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_board_comments" ADD CONSTRAINT "fan_board_comments_fanBoardId_fkey" FOREIGN KEY ("fanBoardId") REFERENCES "fan_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_board_comments" ADD CONSTRAINT "fan_board_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_prizes" ADD CONSTRAINT "contest_prizes_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_entries" ADD CONSTRAINT "contest_entries_sportsEventId_fkey" FOREIGN KEY ("sportsEventId") REFERENCES "sports_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_markets" ADD CONSTRAINT "prediction_markets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture_metadata" ADD CONSTRAINT "fixture_metadata_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_rewards" ADD CONSTRAINT "prediction_rewards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sports_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

