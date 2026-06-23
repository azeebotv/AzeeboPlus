-- =============================================================================
-- Azeebo+ Unified Schema Migration
-- Creates all tables across all services in the shared database.
-- Idempotent: uses IF NOT EXISTS throughout.
-- Generated from Prisma schemas: auth, content, user, wallet, shared-services
-- =============================================================================

BEGIN;

-- ============================================================================
-- AUTH SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "auth_users" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  "phoneNumber" TEXT UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  avatar TEXT,
  "dateOfBirth" DATE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret" TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "lastLoginAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON "auth_users"(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_phone ON "auth_users"("phoneNumber");
CREATE INDEX IF NOT EXISTS idx_auth_users_status ON "auth_users"(status);

CREATE TABLE IF NOT EXISTS "user_roles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  "universeId" TEXT,
  "grantedBy" TEXT,
  "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON "user_roles"(role);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "deviceInfo" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revokedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON "refresh_tokens"("userId");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON "refresh_tokens"(token);

CREATE TABLE IF NOT EXISTS "login_attempts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT,
  email TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT,
  "attemptedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  successful BOOLEAN NOT NULL DEFAULT false,
  "failureReason" TEXT
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON "login_attempts"(email);

CREATE TABLE IF NOT EXISTS "otp_codes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT,
  email TEXT NOT NULL,
  "phoneNumber" TEXT,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "verifiedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON "otp_codes"(email);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "usedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON "password_reset_tokens"(token);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'email_verification',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "verifiedAt" TIMESTAMPTZ
);

-- ============================================================================
-- CONTENT SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "universes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "categories" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tags" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "content_items" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT NOT NULL,
  "mediaUrl" TEXT,
  "universeId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "releaseDate" TIMESTAMPTZ,
  "theatricalReleaseDate" TIMESTAMPTZ,
  "streamingReleaseDate" TIMESTAMPTZ,
  "windowEndDate" TIMESTAMPTZ,
  "windowType" TEXT NOT NULL DEFAULT 'standard',
  "isExclusive" BOOLEAN NOT NULL DEFAULT false,
  "isPremiere" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_content_items_universe ON "content_items"("universeId");
CREATE INDEX IF NOT EXISTS idx_content_items_creator ON "content_items"("creatorId");
CREATE INDEX IF NOT EXISTS idx_content_items_status ON "content_items"(status);
CREATE INDEX IF NOT EXISTS idx_content_items_viewcount ON "content_items"("viewCount");
CREATE INDEX IF NOT EXISTS idx_content_items_published ON "content_items"("publishedAt");

CREATE TABLE IF NOT EXISTS "content_categories" (
  "contentId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  PRIMARY KEY ("contentId", "categoryId")
);

CREATE TABLE IF NOT EXISTS "content_tags" (
  "contentId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("contentId", "tagId")
);

CREATE TABLE IF NOT EXISTS "media_assets" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentItemId" TEXT UNIQUE NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  format TEXT NOT NULL,
  size BIGINT NOT NULL,
  duration INTEGER,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "content_relationships" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentId" TEXT NOT NULL,
  "relatedContentId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("contentId", "relatedContentId")
);

CREATE TABLE IF NOT EXISTS "comments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  text TEXT NOT NULL,
  "parentId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_content ON "comments"("contentId");

CREATE TABLE IF NOT EXISTS "rentals" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "startTime" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endTime" TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  price NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "transactionId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "contentId")
);

CREATE TABLE IF NOT EXISTS "passes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "passType" TEXT NOT NULL,
  "universeId" TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "startTime" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endTime" TIMESTAMPTZ NOT NULL,
  price NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "transactionId" TEXT,
  "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "screenings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentId" TEXT NOT NULL,
  "screeningTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ NOT NULL,
  location TEXT,
  "streamUrl" TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  "maxViewers" INTEGER,
  "currentViewers" INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "locked_extras" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentId" TEXT NOT NULL,
  "extraType" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  "mediaUrl" TEXT,
  price NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'NGN',
  "unlockType" TEXT NOT NULL DEFAULT 'purchase',
  "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_unlocks" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "unlockType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "transactionId" TEXT,
  price NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'NGN',
  "unlockedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "unlockType", "resourceId")
);

CREATE TABLE IF NOT EXISTS "watch_history" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  "watchedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "contentId")
);

CREATE TABLE IF NOT EXISTS "universe_feature_flags" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "universeId" TEXT NOT NULL,
  "featureKey" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("universeId", "featureKey")
);

-- ============================================================================
-- USER SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "user_profiles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  "dateOfBirth" DATE,
  location TEXT,
  website TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  "darkMode" BOOLEAN NOT NULL DEFAULT false,
  notifications JSONB DEFAULT '{}',
  "contentPreferences" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "saved_items" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "contentId")
);

CREATE TABLE IF NOT EXISTS "following" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("followerId", "followingId")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "planType" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endDate" TIMESTAMPTZ,
  "nextBillingDate" TIMESTAMPTZ,
  "paymentMethod" TEXT,
  "providerId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_universe_affinity" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "universeId" TEXT NOT NULL,
  "affinityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastEngaged" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "universeId")
);

-- ============================================================================
-- SHARED SERVICES / AUDIT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "actorId" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  action TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "previousValue" TEXT,
  "newValue" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  status TEXT NOT NULL,
  "errorMessage" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON "audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "audit_logs"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON "audit_logs"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON "audit_logs"("createdAt");

-- ============================================================================
-- BALANCE SNAPSHOTS (wallet-service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "balance_snapshots" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "walletId" TEXT NOT NULL,
  balance NUMERIC(65,30) NOT NULL,
  "bonusBalance" NUMERIC(65,30) NOT NULL,
  "promoBalance" NUMERIC(65,30) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_wallet ON "balance_snapshots"("walletId");

-- ============================================================================
-- DEMO VERSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS "demo_content_versions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  version TEXT NOT NULL,
  "deployedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deployedBy" TEXT NOT NULL DEFAULT 'system',
  "rollbackSnapshotId" TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_demo_versions_status ON "demo_content_versions"(status);

COMMIT;
