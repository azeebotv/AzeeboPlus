-- CreateTable: WebhookRetry
CREATE TABLE "webhook_retries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_retries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_retries_eventId_idx" ON "webhook_retries"("eventId");

-- CreateIndex
CREATE INDEX "webhook_retries_status_idx" ON "webhook_retries"("status");

-- CreateIndex
CREATE INDEX "webhook_retries_nextRetryAt_idx" ON "webhook_retries"("nextRetryAt");

-- CreateIndex
CREATE INDEX "webhook_retries_provider_idx" ON "webhook_retries"("provider");
