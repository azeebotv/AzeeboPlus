-- CreateTable: WalletLedger (append-only audit ledger, wallet_ledger_v2 flag)
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_ledger_walletId_idx" ON "wallet_ledger"("walletId");

-- CreateIndex
CREATE INDEX "wallet_ledger_userId_idx" ON "wallet_ledger"("userId");

-- CreateIndex
CREATE INDEX "wallet_ledger_operationType_idx" ON "wallet_ledger"("operationType");

-- CreateIndex
CREATE INDEX "wallet_ledger_createdAt_idx" ON "wallet_ledger"("createdAt");

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
