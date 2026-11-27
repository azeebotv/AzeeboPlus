-- DropIndex
DROP INDEX IF EXISTS "challenge_submissions_upstreamId_idx";

-- DropIndex
DROP INDEX IF EXISTS "content_items_status_archivedAt_idx";

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "avatar" TEXT,
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "settings" JSONB,
ALTER COLUMN "minimumPayout" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "payment_intents" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "accountDetails" JSONB,
ADD COLUMN IF NOT EXISTS "creatorId" TEXT,
ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "refunds" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "wallet_transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "bonusBalance" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "promoBalance" SET DATA TYPE DECIMAL(18,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_CategoryToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToContentItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_ContentItemToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentItemToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CategoryToContentItem_B_index" ON "_CategoryToContentItem"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ContentItemToTag_B_index" ON "_ContentItemToTag"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_items_universeId_idx" ON "content_items"("universeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_items_creatorId_idx" ON "content_items"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToContentItem_A_fkey'
    ) THEN
        ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToContentItem_B_fkey'
    ) THEN
        ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_B_fkey" FOREIGN KEY ("B") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ContentItemToTag_A_fkey'
    ) THEN
        ALTER TABLE "_ContentItemToTag" ADD CONSTRAINT "_ContentItemToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ContentItemToTag_B_fkey'
    ) THEN
        ALTER TABLE "_ContentItemToTag" ADD CONSTRAINT "_ContentItemToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
