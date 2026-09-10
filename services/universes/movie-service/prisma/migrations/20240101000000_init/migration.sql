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

-- Movie-service drift sync — REVIEWED
--
-- Creates the service's full table set (movies/rentals/premieres/watchlist/
-- viewing windows/cinema passes/filmmaker projects + anchor users): the
-- 2024 init was a stub, so live DBs only had these via hand-creation.
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
CREATE TABLE IF NOT EXISTS "movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "banner" TEXT,
    "mediaUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "rentals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "premieres" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "watchlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "viewing_windows" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cinema_passes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cinema_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cinema_pass_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cinema_pass_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "filmmaker_projects" (
    "id" TEXT NOT NULL,
    "filmmakerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'development',
    "fundingGoal" DECIMAL(18,2),
    "fundingRaised" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filmmaker_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "filmmaker_updates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filmmaker_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "filmmaker_backers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filmmaker_backers_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movies_universeId_idx" ON "movies"("universeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movies_creatorId_idx" ON "movies"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movies_status_idx" ON "movies"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rentals_userId_idx" ON "rentals"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rentals_movieId_idx" ON "rentals"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rentals_userId_movieId_key" ON "rentals"("userId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "premieres_movieId_key" ON "premieres"("movieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "premieres_status_idx" ON "premieres"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watchlist_items_userId_idx" ON "watchlist_items"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watchlist_items_movieId_idx" ON "watchlist_items"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_userId_movieId_key" ON "watchlist_items"("userId", "movieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "viewing_windows_movieId_idx" ON "viewing_windows"("movieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "viewing_windows_type_idx" ON "viewing_windows"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "viewing_windows_isActive_idx" ON "viewing_windows"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cinema_pass_subscriptions_userId_idx" ON "cinema_pass_subscriptions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cinema_pass_subscriptions_passId_idx" ON "cinema_pass_subscriptions"("passId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cinema_pass_subscriptions_status_idx" ON "cinema_pass_subscriptions"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cinema_pass_subscriptions_paymentIntentId_idx" ON "cinema_pass_subscriptions"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cinema_pass_subscriptions_userId_passId_key" ON "cinema_pass_subscriptions"("userId", "passId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filmmaker_projects_filmmakerId_idx" ON "filmmaker_projects"("filmmakerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filmmaker_projects_status_idx" ON "filmmaker_projects"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filmmaker_updates_projectId_idx" ON "filmmaker_updates"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filmmaker_backers_projectId_idx" ON "filmmaker_backers"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filmmaker_backers_userId_idx" ON "filmmaker_backers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "filmmaker_backers_projectId_userId_key" ON "filmmaker_backers"("projectId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_creatorId_idx" ON "creator_earnings"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_earnings_status_idx" ON "creator_earnings"("status");

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premieres" ADD CONSTRAINT "premieres_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_windows" ADD CONSTRAINT "viewing_windows_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinema_pass_subscriptions" ADD CONSTRAINT "cinema_pass_subscriptions_passId_fkey" FOREIGN KEY ("passId") REFERENCES "cinema_passes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filmmaker_updates" ADD CONSTRAINT "filmmaker_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "filmmaker_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filmmaker_backers" ADD CONSTRAINT "filmmaker_backers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "filmmaker_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

