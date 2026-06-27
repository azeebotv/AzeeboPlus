-- ============================================================
-- 010: Sync operations-service schema to shared database
-- Ensures support, moderation, and queue tables exist.
-- ============================================================

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  "assignedTo" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "paymentId" TEXT,
  amount DECIMAL(18,2),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chargebacks table
CREATE TABLE IF NOT EXISTS chargebacks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paymentId" TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Takedowns table
CREATE TABLE IF NOT EXISTS takedowns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentId" TEXT NOT NULL,
  reason TEXT NOT NULL,
  "requestedBy" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentType" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "moderatorId" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "runAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  error TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets("userId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_userId ON disputes("userId");
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_chargebacks_paymentId ON chargebacks("paymentId");
CREATE INDEX IF NOT EXISTS idx_appeals_userId ON appeals("userId");
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
CREATE INDEX IF NOT EXISTS idx_takedowns_contentId ON takedowns("contentId");
CREATE INDEX IF NOT EXISTS idx_takedowns_status ON takedowns(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_contentType ON moderation_queue("contentType");
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_runAt ON job_queue("runAt");
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority);

-- Table ownership
ALTER TABLE tickets OWNER TO azeebo;
ALTER TABLE disputes OWNER TO azeebo;
ALTER TABLE chargebacks OWNER TO azeebo;
ALTER TABLE appeals OWNER TO azeebo;
ALTER TABLE takedowns OWNER TO azeebo;
ALTER TABLE moderation_queue OWNER TO azeebo;
ALTER TABLE job_queue OWNER TO azeebo;
