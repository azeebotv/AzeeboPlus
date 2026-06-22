-- CreateTable: EventSchema
CREATE TABLE "event_schemas" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "properties" JSONB NOT NULL,
    "required" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_schemas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_schemas_name_key" ON "event_schemas"("name");
CREATE INDEX "event_schemas_name_idx" ON "event_schemas"("name");
CREATE INDEX "event_schemas_isActive_idx" ON "event_schemas"("isActive");

-- CreateTable: ExperimentEvent
CREATE TABLE "experiment_events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "experimentKey" TEXT NOT NULL,
    "userId" TEXT,
    "variant" TEXT NOT NULL,
    "assignmentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "outcomeAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "experiment_events_experimentKey_idx" ON "experiment_events"("experimentKey");
CREATE INDEX "experiment_events_userId_idx" ON "experiment_events"("userId");
CREATE INDEX "experiment_events_variant_idx" ON "experiment_events"("variant");
CREATE INDEX "experiment_events_assignmentAt_idx" ON "experiment_events"("assignmentAt");
CREATE INDEX "experiment_events_outcome_idx" ON "experiment_events"("outcome");

-- CreateTable: ConversionMetric
CREATE TABLE "conversion_metrics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "funnelId" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "windowMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversion_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conversion_metrics_name_key" ON "conversion_metrics"("name");
CREATE INDEX "conversion_metrics_name_idx" ON "conversion_metrics"("name");
CREATE INDEX "conversion_metrics_triggerEvent_idx" ON "conversion_metrics"("triggerEvent");
CREATE INDEX "conversion_metrics_isActive_idx" ON "conversion_metrics"("isActive");

-- CreateTable: SessionSummary
CREATE TABLE "session_summaries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT,
    "universe" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "screenViews" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_summaries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "session_summaries_sessionId_key" ON "session_summaries"("sessionId");
CREATE INDEX "session_summaries_sessionId_idx" ON "session_summaries"("sessionId");
CREATE INDEX "session_summaries_userId_idx" ON "session_summaries"("userId");
CREATE INDEX "session_summaries_platform_idx" ON "session_summaries"("platform");
CREATE INDEX "session_summaries_universe_idx" ON "session_summaries"("universe");
CREATE INDEX "session_summaries_startedAt_idx" ON "session_summaries"("startedAt");
