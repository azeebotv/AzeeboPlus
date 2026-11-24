-- AlterTable
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wallet_transactions_reference_idx" ON "wallet_transactions"("reference");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");
