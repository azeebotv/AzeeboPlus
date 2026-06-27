-- ============================================================
-- 005: Sync wallet-service schema to shared database
-- Ensures wallet_transactions table exists for audit trails.
-- ============================================================

-- Wallet transactions table (for audit trail)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "walletId" TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  "balanceBefore" DECIMAL(18,2) NOT NULL,
  "balanceAfter" DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference TEXT,
  "referenceType" TEXT,
  "referenceId" TEXT,
  description TEXT,
  metadata JSONB,
  "idempotencyKey" TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  FOREIGN KEY ("walletId") REFERENCES wallets(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_walletId ON wallet_transactions("walletId");
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_referenceId ON wallet_transactions("referenceId");
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_referenceType ON wallet_transactions("referenceType");
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_idempotencyKey ON wallet_transactions("idempotencyKey");
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_createdAt ON wallet_transactions("createdAt");

-- Table ownership
ALTER TABLE wallet_transactions OWNER TO azeebo;
