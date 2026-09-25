-- Genre catalog for the movie universe.
--
-- The genre module (src/modules/genre) reads/writes the `genres` table and
-- links movies via `movies.genreId`, but neither existed in any migration —
-- `prisma.genre` was always undefined, so GET /v1/genres could only return
-- an empty list and the mobile genre browser had nothing to show.

-- CreateTable
CREATE TABLE IF NOT EXISTS "genres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "genres_slug_key" ON "genres"("slug");

-- movies.genreId post-dates the init migration: add it before the FK.
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "genreId" TEXT;

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddIndex
CREATE INDEX IF NOT EXISTS "movies_genreId_idx" ON "movies"("genreId");
