-- CreateTable
CREATE TABLE "canonical_events" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "universeId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canonical_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_units" (
    "id" TEXT NOT NULL,
    "canonicalEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "knowledgeType" TEXT NOT NULL,
    "spoilerLevel" TEXT NOT NULL DEFAULT 'none',
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equivalenceSetId" TEXT,

    CONSTRAINT "knowledge_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_dependencies" (
    "id" TEXT NOT NULL,
    "dependsOnEventId" TEXT NOT NULL,
    "dependsOnUnitId" TEXT NOT NULL,
    "dependentEventId" TEXT NOT NULL,
    "dependentUnitId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'prerequisite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_checkpoints" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "canonicalEventId" TEXT NOT NULL,
    "checkpointType" TEXT NOT NULL DEFAULT 'narrative',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "triggerCondition" JSONB,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_grants" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "grantType" TEXT NOT NULL DEFAULT 'automatic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoint_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalence_sets" (
    "id" TEXT NOT NULL,
    "setCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equivalence_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_knowledge_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "grantSource" TEXT NOT NULL,
    "sourceId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "supersedesId" TEXT,

    CONSTRAINT "user_knowledge_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_projections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "knownUnitIds" TEXT[] NOT NULL,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "knowledge_projections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canonical_events_eventCode_key" ON "canonical_events"("eventCode");

-- CreateIndex
CREATE INDEX "canonical_events_universeId_idx" ON "canonical_events"("universeId");

-- CreateIndex
CREATE INDEX "canonical_events_eventDate_idx" ON "canonical_events"("eventDate");

-- CreateIndex
CREATE INDEX "knowledge_units_canonicalEventId_idx" ON "knowledge_units"("canonicalEventId");

-- CreateIndex
CREATE INDEX "knowledge_units_knowledgeType_idx" ON "knowledge_units"("knowledgeType");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_dependencies_dependsOnUnitId_dependentUnitId_key" ON "knowledge_dependencies"("dependsOnUnitId", "dependentUnitId");

-- CreateIndex
CREATE INDEX "content_checkpoints_contentId_idx" ON "content_checkpoints"("contentId");

-- CreateIndex
CREATE INDEX "content_checkpoints_canonicalEventId_idx" ON "content_checkpoints"("canonicalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_grants_checkpointId_knowledgeUnitId_key" ON "checkpoint_grants"("checkpointId", "knowledgeUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "equivalence_sets_setCode_key" ON "equivalence_sets"("setCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_knowledge_grants_userId_knowledgeUnitId_key" ON "user_knowledge_grants"("userId", "knowledgeUnitId");

-- CreateIndex
CREATE INDEX "user_knowledge_grants_userId_idx" ON "user_knowledge_grants"("userId");

-- CreateIndex
CREATE INDEX "user_knowledge_grants_knowledgeUnitId_idx" ON "user_knowledge_grants"("knowledgeUnitId");

-- CreateIndex
CREATE INDEX "user_knowledge_grants_grantedAt_idx" ON "user_knowledge_grants"("grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_projections_userId_key" ON "knowledge_projections"("userId");

-- CreateIndex
CREATE INDEX "knowledge_projections_lastComputedAt_idx" ON "knowledge_projections"("lastComputedAt");

-- AddForeignKey
ALTER TABLE "knowledge_units" ADD CONSTRAINT "knowledge_units_canonicalEventId_fkey" FOREIGN KEY ("canonicalEventId") REFERENCES "canonical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_units" ADD CONSTRAINT "knowledge_units_equivalenceSetId_fkey" FOREIGN KEY ("equivalenceSetId") REFERENCES "equivalence_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_dependencies" ADD CONSTRAINT "knowledge_dependencies_dependsOnEventId_fkey" FOREIGN KEY ("dependsOnEventId") REFERENCES "canonical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_dependencies" ADD CONSTRAINT "knowledge_dependencies_dependsOnUnitId_fkey" FOREIGN KEY ("dependsOnUnitId") REFERENCES "knowledge_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_dependencies" ADD CONSTRAINT "knowledge_dependencies_dependentEventId_fkey" FOREIGN KEY ("dependentEventId") REFERENCES "canonical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_dependencies" ADD CONSTRAINT "knowledge_dependencies_dependentUnitId_fkey" FOREIGN KEY ("dependentUnitId") REFERENCES "knowledge_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_checkpoints" ADD CONSTRAINT "content_checkpoints_canonicalEventId_fkey" FOREIGN KEY ("canonicalEventId") REFERENCES "canonical_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_grants" ADD CONSTRAINT "checkpoint_grants_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "content_checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_grants" ADD CONSTRAINT "checkpoint_grants_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "knowledge_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_knowledge_grants" ADD CONSTRAINT "user_knowledge_grants_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "knowledge_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
