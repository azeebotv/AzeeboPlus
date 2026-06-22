-- CreateTable: BalanceSnapshot
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "walletId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "bonusBalance" DECIMAL(65,30) NOT NULL,
    "promoBalance" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_snapshots_walletId_idx" ON "balance_snapshots"("walletId");

-- CreateIndex
CREATE INDEX "balance_snapshots_capturedAt_idx" ON "balance_snapshots"("capturedAt");

-- AddForeignKey
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
