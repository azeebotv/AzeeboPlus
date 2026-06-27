-- ============================================================
-- 004: Restore wallets table in shared database
-- The wallets table was dropped by `prisma db push` when the
-- user-service schema was pushed (it has no wallets model).
-- This script restores it to match the wallet-service schema.
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL,
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  "bonusBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "promoBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_userId ON wallets("userId");
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);

-- Table ownership
ALTER TABLE wallets OWNER TO azeebo;
