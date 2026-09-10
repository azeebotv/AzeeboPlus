-- Squashed baseline: full schema as of the current schema.prisma.
-- Replaces the historical migration chain, which could not replay from an
-- empty database (base tables were created outside Prisma migrations).
-- The historical folder is preserved at prisma/migrations-legacy/ for
-- reference; live databases that already recorded the old chain skip this
-- migration by its unchanged name.

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "universe" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "signal" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "conditions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedId" TEXT,
    "lastSearchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedId" TEXT,
    "session" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "universeId" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "creatorName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "universe" TEXT,
    "email" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "universeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_typo_corrections" (
    "id" TEXT NOT NULL,
    "originalQuery" TEXT NOT NULL,
    "correctedQuery" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_typo_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_term_key" ON "suggestions"("term");

-- CreateIndex
CREATE INDEX "suggestions_type_idx" ON "suggestions"("type");

-- CreateIndex
CREATE INDEX "suggestions_universe_idx" ON "suggestions"("universe");

-- CreateIndex
CREATE INDEX "suggestions_isActive_idx" ON "suggestions"("isActive");

-- CreateIndex
CREATE INDEX "suggestions_weight_idx" ON "suggestions"("weight");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_rules_name_key" ON "ranking_rules"("name");

-- CreateIndex
CREATE INDEX "ranking_rules_signal_idx" ON "ranking_rules"("signal");

-- CreateIndex
CREATE INDEX "ranking_rules_isActive_idx" ON "ranking_rules"("isActive");

-- CreateIndex
CREATE INDEX "ranking_rules_priority_idx" ON "ranking_rules"("priority");

-- CreateIndex
CREATE INDEX "user_searches_userId_idx" ON "user_searches"("userId");

-- CreateIndex
CREATE INDEX "user_searches_query_idx" ON "user_searches"("query");

-- CreateIndex
CREATE INDEX "user_searches_createdAt_idx" ON "user_searches"("createdAt");

-- CreateIndex
CREATE INDEX "user_searches_lastSearchAt_idx" ON "user_searches"("lastSearchAt");

-- CreateIndex
CREATE INDEX "search_query_logs_query_idx" ON "search_query_logs"("query");

-- CreateIndex
CREATE INDEX "search_query_logs_userId_idx" ON "search_query_logs"("userId");

-- CreateIndex
CREATE INDEX "search_query_logs_createdAt_idx" ON "search_query_logs"("createdAt");

-- CreateIndex
CREATE INDEX "content_items_universeId_idx" ON "content_items"("universeId");

-- CreateIndex
CREATE INDEX "content_items_universe_idx" ON "content_items"("universe");

-- CreateIndex
CREATE INDEX "content_items_contentType_idx" ON "content_items"("contentType");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "content_items_creatorId_idx" ON "content_items"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");

-- CreateIndex
CREATE INDEX "creator_profiles_userId_idx" ON "creator_profiles"("userId");

-- CreateIndex
CREATE INDEX "creator_profiles_universe_idx" ON "creator_profiles"("universe");

-- CreateIndex
CREATE UNIQUE INDEX "universes_name_key" ON "universes"("name");

-- CreateIndex
CREATE INDEX "universes_name_idx" ON "universes"("name");

-- CreateIndex
CREATE INDEX "universes_isEnabled_idx" ON "universes"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_universeId_idx" ON "categories"("universeId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "search_typo_corrections_originalQuery_count_idx" ON "search_typo_corrections"("originalQuery", "count");

-- CreateIndex
CREATE UNIQUE INDEX "search_typo_corrections_originalQuery_correctedQuery_key" ON "search_typo_corrections"("originalQuery", "correctedQuery");

