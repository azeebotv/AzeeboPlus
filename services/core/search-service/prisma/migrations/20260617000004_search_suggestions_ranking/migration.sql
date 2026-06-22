-- CreateTable: Suggestion
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "term" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "universe" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suggestions_term_key" ON "suggestions"("term");
CREATE INDEX "suggestions_type_idx" ON "suggestions"("type");
CREATE INDEX "suggestions_universe_idx" ON "suggestions"("universe");
CREATE INDEX "suggestions_isActive_idx" ON "suggestions"("isActive");
CREATE INDEX "suggestions_weight_idx" ON "suggestions"("weight");

-- CreateTable: RankingRule
CREATE TABLE "ranking_rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "signal" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "conditions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ranking_rules_name_key" ON "ranking_rules"("name");
CREATE INDEX "ranking_rules_signal_idx" ON "ranking_rules"("signal");
CREATE INDEX "ranking_rules_isActive_idx" ON "ranking_rules"("isActive");
CREATE INDEX "ranking_rules_priority_idx" ON "ranking_rules"("priority");
