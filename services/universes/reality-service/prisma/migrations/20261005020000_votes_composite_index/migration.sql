-- Hot vote-fraud predicate: COUNT(DISTINCT userId) filtered by
-- (showId, contestantId, createdAt) — previously served by three
-- single-column indexes requiring a wide scan intersection.
CREATE INDEX "reality_votes_showId_contestantId_createdAt_idx"
  ON "reality_votes"("showId", "contestantId", "createdAt");
