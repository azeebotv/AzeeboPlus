-- ============================================================
-- 008: Sync engagement-service schema to shared database
-- Ensures tables for rewards, referrals, subscriptions,
-- notifications, messaging, and watch history exist.
-- ============================================================

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  reference TEXT,
  "referenceId" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward DECIMAL(18,2),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endDate" TIMESTAMPTZ,
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  read BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_userId ON rewards("userId");
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_createdAt ON rewards("createdAt");
CREATE INDEX IF NOT EXISTS idx_referrals_referrerId ON referrals("referrerId");
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications("createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiverId ON messages("receiverId");
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages("createdAt");

-- Table ownership
ALTER TABLE rewards OWNER TO azeebo;
ALTER TABLE referrals OWNER TO azeebo;
ALTER TABLE subscriptions OWNER TO azeebo;
ALTER TABLE notifications OWNER TO azeebo;
ALTER TABLE messages OWNER TO azeebo;
