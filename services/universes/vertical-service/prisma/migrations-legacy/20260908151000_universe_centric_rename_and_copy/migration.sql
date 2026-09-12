-- Vertical-service schema sync (data-preserving restructure)
--
-- Legacy PascalCase storyworld tables -> new snake_case universe-centric
-- tables. 32 legacy rows preserved: Storyworld seeds the universe_maps
-- anchor, AgbalaTitle/Character/Realm/OrisaFile copy into titles/
-- characters/realms/orisa_files, all 37 old tables archived first.
--
-- Statement order: legacy FK drops -> create new tables -> copy data ->
-- indexes -> new FKs -> archive + drop legacy tables.

-- DropForeignKey
ALTER TABLE "AgbalaArtifact" DROP CONSTRAINT "AgbalaArtifact_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaArtifactTitle" DROP CONSTRAINT "AgbalaArtifactTitle_artifactId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaArtifactTitle" DROP CONSTRAINT "AgbalaArtifactTitle_titleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaAssemblyRoom" DROP CONSTRAINT "AgbalaAssemblyRoom_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaBlackCurrentExposure" DROP CONSTRAINT "AgbalaBlackCurrentExposure_characterId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaBlackCurrentExposure" DROP CONSTRAINT "AgbalaBlackCurrentExposure_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacter" DROP CONSTRAINT "AgbalaCharacter_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacterProphecy" DROP CONSTRAINT "AgbalaCharacterProphecy_characterId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacterProphecy" DROP CONSTRAINT "AgbalaCharacterProphecy_prophecyId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacterRealm" DROP CONSTRAINT "AgbalaCharacterRealm_characterId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacterRealm" DROP CONSTRAINT "AgbalaCharacterRealm_realmId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaCharacterTimeline" DROP CONSTRAINT "AgbalaCharacterTimeline_characterId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaMap" DROP CONSTRAINT "AgbalaMap_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaMapNode" DROP CONSTRAINT "AgbalaMapNode_mapId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaMemoryFile" DROP CONSTRAINT "AgbalaMemoryFile_requiredTitleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaMemoryFile" DROP CONSTRAINT "AgbalaMemoryFile_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaOrisaFile" DROP CONSTRAINT "AgbalaOrisaFile_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaProphecy" DROP CONSTRAINT "AgbalaProphecy_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaProphecyTitle" DROP CONSTRAINT "AgbalaProphecyTitle_prophecyId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaProphecyTitle" DROP CONSTRAINT "AgbalaProphecyTitle_titleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaQuizQuestion" DROP CONSTRAINT "AgbalaQuizQuestion_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaQuizResult" DROP CONSTRAINT "AgbalaQuizResult_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaRealm" DROP CONSTRAINT "AgbalaRealm_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaRoomPost" DROP CONSTRAINT "AgbalaRoomPost_parentPostId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaRoomPost" DROP CONSTRAINT "AgbalaRoomPost_roomId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaTheory" DROP CONSTRAINT "AgbalaTheory_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaTitle" DROP CONSTRAINT "AgbalaTitle_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaTitleChapter" DROP CONSTRAINT "AgbalaTitleChapter_titleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaTitleCharacter" DROP CONSTRAINT "AgbalaTitleCharacter_characterId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaTitleCharacter" DROP CONSTRAINT "AgbalaTitleCharacter_titleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaUnlockRule" DROP CONSTRAINT "AgbalaUnlockRule_memoryFileId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaUnlockRule" DROP CONSTRAINT "AgbalaUnlockRule_requiredTitleId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaUnlockRule" DROP CONSTRAINT "AgbalaUnlockRule_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaUserArchiveState" DROP CONSTRAINT "AgbalaUserArchiveState_quizResultId_fkey";

-- DropForeignKey
ALTER TABLE "AgbalaUserArchiveState" DROP CONSTRAINT "AgbalaUserArchiveState_storyworldId_fkey";

-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_titleId_fkey";

-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_universeId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterLocation" DROP CONSTRAINT "CharacterLocation_characterId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterLocation" DROP CONSTRAINT "CharacterLocation_locationId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterRelationship" DROP CONSTRAINT "CharacterRelationship_fromId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterRelationship" DROP CONSTRAINT "CharacterRelationship_toId_fkey";

-- DropForeignKey
ALTER TABLE "CrossoverTitle" DROP CONSTRAINT "CrossoverTitle_crossoverId_fkey";

-- DropForeignKey
ALTER TABLE "CrossoverTitle" DROP CONSTRAINT "CrossoverTitle_titleId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_universeId_fkey";

-- DropForeignKey
ALTER TABLE "LoreEntry" DROP CONSTRAINT "LoreEntry_universeId_fkey";

-- DropForeignKey
ALTER TABLE "Recap" DROP CONSTRAINT "Recap_titleId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_characterId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_locationId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_universeId_fkey";

-- DropForeignKey
ALTER TABLE "Title" DROP CONSTRAINT "Title_universeId_fkey";

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

-- ============================================================================
-- Data preservation: seed the universe anchor, then copy compatible legacy
-- rows into the new universe-centric tables.
--
-- The legacy data is storyworld-centric: a single "Storyworld" row
-- (agbala-olodumare, "Agbala Olodumare") parents 31 Agbala* rows. The new
-- schema keys everything on universe_maps.universeId, so the Storyworld row
-- becomes the universe_maps anchor and its children copy in beneath it.
-- Legacy columns with no new-table home are merged into the `data` JSONB
-- column so nothing readable is discarded.
-- ============================================================================

-- 1. universe_maps anchor from the legacy Storyworld row
INSERT INTO "universe_maps" ("id", "name", "slug", "description", "imageUrl", "data", "status", "createdAt", "updatedAt")
SELECT w."id", w."name", w."slug", w."description", w."imageUrl",
       COALESCE(w."config", '{}'::jsonb) || jsonb_build_object('legacySource', 'Storyworld', 'legacyUniverseId', w."universeId"),
       COALESCE(w."status", 'active'),
       w."createdAt", w."updatedAt"
FROM "Storyworld" w;

-- 2. titles <- AgbalaTitle (6 rows)
INSERT INTO "titles" ("id", "name", "slug", "type", "description", "coverImage", "releaseYear", "endYear", "status", "rating", "universeId", "viewCount", "createdAt", "updatedAt")
SELECT a."id", a."name", a."slug", a."type", a."description", a."coverImage", NULL, NULL,
       COALESCE(a."status", 'ongoing'), a."rating", s."id", COALESCE(a."viewCount", 0), a."createdAt", a."updatedAt"
FROM "AgbalaTitle" a CROSS JOIN "universe_maps" s WHERE s."slug" = 'agbala-olodumare';

-- 3. characters <- AgbalaCharacter (10 rows); legacy-only fields merged into data
INSERT INTO "characters" ("id", "name", "slug", "description", "avatarUrl", "role", "status", "universeId", "birthDate", "data", "createdAt", "updatedAt")
SELECT a."id", a."name", a."slug", a."description", a."avatarUrl", a."role",
       COALESCE(a."status", 'active'), s."id", NULL,
       COALESCE(a."data", '{}'::jsonb)
         || jsonb_build_object('legacySource', 'AgbalaCharacter', 'shortBio', a."shortBio", 'spoilerLevel', a."spoilerLevel", 'accessLevel', a."accessLevel", 'birthEra', a."birthEra", 'realm', a."realm", 'powers', a."powers", 'relationships', a."relationships"),
       a."createdAt", a."updatedAt"
FROM "AgbalaCharacter" a CROSS JOIN "universe_maps" s WHERE s."slug" = 'agbala-olodumare';

-- 4. realms <- AgbalaRealm (5 rows)
INSERT INTO "realms" ("id", "name", "slug", "description", "imageUrl", "universeId", "type", "parentId", "data", "createdAt", "updatedAt")
SELECT a."id", a."name", a."slug", a."description", a."imageUrl", s."id", 'physical', NULL,
       jsonb_build_object('legacySource', 'AgbalaRealm', 'mythology', a."mythology", 'rules', a."rules", 'status', a."status", 'spoilerLevel', a."spoilerLevel", 'accessLevel', a."accessLevel", 'order', a."order"),
       a."createdAt", a."updatedAt"
FROM "AgbalaRealm" a CROSS JOIN "universe_maps" s WHERE s."slug" = 'agbala-olodumare';

-- 5. orisa_files <- AgbalaOrisaFile (5 rows); symbols stays NULL (jsonb -> text[]
--    cast left to a future import), original preserved in data
INSERT INTO "orisa_files" ("id", "name", "slug", "title", "description", "imageUrl", "universeId", "domain", "symbols", "status", "data", "createdAt", "updatedAt")
SELECT a."id", a."name", a."slug", a."name", a."description", a."imageUrl", s."id", a."domain", NULL,
       COALESCE(a."publishStatus", 'active'),
       jsonb_build_object('legacySource', 'AgbalaOrisaFile', 'category', a."category", 'content', a."content", 'symbols', a."symbols", 'associatedCharacters', a."associatedCharacters", 'spoilerLevel', a."spoilerLevel", 'accessLevel', a."accessLevel", 'reviewStatus', a."reviewStatus", 'viewCount', a."viewCount"),
       a."createdAt", a."updatedAt"
FROM "AgbalaOrisaFile" a CROSS JOIN "universe_maps" s WHERE s."slug" = 'agbala-olodumare';

-- AgbalaQuizQuestion (5 rows) has no counterpart in the new schema; it is
-- archived intact below rather than copied.
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

-- ============================================================================
-- Archive and retire all 37 legacy PascalCase tables (0 rows after the
-- copies above; archived contents remain queryable in the archive schema).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS archive;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'AgbalaArtifact','AgbalaArtifactTitle','AgbalaAssemblyRoom','AgbalaBlackCurrentExposure',
        'AgbalaCharacter','AgbalaCharacterProphecy','AgbalaCharacterRealm','AgbalaCharacterTimeline',
        'AgbalaMap','AgbalaMapNode','AgbalaMemoryFile','AgbalaOrisaFile','AgbalaProphecy',
        'AgbalaProphecyTitle','AgbalaQuizQuestion','AgbalaQuizResult','AgbalaRealm','AgbalaRoomPost',
        'AgbalaTheory','AgbalaTitle','AgbalaTitleChapter','AgbalaTitleCharacter','AgbalaUnlockRule',
        'AgbalaUserArchiveState','Chapter','Character','CharacterLocation','CharacterRelationship',
        'Crossover','CrossoverTitle','Location','LoreEntry','Recap','Storyworld','TimelineEvent',
        'Title','UniverseMap'
    ]
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS archive.%I AS SELECT * FROM public.%I WITH NO DATA', t, t);
        EXECUTE format('INSERT INTO archive.%I SELECT * FROM public.%I', t, t);
    END LOOP;
END $$;

DROP TABLE "AgbalaArtifact";
DROP TABLE "AgbalaArtifactTitle";
DROP TABLE "AgbalaAssemblyRoom";
DROP TABLE "AgbalaBlackCurrentExposure";
DROP TABLE "AgbalaCharacter";
DROP TABLE "AgbalaCharacterProphecy";
DROP TABLE "AgbalaCharacterRealm";
DROP TABLE "AgbalaCharacterTimeline";
DROP TABLE "AgbalaMap";
DROP TABLE "AgbalaMapNode";
DROP TABLE "AgbalaMemoryFile";
DROP TABLE "AgbalaOrisaFile";
DROP TABLE "AgbalaProphecy";
DROP TABLE "AgbalaProphecyTitle";
DROP TABLE "AgbalaQuizQuestion";
DROP TABLE "AgbalaQuizResult";
DROP TABLE "AgbalaRealm";
DROP TABLE "AgbalaRoomPost";
DROP TABLE "AgbalaTheory";
DROP TABLE "AgbalaTitle";
DROP TABLE "AgbalaTitleChapter";
DROP TABLE "AgbalaTitleCharacter";
DROP TABLE "AgbalaUnlockRule";
DROP TABLE "AgbalaUserArchiveState";
DROP TABLE "Chapter";
DROP TABLE "Character";
DROP TABLE "CharacterLocation";
DROP TABLE "CharacterRelationship";
DROP TABLE "Crossover";
DROP TABLE "CrossoverTitle";
DROP TABLE "Location";
DROP TABLE "LoreEntry";
DROP TABLE "Recap";
DROP TABLE "Storyworld";
DROP TABLE "TimelineEvent";
DROP TABLE "Title";
DROP TABLE "UniverseMap";
