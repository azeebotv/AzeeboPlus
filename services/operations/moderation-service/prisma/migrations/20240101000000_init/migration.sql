-- Squashed baseline: full schema as of the current schema.prisma.
-- Replaces the stub 20240101000000_init (which was empty) with the full table
-- set that the 2026-09-08 drift_sync had created. The drift_sync folder is
-- removed; this init is now the single baseline migration.
--
-- Replay safety:
--   * Fresh database (CI shadow / new env): CREATE TABLE / INDEX are IF NOT
--     EXISTS (always valid), FK constraints are plain ADD CONSTRAINT (correct
--     when no constraint exists yet) — produces the complete schema.prisma.
--   * Live database that already recorded 20240101000000_init: Prisma skips
--     an unchanged-named migration, so the new body is never re-applied.
--
-- PostgreSQL note: ADD CONSTRAINT IF NOT EXISTS does not exist in any PG
-- version, so FKs are plain ADD CONSTRAINT. Tables and indexes use IF NOT
-- EXISTS where PG supports it. Matching content/search/reward baseline style.

-- Moderation-service drift sync — REVIEWED
--
-- Creates the service's full table set (users/contents anchor tables plus
-- reports, moderation_cases, appeals, safety_scans, safety_actions,
-- trust_score_history, audit_events, reviewer_assignments): the 2024 init
-- was a stub, so live DBs only ever had these via hand-creation.
--
-- Verification (2026-09-10, dev DB):
--   init contains no CREATE TABLE (confirmed 0); replay from empty now
--   produces the complete schema.prisma shape.

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "reportingUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentId" TEXT,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolutionAction" TEXT,
    "resolutionReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "moderation_cases" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolutionAction" TEXT,
    "resolutionReason" TEXT,
    "resolution" TEXT,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "appeals" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolutionReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "safety_scans" (
    "id" TEXT NOT NULL,
    "contentId" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "details" JSONB,
    "threatLevel" TEXT,
    "categories" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "scanDurationMs" INTEGER,

    CONSTRAINT "safety_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "safety_actions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "trust_score_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_score_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_events" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "details" JSONB,
    "previousState" JSONB,
    "newState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reviewer_assignments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "status" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_reportingUserId_idx" ON "reports"("reportingUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_userId_idx" ON "reports"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_contentId_idx" ON "reports"("contentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "moderation_cases_reportId_key" ON "moderation_cases"("reportId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "moderation_cases_reportId_idx" ON "moderation_cases"("reportId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "moderation_cases_userId_idx" ON "moderation_cases"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "moderation_cases_resolvedBy_idx" ON "moderation_cases"("resolvedBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "moderation_cases_status_idx" ON "moderation_cases"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appeals_caseId_idx" ON "appeals"("caseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appeals_userId_idx" ON "appeals"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appeals_status_idx" ON "appeals"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_scans_contentId_idx" ON "safety_scans"("contentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_scans_status_idx" ON "safety_scans"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_scans_scanType_idx" ON "safety_scans"("scanType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_actions_targetId_targetType_idx" ON "safety_actions"("targetId", "targetType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_actions_moderatorId_idx" ON "safety_actions"("moderatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_actions_type_idx" ON "safety_actions"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "safety_actions_createdAt_idx" ON "safety_actions"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trust_score_history_userId_idx" ON "trust_score_history"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trust_score_history_createdAt_idx" ON "trust_score_history"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_events_resourceType_resourceId_idx" ON "audit_events"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_events_actorId_idx" ON "audit_events"("actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviewer_assignments_caseId_idx" ON "reviewer_assignments"("caseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviewer_assignments_reviewerId_idx" ON "reviewer_assignments"("reviewerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviewer_assignments_assignedBy_idx" ON "reviewer_assignments"("assignedBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviewer_assignments_status_idx" ON "reviewer_assignments"("status");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportingUserId_fkey" FOREIGN KEY ("reportingUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_actions" ADD CONSTRAINT "safety_actions_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_score_history" ADD CONSTRAINT "trust_score_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

