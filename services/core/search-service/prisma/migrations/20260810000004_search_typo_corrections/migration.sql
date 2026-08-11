-- Learned 'did you mean' typo dictionary: one row per (original query →
-- accepted correction) pair, with an incrementing acceptance count. The
-- search service upserts on every accepted correction logged via
-- POST /v1/search/log and consults the counts when choosing suggestions
-- (search_typo_dictionary flag), so popular corrections get sticky.
CREATE TABLE IF NOT EXISTS "search_typo_corrections" (
  "id" TEXT NOT NULL,
  "originalQuery" TEXT NOT NULL,
  "correctedQuery" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lastAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "search_typo_corrections_pkey" PRIMARY KEY ("id")
);

-- A user accepting the same correction repeatedly increments, not duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS "search_typo_corrections_originalQuery_correctedQuery_key"
  ON "search_typo_corrections"("originalQuery", "correctedQuery");

-- Lookups by original query ordered by popularity (count DESC).
CREATE INDEX IF NOT EXISTS "search_typo_corrections_originalQuery_count_idx"
  ON "search_typo_corrections"("originalQuery", "count" DESC);
