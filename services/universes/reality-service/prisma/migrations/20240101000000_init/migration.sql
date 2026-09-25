-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "reality_shows" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "banner" TEXT,
    "universeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_seasons" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_episodes" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "seasonId" TEXT,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "mediaUrl" TEXT,
    "airedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_contestants" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_contestants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "episodeId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_supervotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_supervotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "episodeId" TEXT,
    "contestantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_clips" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_premium_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,
    "extraName" TEXT NOT NULL,
    "extraType" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "duration" INTEGER,
    "purchaseId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "reality_premium_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_show_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_show_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_show_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_show_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reality_show_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_show_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reality_shows_universeId_idx" ON "reality_shows"("universeId");

-- CreateIndex
CREATE INDEX "reality_shows_status_idx" ON "reality_shows"("status");

-- CreateIndex
CREATE INDEX "reality_seasons_showId_idx" ON "reality_seasons"("showId");

-- CreateIndex
CREATE INDEX "reality_episodes_showId_idx" ON "reality_episodes"("showId");

-- CreateIndex
CREATE INDEX "reality_episodes_seasonId_idx" ON "reality_episodes"("seasonId");

-- CreateIndex
CREATE INDEX "reality_episodes_airedAt_idx" ON "reality_episodes"("airedAt");

-- CreateIndex
CREATE INDEX "reality_contestants_showId_idx" ON "reality_contestants"("showId");

-- CreateIndex
CREATE INDEX "reality_votes_userId_idx" ON "reality_votes"("userId");

-- CreateIndex
CREATE INDEX "reality_votes_contestantId_idx" ON "reality_votes"("contestantId");

-- CreateIndex
CREATE INDEX "reality_votes_showId_idx" ON "reality_votes"("showId");

-- CreateIndex
CREATE INDEX "reality_votes_episodeId_idx" ON "reality_votes"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "reality_votes_userId_contestantId_key" ON "reality_votes"("userId", "contestantId");

-- CreateIndex
CREATE INDEX "reality_supervotes_userId_idx" ON "reality_supervotes"("userId");

-- CreateIndex
CREATE INDEX "reality_supervotes_contestantId_idx" ON "reality_supervotes"("contestantId");

-- CreateIndex
CREATE INDEX "reality_supervotes_showId_idx" ON "reality_supervotes"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "reality_supervotes_userId_contestantId_key" ON "reality_supervotes"("userId", "contestantId");

-- CreateIndex
CREATE INDEX "reality_predictions_userId_idx" ON "reality_predictions"("userId");

-- CreateIndex
CREATE INDEX "reality_predictions_showId_idx" ON "reality_predictions"("showId");

-- CreateIndex
CREATE INDEX "reality_predictions_episodeId_idx" ON "reality_predictions"("episodeId");

-- CreateIndex
CREATE INDEX "reality_predictions_contestantId_idx" ON "reality_predictions"("contestantId");

-- CreateIndex
CREATE INDEX "reality_clips_showId_idx" ON "reality_clips"("showId");

-- CreateIndex
CREATE INDEX "reality_clips_creatorId_idx" ON "reality_clips"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "reality_premium_purchases_purchaseId_key" ON "reality_premium_purchases"("purchaseId");

-- CreateIndex
CREATE INDEX "reality_premium_purchases_userId_idx" ON "reality_premium_purchases"("userId");

-- CreateIndex
CREATE INDEX "reality_premium_purchases_extraId_idx" ON "reality_premium_purchases"("extraId");

-- CreateIndex
CREATE INDEX "reality_premium_purchases_purchaseId_idx" ON "reality_premium_purchases"("purchaseId");

-- CreateIndex
CREATE INDEX "reality_premium_purchases_status_idx" ON "reality_premium_purchases"("status");

-- CreateIndex
CREATE INDEX "reality_show_likes_userId_idx" ON "reality_show_likes"("userId");

-- CreateIndex
CREATE INDEX "reality_show_likes_showId_idx" ON "reality_show_likes"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "reality_show_likes_userId_showId_key" ON "reality_show_likes"("userId", "showId");

-- CreateIndex
CREATE INDEX "reality_show_comments_userId_idx" ON "reality_show_comments"("userId");

-- CreateIndex
CREATE INDEX "reality_show_comments_showId_idx" ON "reality_show_comments"("showId");

-- CreateIndex
CREATE INDEX "reality_show_comments_createdAt_idx" ON "reality_show_comments"("createdAt");

-- CreateIndex
CREATE INDEX "reality_show_shares_userId_idx" ON "reality_show_shares"("userId");

-- CreateIndex
CREATE INDEX "reality_show_shares_showId_idx" ON "reality_show_shares"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "reality_seasons" ADD CONSTRAINT "reality_seasons_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_episodes" ADD CONSTRAINT "reality_episodes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_episodes" ADD CONSTRAINT "reality_episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "reality_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_contestants" ADD CONSTRAINT "reality_contestants_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_votes" ADD CONSTRAINT "reality_votes_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "reality_contestants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_votes" ADD CONSTRAINT "reality_votes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_votes" ADD CONSTRAINT "reality_votes_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "reality_episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_supervotes" ADD CONSTRAINT "reality_supervotes_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "reality_contestants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_supervotes" ADD CONSTRAINT "reality_supervotes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_predictions" ADD CONSTRAINT "reality_predictions_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_predictions" ADD CONSTRAINT "reality_predictions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "reality_episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_predictions" ADD CONSTRAINT "reality_predictions_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "reality_contestants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_clips" ADD CONSTRAINT "reality_clips_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_clips" ADD CONSTRAINT "reality_clips_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_show_likes" ADD CONSTRAINT "reality_show_likes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_show_comments" ADD CONSTRAINT "reality_show_comments_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reality_show_shares" ADD CONSTRAINT "reality_show_shares_showId_fkey" FOREIGN KEY ("showId") REFERENCES "reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

