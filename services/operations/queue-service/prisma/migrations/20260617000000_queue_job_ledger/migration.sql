-- Queue-service schema remediation (Task 14.1)
-- Removes duplicated reference models (User, Wallet, Notification, PaymentIntent,
-- Refund, PushToken, WatchHistory, SavedItem, WalletTransaction) that were carried
-- for local relation support but are NOT owned by queue-service.
-- Adds the intended queue-domain models (Job, JobRetry, JobSchedule, DeadLetterEntry)
-- per AZEEBO-CLAUDE-BUILD.md §6.13 reconciliation note.

-- Drop duplicated reference models (owned by other services)
DROP TABLE IF EXISTS "push_tokens" CASCADE;
DROP TABLE IF EXISTS "refunds" CASCADE;
DROP TABLE IF EXISTS "payment_intents" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "wallet_transactions" CASCADE;
DROP TABLE IF EXISTS "wallets" CASCADE;
DROP TABLE IF EXISTS "saved_items" CASCADE;
DROP TABLE IF EXISTS "watch_history" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Create queue-domain models

CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "jobs_type_idx" ON "jobs"("type");
CREATE INDEX "jobs_status_idx" ON "jobs"("status");
CREATE INDEX "jobs_priority_idx" ON "jobs"("priority");
CREATE INDEX "jobs_nextRetryAt_idx" ON "jobs"("nextRetryAt");
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

CREATE TABLE "job_retries" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "error" TEXT NOT NULL,
    "stackTrace" TEXT,
    "retriedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_retries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_retries_jobId_idx" ON "job_retries"("jobId");
CREATE INDEX "job_retries_retriedAt_idx" ON "job_retries"("retriedAt");

CREATE TABLE "job_schedules" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_schedules_isActive_idx" ON "job_schedules"("isActive");
CREATE INDEX "job_schedules_nextRunAt_idx" ON "job_schedules"("nextRunAt");

CREATE TABLE "dead_letter_entries" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dead_letter_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dead_letter_entries_jobId_key" ON "dead_letter_entries"("jobId");
CREATE INDEX "dead_letter_entries_type_idx" ON "dead_letter_entries"("type");
CREATE INDEX "dead_letter_entries_movedAt_idx" ON "dead_letter_entries"("movedAt");

-- Add foreign key constraints
ALTER TABLE "job_retries" ADD CONSTRAINT "job_retries_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;

ALTER TABLE "dead_letter_entries" ADD CONSTRAINT "dead_letter_entries_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;
