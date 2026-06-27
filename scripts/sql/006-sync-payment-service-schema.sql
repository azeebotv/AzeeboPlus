-- ============================================================
-- 006: Sync payment-service schema to shared database
-- Ensures payments, refunds, escrow, payout, and webhook
-- tables exist for the payment domain.
-- ============================================================

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "walletId" TEXT,
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "paymentMethod" TEXT NOT NULL,
  provider TEXT,
  "providerRef" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "failureReason" TEXT,
  metadata JSONB,
  "idempotencyKey" TEXT UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paymentId" TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("paymentId") REFERENCES payments(id) ON DELETE CASCADE
);

-- Escrow table
CREATE TABLE IF NOT EXISTS escrow (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paymentId" TEXT UNIQUE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held',
  "releasedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("paymentId") REFERENCES payments(id) ON DELETE CASCADE
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  "payoutMethod" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source TEXT NOT NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments("userId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_createdAt ON payments("createdAt");
CREATE INDEX IF NOT EXISTS idx_payments_idempotencyKey ON payments("idempotencyKey");
CREATE INDEX IF NOT EXISTS idx_refunds_paymentId ON refunds("paymentId");
CREATE INDEX IF NOT EXISTS idx_escrow_paymentId ON escrow("paymentId");
CREATE INDEX IF NOT EXISTS idx_payouts_userId ON payouts("userId");
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_source ON webhooks(source);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON webhooks(event);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);

-- Table ownership
ALTER TABLE payments OWNER TO azeebo;
ALTER TABLE refunds OWNER TO azeebo;
ALTER TABLE escrow OWNER TO azeebo;
ALTER TABLE payouts OWNER TO azeebo;
ALTER TABLE webhooks OWNER TO azeebo;
