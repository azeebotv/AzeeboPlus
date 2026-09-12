-- Engagement-service drift sync — REVIEWED
--
-- Adds Prediction.category/metadata/status (nullable / defaulted, additive)
-- and creates ranking_history (new model) with its declared indexes.
--
-- Verification (2026-09-10, dev DB):
--   statements are purely additive; no backfill required; replay after
--   20260623000000_init matches schema.prisma.

-- AlterTable
ALTER TABLE "predictions" ADD COLUMN     "category" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "ranking_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ranking_history_userId_idx" ON "ranking_history"("userId");

-- CreateIndex
CREATE INDEX "ranking_history_category_idx" ON "ranking_history"("category");

-- CreateIndex
CREATE INDEX "ranking_history_period_idx" ON "ranking_history"("period");

-- CreateIndex
CREATE INDEX "ranking_history_recordedAt_idx" ON "ranking_history"("recordedAt");

-- CreateIndex
CREATE INDEX "predictions_category_idx" ON "predictions"("category");

-- CreateIndex
CREATE INDEX "predictions_status_idx" ON "predictions"("status");

-- CreateIndex
CREATE INDEX "predictions_createdAt_idx" ON "predictions"("createdAt");

