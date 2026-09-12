-- Additive-only sync of creator-service DB with prisma/schema.prisma.
-- Tipping feature columns + tables. Deliberately excludes the destructive
-- DROP TABLE "wallets"/"wallet_transactions" (wallet domain moved to wallet-service)
-- and the Decimal(65,30)->Decimal(18,2) precision changes, which need data review.

-- AlterTable (tips is empty in dev; NOT NULL without default is safe)
ALTER TABLE "tips" ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "message" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "tip_leaderboard" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT '',
    "lastTipAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exclusive_content" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "minTier" TEXT NOT NULL DEFAULT 'gold',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exclusive_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tips_creatorId_idx" ON "tips"("creatorId");

-- CreateIndex
CREATE INDEX "tips_createdAt_idx" ON "tips"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tip_leaderboard_creatorId_userId_key" ON "tip_leaderboard"("creatorId", "userId");

-- CreateIndex
CREATE INDEX "tip_leaderboard_creatorId_idx" ON "tip_leaderboard"("creatorId");

-- CreateIndex
CREATE INDEX "tip_leaderboard_creatorId_totalAmount_idx" ON "tip_leaderboard"("creatorId", "totalAmount");

-- CreateIndex
CREATE INDEX "exclusive_content_creatorId_idx" ON "exclusive_content"("creatorId");

-- CreateIndex
CREATE INDEX "exclusive_content_minTier_idx" ON "exclusive_content"("minTier");

-- AddForeignKey
ALTER TABLE "exclusive_content" ADD CONSTRAINT "exclusive_content_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
