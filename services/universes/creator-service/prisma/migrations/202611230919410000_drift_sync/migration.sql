-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "minimumPayout" DECIMAL(18,2),
ADD COLUMN     "payoutMethod" TEXT,
ADD COLUMN     "tipEnabled" BOOLEAN DEFAULT true,
ADD COLUMN     "tipMax" DECIMAL(18,2) DEFAULT 100,
ADD COLUMN     "tipMin" DECIMAL(18,2) DEFAULT 1;

-- AlterTable
ALTER TABLE "payout_requests" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT DEFAULT 'NGN',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "accountDetails" DROP NOT NULL;

