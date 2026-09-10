-- Squashed baseline: full schema as of the current schema.prisma.
-- Replaces the historical migration chain, which could not replay from an
-- empty database (base tables were created outside Prisma migrations).
-- The historical folder is preserved at prisma/migrations-legacy/ for
-- reference; live databases that already recorded the old chain skip this
-- migration by its unchanged name.

-- CreateTable
CREATE TABLE "universe_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universe_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "universeId" TEXT NOT NULL,
    "parentId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "universeId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_locations" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_relationships" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "universeId" TEXT NOT NULL,
    "characterId" TEXT,
    "locationId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "releaseYear" INTEGER,
    "endYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "rating" DOUBLE PRECISION,
    "universeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "number" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "content" TEXT,
    "wordCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "universeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lore_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crossovers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'announced',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crossovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crossover_titles" (
    "id" TEXT NOT NULL,
    "crossoverId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,

    CONSTRAINT "crossover_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recaps" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "season" INTEGER,
    "episode" INTEGER,
    "name" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'physical',
    "parentId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orisa_files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "domain" TEXT,
    "symbols" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orisa_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'physical',
    "power" TEXT,
    "origin" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prophecies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fulfilledAt" TIMESTAMP(3),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prophecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'geographic',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "universeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_posts" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "spoilerLevel" TEXT NOT NULL DEFAULT 'none',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "spoilerLevel" TEXT NOT NULL DEFAULT 'none',
    "accessLevel" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'published',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universe_maps_slug_key" ON "universe_maps"("slug");

-- CreateIndex
CREATE INDEX "universe_maps_slug_idx" ON "universe_maps"("slug");

-- CreateIndex
CREATE INDEX "universe_maps_status_idx" ON "universe_maps"("status");

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- CreateIndex
CREATE INDEX "locations_universeId_idx" ON "locations"("universeId");

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_slug_key" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "characters_universeId_idx" ON "characters"("universeId");

-- CreateIndex
CREATE INDEX "characters_slug_idx" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "character_locations_characterId_idx" ON "character_locations"("characterId");

-- CreateIndex
CREATE INDEX "character_locations_locationId_idx" ON "character_locations"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "character_locations_characterId_locationId_key" ON "character_locations"("characterId", "locationId");

-- CreateIndex
CREATE INDEX "character_relationships_fromId_idx" ON "character_relationships"("fromId");

-- CreateIndex
CREATE INDEX "character_relationships_toId_idx" ON "character_relationships"("toId");

-- CreateIndex
CREATE INDEX "character_relationships_type_idx" ON "character_relationships"("type");

-- CreateIndex
CREATE INDEX "timeline_events_universeId_idx" ON "timeline_events"("universeId");

-- CreateIndex
CREATE INDEX "timeline_events_characterId_idx" ON "timeline_events"("characterId");

-- CreateIndex
CREATE INDEX "timeline_events_date_idx" ON "timeline_events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "titles_slug_key" ON "titles"("slug");

-- CreateIndex
CREATE INDEX "titles_universeId_idx" ON "titles"("universeId");

-- CreateIndex
CREATE INDEX "titles_status_idx" ON "titles"("status");

-- CreateIndex
CREATE INDEX "chapters_titleId_idx" ON "chapters"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "lore_entries_slug_key" ON "lore_entries"("slug");

-- CreateIndex
CREATE INDEX "lore_entries_universeId_idx" ON "lore_entries"("universeId");

-- CreateIndex
CREATE INDEX "lore_entries_category_idx" ON "lore_entries"("category");

-- CreateIndex
CREATE UNIQUE INDEX "crossovers_slug_key" ON "crossovers"("slug");

-- CreateIndex
CREATE INDEX "crossovers_status_idx" ON "crossovers"("status");

-- CreateIndex
CREATE INDEX "crossover_titles_crossoverId_idx" ON "crossover_titles"("crossoverId");

-- CreateIndex
CREATE INDEX "crossover_titles_titleId_idx" ON "crossover_titles"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "crossover_titles_crossoverId_titleId_key" ON "crossover_titles"("crossoverId", "titleId");

-- CreateIndex
CREATE INDEX "recaps_titleId_idx" ON "recaps"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "realms_slug_key" ON "realms"("slug");

-- CreateIndex
CREATE INDEX "realms_universeId_idx" ON "realms"("universeId");

-- CreateIndex
CREATE INDEX "realms_slug_idx" ON "realms"("slug");

-- CreateIndex
CREATE INDEX "realms_type_idx" ON "realms"("type");

-- CreateIndex
CREATE UNIQUE INDEX "orisa_files_slug_key" ON "orisa_files"("slug");

-- CreateIndex
CREATE INDEX "orisa_files_universeId_idx" ON "orisa_files"("universeId");

-- CreateIndex
CREATE INDEX "orisa_files_slug_idx" ON "orisa_files"("slug");

-- CreateIndex
CREATE INDEX "orisa_files_domain_idx" ON "orisa_files"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_slug_key" ON "artifacts"("slug");

-- CreateIndex
CREATE INDEX "artifacts_universeId_idx" ON "artifacts"("universeId");

-- CreateIndex
CREATE INDEX "artifacts_slug_idx" ON "artifacts"("slug");

-- CreateIndex
CREATE INDEX "artifacts_type_idx" ON "artifacts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "prophecies_slug_key" ON "prophecies"("slug");

-- CreateIndex
CREATE INDEX "prophecies_universeId_idx" ON "prophecies"("universeId");

-- CreateIndex
CREATE INDEX "prophecies_slug_idx" ON "prophecies"("slug");

-- CreateIndex
CREATE INDEX "prophecies_status_idx" ON "prophecies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "world_maps_slug_key" ON "world_maps"("slug");

-- CreateIndex
CREATE INDEX "world_maps_universeId_idx" ON "world_maps"("universeId");

-- CreateIndex
CREATE INDEX "world_maps_slug_idx" ON "world_maps"("slug");

-- CreateIndex
CREATE INDEX "world_maps_type_idx" ON "world_maps"("type");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_slug_key" ON "rooms"("slug");

-- CreateIndex
CREATE INDEX "rooms_universeId_idx" ON "rooms"("universeId");

-- CreateIndex
CREATE INDEX "rooms_slug_idx" ON "rooms"("slug");

-- CreateIndex
CREATE INDEX "room_posts_roomId_idx" ON "room_posts"("roomId");

-- CreateIndex
CREATE INDEX "room_posts_authorId_idx" ON "room_posts"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "theories_slug_key" ON "theories"("slug");

-- CreateIndex
CREATE INDEX "theories_authorId_idx" ON "theories"("authorId");

-- CreateIndex
CREATE INDEX "theories_slug_idx" ON "theories"("slug");

-- CreateIndex
CREATE INDEX "theories_status_idx" ON "theories"("status");

-- CreateIndex
CREATE INDEX "theories_accessLevel_idx" ON "theories"("accessLevel");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_locations" ADD CONSTRAINT "character_locations_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_locations" ADD CONSTRAINT "character_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_toId_fkey" FOREIGN KEY ("toId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titles" ADD CONSTRAINT "titles_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_entries" ADD CONSTRAINT "lore_entries_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crossover_titles" ADD CONSTRAINT "crossover_titles_crossoverId_fkey" FOREIGN KEY ("crossoverId") REFERENCES "crossovers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crossover_titles" ADD CONSTRAINT "crossover_titles_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaps" ADD CONSTRAINT "recaps_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realms" ADD CONSTRAINT "realms_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realms" ADD CONSTRAINT "realms_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "realms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orisa_files" ADD CONSTRAINT "orisa_files_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prophecies" ADD CONSTRAINT "prophecies_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_maps" ADD CONSTRAINT "world_maps_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_posts" ADD CONSTRAINT "room_posts_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

