-- DropForeignKey
ALTER TABLE "user_segments" DROP CONSTRAINT "user_segments_segmentId_fkey";

-- AlterTable
ALTER TABLE "audience_segments" DROP COLUMN "definition",
DROP COLUMN "userCount",
ADD COLUMN     "criteria" JSONB;

-- AlterTable
ALTER TABLE "content_items" DROP COLUMN "mediaUrl",
DROP COLUMN "metadata",
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "contentType" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "universe" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "watchedAt" TIMESTAMP(3),
ALTER COLUMN "thumbnail" DROP NOT NULL,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'published';

-- AlterTable
ALTER TABLE "creator_profiles" DROP COLUMN "banner",
DROP COLUMN "socialLinks",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment_intents" DROP COLUMN "completedAt",
DROP COLUMN "description",
DROP COLUMN "metadata",
DROP COLUMN "providerReference",
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "points_ledger" DROP COLUMN "metadata",
DROP COLUMN "reason",
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "product_events" DROP COLUMN "timestamp",
DROP COLUMN "type",
ADD COLUMN     "eventName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "universes" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "isEnabled" SET DEFAULT true;

-- AlterTable
ALTER TABLE "user_segments" DROP COLUMN "computedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "notificationPreferences",
DROP COLUMN "password",
DROP COLUMN "preferences",
DROP COLUMN "trustScore",
ALTER COLUMN "displayName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_reference_key" ON "payment_intents"("reference");

-- CreateIndex
CREATE INDEX "payment_intents_userId_idx" ON "payment_intents"("userId");

-- CreateIndex
CREATE INDEX "points_ledger_userId_idx" ON "points_ledger"("userId");

-- CreateIndex
CREATE INDEX "product_events_userId_idx" ON "product_events"("userId");

-- CreateIndex
CREATE INDEX "product_events_eventName_idx" ON "product_events"("eventName");

-- CreateIndex
CREATE INDEX "recommendation_logs_userId_idx" ON "recommendation_logs"("userId");

-- CreateIndex
CREATE INDEX "recommendation_logs_itemId_idx" ON "recommendation_logs"("itemId");

