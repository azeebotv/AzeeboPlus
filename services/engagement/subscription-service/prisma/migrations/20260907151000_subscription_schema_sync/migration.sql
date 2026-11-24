-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "maxDevices" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxStreams" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "features" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscription_transactions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- CreateTable
CREATE TABLE "bundle_passes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "universeIds" TEXT[],
    "price" DECIMAL(18,2) NOT NULL,
    "originalPrice" DECIMAL(18,2) NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_passes_name_key" ON "bundle_passes"("name");

-- CreateIndex
CREATE INDEX "bundle_subscriptions_userId_idx" ON "bundle_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "bundle_subscriptions_bundleId_idx" ON "bundle_subscriptions"("bundleId");

-- CreateIndex
CREATE INDEX "bundle_subscriptions_status_idx" ON "bundle_subscriptions"("status");

-- CreateIndex
CREATE INDEX "bundle_subscriptions_userId_status_idx" ON "bundle_subscriptions"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_subscriptions_userId_bundleId_key" ON "bundle_subscriptions"("userId", "bundleId");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

-- CreateIndex
CREATE INDEX "subscription_transactions_createdAt_idx" ON "subscription_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "subscriptions_status_endDate_idx" ON "subscriptions"("status", "endDate");

-- AddForeignKey
ALTER TABLE "subscription_transactions" ADD CONSTRAINT "subscription_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_subscriptions" ADD CONSTRAINT "bundle_subscriptions_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundle_passes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
