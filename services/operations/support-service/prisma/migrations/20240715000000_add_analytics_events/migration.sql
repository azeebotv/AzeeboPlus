-- Create SupportAnalyticsEvent table
CREATE TABLE "support_analytics_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_analytics_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "support_analytics_events_event_idx" ON "support_analytics_events"("event");
CREATE INDEX "support_analytics_events_createdAt_idx" ON "support_analytics_events"("createdAt");
