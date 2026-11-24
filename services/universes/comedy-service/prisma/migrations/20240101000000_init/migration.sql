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

-- Comedy-service drift sync — REVIEWED
--
-- Creates the service's full table set (clips/series/episodes/specials/
-- challenges + monetization tables + anchor users/comedian_profiles): the
-- 2024 init was a stub, so live DBs only had these via hand-creation.
--
-- Verification (2026-09-10, dev DB):
--   FKs stay intra-service (users/comedian_profiles created here);
--   replay from empty produces the complete schema.prisma shape.

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_clips" (
    "id" TEXT NOT NULL,
    "comedianId" TEXT,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_clips_pkey" PRIMARY KEY ("id")
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
CREATE TABLE IF NOT EXISTS "comedian_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "banner" TEXT,
    "socialLinks" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedian_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "clip_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clip_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "clip_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clip_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "clip_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clip_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "banner" TEXT,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_episodes" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "mediaUrl" TEXT,
    "duration" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "challenge_prizes" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_challenge_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "clipUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_challenge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_specials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "comedianId" TEXT NOT NULL,
    "genre" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "releaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_specials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "special_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comedy_trends" (
    "id" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comedy_trends_pkey" PRIMARY KEY ("id")
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
CREATE INDEX IF NOT EXISTS "comedy_clips_comedianId_idx" ON "comedy_clips"("comedianId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_clips_creatorId_idx" ON "comedy_clips"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "comedian_profiles_userId_key" ON "comedian_profiles"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_shares_userId_idx" ON "clip_shares"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_shares_clipId_idx" ON "clip_shares"("clipId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "clip_shares_userId_clipId_key" ON "clip_shares"("userId", "clipId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_likes_userId_idx" ON "clip_likes"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_likes_clipId_idx" ON "clip_likes"("clipId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "clip_likes_userId_clipId_key" ON "clip_likes"("userId", "clipId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_comments_userId_idx" ON "clip_comments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clip_comments_clipId_idx" ON "clip_comments"("clipId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_series_creatorId_idx" ON "comedy_series"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_series_status_idx" ON "comedy_series"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_episodes_seriesId_idx" ON "comedy_episodes"("seriesId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_challenges_status_idx" ON "comedy_challenges"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "challenge_prizes_challengeId_idx" ON "challenge_prizes"("challengeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_challenge_entries_userId_idx" ON "comedy_challenge_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_challenge_entries_challengeId_idx" ON "comedy_challenge_entries"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "comedy_challenge_entries_userId_challengeId_key" ON "comedy_challenge_entries"("userId", "challengeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_specials_comedianId_idx" ON "comedy_specials"("comedianId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_specials_isPremium_idx" ON "comedy_specials"("isPremium");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "special_likes_userId_idx" ON "special_likes"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "special_likes_specialId_idx" ON "special_likes"("specialId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "special_likes_userId_specialId_key" ON "special_likes"("userId", "specialId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "comedy_trends_clipId_idx" ON "comedy_trends"("clipId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "comedy_trends_clipId_period_key" ON "comedy_trends"("clipId", "period");

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
ALTER TABLE "comedy_clips" ADD CONSTRAINT "comedy_clips_comedianId_fkey" FOREIGN KEY ("comedianId") REFERENCES "comedian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_clips" ADD CONSTRAINT "comedy_clips_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_shares" ADD CONSTRAINT "clip_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_shares" ADD CONSTRAINT "clip_shares_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "comedy_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_likes" ADD CONSTRAINT "clip_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_likes" ADD CONSTRAINT "clip_likes_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "comedy_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_comments" ADD CONSTRAINT "clip_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clip_comments" ADD CONSTRAINT "clip_comments_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "comedy_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_series" ADD CONSTRAINT "comedy_series_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_episodes" ADD CONSTRAINT "comedy_episodes_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "comedy_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_prizes" ADD CONSTRAINT "challenge_prizes_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "comedy_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_challenge_entries" ADD CONSTRAINT "comedy_challenge_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_challenge_entries" ADD CONSTRAINT "comedy_challenge_entries_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "comedy_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_specials" ADD CONSTRAINT "comedy_specials_comedianId_fkey" FOREIGN KEY ("comedianId") REFERENCES "comedian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_likes" ADD CONSTRAINT "special_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_likes" ADD CONSTRAINT "special_likes_specialId_fkey" FOREIGN KEY ("specialId") REFERENCES "comedy_specials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comedy_trends" ADD CONSTRAINT "comedy_trends_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "comedy_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "comedian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

