-- Review metadata on the portal's local submission mirror: creators see WHEN
-- their entry was judged and by WHOM, synced from creator-service entries.
ALTER TABLE "challenge_submissions" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "challenge_submissions" ADD COLUMN "reviewedByName" TEXT;
