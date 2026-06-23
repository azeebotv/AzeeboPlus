-- CreateEnum
-- (No enums in this schema)

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'all',
    "timePeriod" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_userId_category_timePeriod_key" ON "leaderboard_entries"("userId", "category", "timePeriod");

-- CreateIndex
CREATE INDEX "leaderboard_entries_score_idx" ON "leaderboard_entries"("score");

-- CreateIndex
CREATE INDEX "leaderboard_entries_rank_idx" ON "leaderboard_entries"("rank");

-- CreateIndex
CREATE INDEX "leaderboard_entries_category_idx" ON "leaderboard_entries"("category");

-- CreateIndex
CREATE INDEX "leaderboard_entries_timePeriod_idx" ON "leaderboard_entries"("timePeriod");

-- CreateIndex
CREATE INDEX "predictions_userId_idx" ON "predictions"("userId");

-- CreateIndex
CREATE INDEX "predictions_contentId_idx" ON "predictions"("contentId");

-- CreateIndex
CREATE INDEX "predictions_isCorrect_idx" ON "predictions"("isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_userId_category_period_key" ON "rankings"("userId", "category", "period");

-- CreateIndex
CREATE INDEX "rankings_category_idx" ON "rankings"("category");

-- CreateIndex
CREATE INDEX "rankings_score_idx" ON "rankings"("score");

-- CreateIndex
CREATE INDEX "rankings_rank_idx" ON "rankings"("rank");
