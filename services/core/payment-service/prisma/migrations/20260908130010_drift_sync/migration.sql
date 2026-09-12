-- Payment-service drift sync — REVIEWED
--
-- Adds WebhookEvent.updatedAt (@updatedAt) and the non-unique idempotencyKey
-- indexes that @@index([idempotencyKey]) requires alongside the @unique keys
-- already created by init.
--
-- Verification (2026-09-10, dev DB):
--   webhook_events = 0 rows -> NOT NULL updatedAt add cannot fail;
--   unique _key indexes pre-existed in init; _idx additions match schema.

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "payment_intents_idempotencyKey_idx" ON "payment_intents"("idempotencyKey");

-- CreateIndex
CREATE INDEX "refunds_idempotencyKey_idx" ON "refunds"("idempotencyKey");

