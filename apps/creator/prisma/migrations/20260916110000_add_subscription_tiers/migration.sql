-- Creator-owned subscription tiers for the portal monetization page.
-- Subscriber counts are derived at read time from the platform
-- `subscriptions` table (status='active') matching by tier name, so this
-- table stores only the tier definition itself.
CREATE TABLE "subscription_tiers" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "perks" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id")
);

-- A creator cannot define two tiers with the same name
CREATE UNIQUE INDEX "subscription_tiers_creatorId_name_key" ON "subscription_tiers"("creatorId", "name");

-- CreateIndex
CREATE INDEX "subscription_tiers_creatorId_isActive_idx" ON "subscription_tiers"("creatorId", "isActive");
