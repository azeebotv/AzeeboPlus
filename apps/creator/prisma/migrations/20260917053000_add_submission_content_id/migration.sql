-- Attach picked portal uploads to challenge submissions.

ALTER TABLE "challenge_submissions" ADD COLUMN     "contentId" TEXT;
