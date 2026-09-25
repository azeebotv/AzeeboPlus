-- Compensating queue for CDN invalidations that failed or were skipped at
-- delete time. The nightly job (CdnInvalidationQueueService) retries pending
-- rows and dead-letters them after MEDIA_CDN_INVALIDATION_MAX_ATTEMPTS so a
-- broken CloudFront can't grow the queue unbounded.
CREATE TABLE "cdn_invalidation_queue" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'failed',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdn_invalidation_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cdn_invalidation_queue_status_idx" ON "cdn_invalidation_queue"("status");
