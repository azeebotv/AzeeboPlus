-- Queue-service drift sync — REVIEWED
--
-- Re-adds job FKs after an id-shape mismatch (uuid default drop on
-- transcoding_jobs/upload_sessions), adds JobRetry.updatedAt, and creates
-- the composite (status, priority) + upload_sessions.uploadId indexes.
--
-- Verification (2026-09-10, dev DB):
--   job_retries = 0 rows -> NOT NULL updatedAt add cannot fail; FK drops
--   use IF EXISTS guards; replay matches schema.prisma.

-- DropForeignKey (IF EXISTS: live DBs that pruned these FKs must not fail
-- on a missing constraint name)
ALTER TABLE "dead_letter_entries" DROP CONSTRAINT IF EXISTS "dead_letter_entries_jobId_fkey";

-- DropForeignKey
ALTER TABLE "job_retries" DROP CONSTRAINT IF EXISTS "job_retries_jobId_fkey";

-- AlterTable
ALTER TABLE "job_retries" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "transcoding_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "upload_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "jobs_status_priority_idx" ON "jobs"("status", "priority");

-- CreateIndex
CREATE INDEX "upload_sessions_uploadId_idx" ON "upload_sessions"("uploadId");

-- AddForeignKey
ALTER TABLE "job_retries" ADD CONSTRAINT "job_retries_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dead_letter_entries" ADD CONSTRAINT "dead_letter_entries_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

