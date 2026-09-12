-- AlterTable
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "allowedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "blockedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "contentRating" TEXT,
ADD COLUMN IF NOT EXISTS "minAge" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "geo_restrictions" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blockedContent" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "downloads" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quality" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "url" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "share_links" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "share_events" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "containsSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_helpfuls" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpfuls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "geo_restrictions_countryCode_idx" ON "geo_restrictions"("countryCode");
CREATE INDEX IF NOT EXISTS "geo_restrictions_isActive_idx" ON "geo_restrictions"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "geo_restrictions_countryCode_key" ON "geo_restrictions"("countryCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "downloads_userId_idx" ON "downloads"("userId");
CREATE INDEX IF NOT EXISTS "downloads_contentId_idx" ON "downloads"("contentId");
CREATE INDEX IF NOT EXISTS "downloads_userId_status_idx" ON "downloads"("userId", "status");
CREATE INDEX IF NOT EXISTS "downloads_expiresAt_idx" ON "downloads"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "share_links_shortCode_key" ON "share_links"("shortCode");
CREATE INDEX IF NOT EXISTS "share_links_contentId_idx" ON "share_links"("contentId");
CREATE INDEX IF NOT EXISTS "share_links_shortCode_idx" ON "share_links"("shortCode");
CREATE INDEX IF NOT EXISTS "share_links_platform_idx" ON "share_links"("platform");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "share_events_contentId_idx" ON "share_events"("contentId");
CREATE INDEX IF NOT EXISTS "share_events_platform_idx" ON "share_events"("platform");
CREATE INDEX IF NOT EXISTS "share_events_timestamp_idx" ON "share_events"("timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_contentId_idx" ON "reviews"("contentId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx" ON "reviews"("rating");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");
CREATE INDEX IF NOT EXISTS "reviews_createdAt_idx" ON "reviews"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_contentId_userId_key" ON "reviews"("contentId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_helpfuls_reviewId_idx" ON "review_helpfuls"("reviewId");
CREATE INDEX IF NOT EXISTS "review_helpfuls_userId_idx" ON "review_helpfuls"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "review_helpfuls_reviewId_userId_key" ON "review_helpfuls"("reviewId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_reports_reviewId_idx" ON "review_reports"("reviewId");
CREATE INDEX IF NOT EXISTS "review_reports_status_idx" ON "review_reports"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_items_universeId_status_idx" ON "content_items"("universeId", "status");
CREATE INDEX IF NOT EXISTS "content_items_creatorId_status_idx" ON "content_items"("creatorId", "status");
