-- CreateTable
CREATE TABLE "music_artists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "monthlyListeners" INTEGER NOT NULL DEFAULT 0,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "topTracks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_artists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "music_artists_name_key" ON "music_artists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "music_artists_slug_key" ON "music_artists"("slug");

-- CreateIndex
CREATE INDEX "music_artists_genre_idx" ON "music_artists"("genre");

-- CreateIndex
CREATE INDEX "music_artists_monthlyListeners_idx" ON "music_artists"("monthlyListeners");

