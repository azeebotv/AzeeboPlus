-- Squashed baseline: full schema as of the current schema.prisma.
-- Replaces the historical migration chain, which could not replay from an
-- empty database (base tables were created outside Prisma migrations).
-- The historical folder is preserved at prisma/migrations-legacy/ for
-- reference; live databases that already recorded the old chain skip this
-- migration by its unchanged name.

-- CreateTable
CREATE TABLE "universes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "theatricalReleaseDate" TIMESTAMP(3),
    "streamingReleaseDate" TIMESTAMP(3),
    "windowEndDate" TIMESTAMP(3),
    "windowType" TEXT NOT NULL DEFAULT 'standard',
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "isPremiere" BOOLEAN NOT NULL DEFAULT false,
    "allowedCountries" TEXT[],
    "blockedCountries" TEXT[],
    "contentRating" TEXT,
    "minAge" INTEGER,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "format" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_relationships" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "relatedContentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passType" TEXT NOT NULL,
    "universeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "transactionId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenings" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "screeningTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "streamUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "maxViewers" INTEGER,
    "currentViewers" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locked_extras" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "extraType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "mediaUrl" TEXT,
    "price" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "unlockType" TEXT NOT NULL DEFAULT 'purchase',
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locked_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unlockType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "transactionId" TEXT,
    "price" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universe_feature_flags" (
    "id" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universe_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_restrictions" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blockedContent" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpfuls" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpfuls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToContentItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContentItemToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentItemToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "universes_name_key" ON "universes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "content_items_universeId_idx" ON "content_items"("universeId");

-- CreateIndex
CREATE INDEX "content_items_creatorId_idx" ON "content_items"("creatorId");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "content_items_viewCount_idx" ON "content_items"("viewCount");

-- CreateIndex
CREATE INDEX "content_items_publishedAt_idx" ON "content_items"("publishedAt");

-- CreateIndex
CREATE INDEX "content_items_releaseDate_idx" ON "content_items"("releaseDate");

-- CreateIndex
CREATE INDEX "content_items_isExclusive_idx" ON "content_items"("isExclusive");

-- CreateIndex
CREATE INDEX "content_items_isPremiere_idx" ON "content_items"("isPremiere");

-- CreateIndex
CREATE INDEX "content_items_universeId_status_idx" ON "content_items"("universeId", "status");

-- CreateIndex
CREATE INDEX "content_items_creatorId_status_idx" ON "content_items"("creatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_contentItemId_key" ON "media_assets"("contentItemId");

-- CreateIndex
CREATE INDEX "content_relationships_contentId_idx" ON "content_relationships"("contentId");

-- CreateIndex
CREATE INDEX "content_relationships_relatedContentId_idx" ON "content_relationships"("relatedContentId");

-- CreateIndex
CREATE INDEX "content_relationships_type_idx" ON "content_relationships"("type");

-- CreateIndex
CREATE UNIQUE INDEX "content_relationships_contentId_relatedContentId_key" ON "content_relationships"("contentId", "relatedContentId");

-- CreateIndex
CREATE INDEX "comments_contentId_idx" ON "comments"("contentId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "rentals_userId_idx" ON "rentals"("userId");

-- CreateIndex
CREATE INDEX "rentals_contentId_idx" ON "rentals"("contentId");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_endTime_idx" ON "rentals"("endTime");

-- CreateIndex
CREATE UNIQUE INDEX "rentals_userId_contentId_key" ON "rentals"("userId", "contentId");

-- CreateIndex
CREATE INDEX "passes_userId_idx" ON "passes"("userId");

-- CreateIndex
CREATE INDEX "passes_universeId_idx" ON "passes"("universeId");

-- CreateIndex
CREATE INDEX "passes_status_idx" ON "passes"("status");

-- CreateIndex
CREATE INDEX "passes_endTime_idx" ON "passes"("endTime");

-- CreateIndex
CREATE INDEX "screenings_contentId_idx" ON "screenings"("contentId");

-- CreateIndex
CREATE INDEX "screenings_screeningTime_idx" ON "screenings"("screeningTime");

-- CreateIndex
CREATE INDEX "screenings_status_idx" ON "screenings"("status");

-- CreateIndex
CREATE INDEX "locked_extras_contentId_idx" ON "locked_extras"("contentId");

-- CreateIndex
CREATE INDEX "locked_extras_extraType_idx" ON "locked_extras"("extraType");

-- CreateIndex
CREATE INDEX "user_unlocks_userId_idx" ON "user_unlocks"("userId");

-- CreateIndex
CREATE INDEX "user_unlocks_unlockType_idx" ON "user_unlocks"("unlockType");

-- CreateIndex
CREATE INDEX "user_unlocks_resourceId_idx" ON "user_unlocks"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_unlocks_userId_unlockType_resourceId_key" ON "user_unlocks"("userId", "unlockType", "resourceId");

-- CreateIndex
CREATE INDEX "watch_history_userId_idx" ON "watch_history"("userId");

-- CreateIndex
CREATE INDEX "watch_history_contentId_idx" ON "watch_history"("contentId");

-- CreateIndex
CREATE INDEX "watch_history_watchedAt_idx" ON "watch_history"("watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "watch_history_userId_contentId_key" ON "watch_history"("userId", "contentId");

-- CreateIndex
CREATE INDEX "universe_feature_flags_universeId_idx" ON "universe_feature_flags"("universeId");

-- CreateIndex
CREATE INDEX "universe_feature_flags_featureKey_idx" ON "universe_feature_flags"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "universe_feature_flags_universeId_featureKey_key" ON "universe_feature_flags"("universeId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_isPublic_idx" ON "system_settings"("isPublic");

-- CreateIndex
CREATE INDEX "geo_restrictions_countryCode_idx" ON "geo_restrictions"("countryCode");

-- CreateIndex
CREATE INDEX "geo_restrictions_isActive_idx" ON "geo_restrictions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "geo_restrictions_countryCode_key" ON "geo_restrictions"("countryCode");

-- CreateIndex
CREATE INDEX "downloads_userId_idx" ON "downloads"("userId");

-- CreateIndex
CREATE INDEX "downloads_contentId_idx" ON "downloads"("contentId");

-- CreateIndex
CREATE INDEX "downloads_userId_status_idx" ON "downloads"("userId", "status");

-- CreateIndex
CREATE INDEX "downloads_expiresAt_idx" ON "downloads"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_shortCode_key" ON "share_links"("shortCode");

-- CreateIndex
CREATE INDEX "share_links_contentId_idx" ON "share_links"("contentId");

-- CreateIndex
CREATE INDEX "share_links_shortCode_idx" ON "share_links"("shortCode");

-- CreateIndex
CREATE INDEX "share_links_platform_idx" ON "share_links"("platform");

-- CreateIndex
CREATE INDEX "share_events_contentId_idx" ON "share_events"("contentId");

-- CreateIndex
CREATE INDEX "share_events_platform_idx" ON "share_events"("platform");

-- CreateIndex
CREATE INDEX "share_events_timestamp_idx" ON "share_events"("timestamp");

-- CreateIndex
CREATE INDEX "reviews_contentId_idx" ON "reviews"("contentId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_contentId_userId_key" ON "reviews"("contentId", "userId");

-- CreateIndex
CREATE INDEX "review_helpfuls_reviewId_idx" ON "review_helpfuls"("reviewId");

-- CreateIndex
CREATE INDEX "review_helpfuls_userId_idx" ON "review_helpfuls"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpfuls_reviewId_userId_key" ON "review_helpfuls"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");

-- CreateIndex
CREATE INDEX "review_reports_status_idx" ON "review_reports"("status");

-- CreateIndex
CREATE INDEX "_CategoryToContentItem_B_index" ON "_CategoryToContentItem"("B");

-- CreateIndex
CREATE INDEX "_ContentItemToTag_B_index" ON "_ContentItemToTag"("B");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relationships" ADD CONSTRAINT "content_relationships_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_relationships" ADD CONSTRAINT "content_relationships_relatedContentId_fkey" FOREIGN KEY ("relatedContentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passes" ADD CONSTRAINT "passes_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locked_extras" ADD CONSTRAINT "locked_extras_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_feature_flags" ADD CONSTRAINT "universe_feature_flags_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpfuls" ADD CONSTRAINT "review_helpfuls_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_B_fkey" FOREIGN KEY ("B") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToTag" ADD CONSTRAINT "_ContentItemToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToTag" ADD CONSTRAINT "_ContentItemToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

