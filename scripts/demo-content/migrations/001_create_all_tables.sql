-- =============================================================================
-- Azeebo+ Unified Schema Migration
-- Creates all tables across all services in the shared database.
-- Idempotent: uses IF NOT EXISTS throughout.
-- Generated from Prisma schemas: auth, content, user, wallet, shared-services
-- =============================================================================

BEGIN;

-- ============================================================================
-- CLEANUP: Remove tables from failed migrations (allows clean recreation)
-- These migrations may have partially executed before failure
-- ============================================================================

DROP TABLE IF EXISTS "balance_snapshots" CASCADE;
DROP TABLE IF EXISTS "delivery_attempts" CASCADE;
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
DROP TABLE IF EXISTS "notification_templates" CASCADE;
DROP TABLE IF EXISTS "campaigns" CASCADE;
DROP TABLE IF EXISTS "campaign_triggers" CASCADE;

-- ============================================================================
-- AUTH SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "users" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  "displayName" TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  preferences JSONB,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mfaSecret" TEXT,
  "mfaBackupCodes" TEXT,
"createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "users"("createdAt");

-- Auth Service sessions
CREATE TABLE IF NOT EXISTS "sessions" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "userId" TEXT NOT NULL,
   "refreshToken" TEXT UNIQUE,
   "expiresAt" TIMESTAMPTZ NOT NULL,
   "deviceName" TEXT,
   "deviceType" TEXT,
   os TEXT,
   browser TEXT,
   "ipAddress" TEXT,
   "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON "sessions"("expiresAt");

-- OTP for 2FA
CREATE TABLE IF NOT EXISTS "otps" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "userId" TEXT UNIQUE NOT NULL,
   code TEXT NOT NULL,
   "expiresAt" TIMESTAMPTZ NOT NULL,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_otps_user ON "otps"("userId");
CREATE INDEX IF NOT EXISTS idx_otps_expires ON "otps"("expiresAt");

-- Social accounts
CREATE TABLE IF NOT EXISTS "social_accounts" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "userId" TEXT NOT NULL,
   provider TEXT NOT NULL,
   "socialId" TEXT NOT NULL,
   "accessToken" TEXT,
   "refreshToken" TEXT,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ,
   UNIQUE("socialId", provider),
   UNIQUE("userId", provider)
);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON "social_accounts"("userId");
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON "social_accounts"(provider);

CREATE TABLE IF NOT EXISTS "user_roles" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "userId" TEXT NOT NULL,
   role TEXT NOT NULL,
   "grantedBy" TEXT,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE("userId", role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON "user_roles"(role);

CREATE TABLE IF NOT EXISTS "roles" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   name TEXT UNIQUE NOT NULL,
   description TEXT,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "permissions" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   name TEXT UNIQUE NOT NULL,
   description TEXT,
   resource TEXT NOT NULL,
   action TEXT NOT NULL,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON "permissions"(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON "permissions"(action);

CREATE TABLE IF NOT EXISTS "role_permissions" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "roleId" TEXT NOT NULL,
   "permissionId" TEXT NOT NULL,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE("roleId", "permissionId")
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON "role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON "role_permissions"("permissionId");

CREATE TABLE IF NOT EXISTS "sessions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "deviceName" TEXT,
  "deviceType" TEXT,
  os TEXT,
  browser TEXT,
  "ipAddress" TEXT,
  "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON "sessions"("refreshToken");
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON "sessions"("expiresAt");

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

CREATE TABLE IF NOT EXISTS "system_settings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "key" TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON "system_settings"("key");
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON "system_settings"(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON "system_settings"("isPublic");

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
   "contentType" TEXT,
   universe TEXT DEFAULT 'unknown',
   progress INTEGER DEFAULT 0,
   "watchedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON "watch_history"("userId");
CREATE INDEX IF NOT EXISTS idx_watch_history_content ON "watch_history"("contentId");

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

CREATE TABLE IF NOT EXISTS "users" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  "displayName" TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mfaSecret" TEXT,
  "mfaBackupCodes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"(role);

CREATE TABLE IF NOT EXISTS "user_profiles" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "userId" TEXT UNIQUE NOT NULL,
   "displayName" TEXT,
   avatar TEXT,
   bio TEXT,
   location TEXT,
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
   "privacySettings" JSONB DEFAULT '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}',
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
   "actorId" TEXT,
   "actorRole" TEXT,
   actor TEXT,
   action TEXT NOT NULL,
   "targetType" TEXT,
   "targetId" TEXT,
   "resourceType" TEXT,
   "resourceId" TEXT,
   details JSONB,
   "ipAddress" TEXT,
   "userAgent" TEXT,
   result TEXT,
   "errorMessage" TEXT,
   status TEXT,
   "timestamp" TIMESTAMPTZ,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ,
   "previousValue" TEXT,
   "newValue" TEXT,
   metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON "audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "audit_logs"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON "audit_logs"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON "audit_logs"("timestamp");

-- ============================================================================
-- WALLET SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "wallets" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  "bonusBalance" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "promoBalance" NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON "wallets"("userId");

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "walletId" TEXT NOT NULL,
   type TEXT NOT NULL,
   amount NUMERIC(18,2) NOT NULL,
   status TEXT NOT NULL,
   description TEXT,
   reference TEXT,
   provider TEXT,
   "providerRef" TEXT,
   "idempotencyKey" TEXT UNIQUE,
   metadata JSONB,
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON "wallet_transactions"("walletId");
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON "wallet_transactions"(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON "wallet_transactions"(status);

-- ============================================================================
-- BALANCE SNAPSHOTS (wallet-service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "balance_snapshots" (
   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
   "walletId" TEXT NOT NULL,
   balance NUMERIC(18,2) NOT NULL DEFAULT 0,
   "bonusBalance" NUMERIC(18,2) NOT NULL DEFAULT 0,
   "promoBalance" NUMERIC(18,2) NOT NULL DEFAULT 0,
   currency TEXT NOT NULL DEFAULT 'NGN',
   "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_wallet ON "balance_snapshots"("walletId");

-- ============================================================================
-- CREATOR SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "creator_profiles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  banner TEXT,
  "socialLinks" JSONB DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user ON "creator_profiles"("userId");

CREATE TABLE IF NOT EXISTS "creator_channels" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "creatorId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_channels_creator ON "creator_channels"("creatorId");

CREATE TABLE IF NOT EXISTS "creator_earnings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "creatorId" TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON "creator_earnings"("creatorId");

CREATE TABLE IF NOT EXISTS "creator_challenges" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "creatorId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize NUMERIC(18,2),
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "challenge_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "challengeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("challengeId", "userId")
);

CREATE TABLE IF NOT EXISTS "payout_requests" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "creatorId" TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  method TEXT NOT NULL,
  "accountDetails" JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- REALITY SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "reality_shows" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "universeId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reality_seasons" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "showId" TEXT NOT NULL,
  number INTEGER NOT NULL,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reality_seasons_show ON "reality_seasons"("showId");

CREATE TABLE IF NOT EXISTS "reality_episodes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "seasonId" TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT,
  thumbnail TEXT,
  "mediaUrl" TEXT,
  "airedAt" TIMESTAMPTZ,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reality_episodes_season ON "reality_episodes"("seasonId");

CREATE TABLE IF NOT EXISTS "reality_contestants" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "showId" TEXT NOT NULL,
  name TEXT NOT NULL,
  thumbnail TEXT,
  "socialLinks" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reality_contestants_show ON "reality_contestants"("showId");

CREATE TABLE IF NOT EXISTS "reality_votes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "contestantId" TEXT NOT NULL,
  "showId" TEXT NOT NULL,
  "episodeId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "contestantId")
);
CREATE INDEX IF NOT EXISTS idx_reality_votes_contestant ON "reality_votes"("contestantId");
CREATE INDEX IF NOT EXISTS idx_reality_votes_show ON "reality_votes"("showId");

CREATE TABLE IF NOT EXISTS "reality_supervotes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "contestantId" TEXT NOT NULL,
  "showId" TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 10.00,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "contestantId")
);

CREATE TABLE IF NOT EXISTS "reality_predictions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "showId" TEXT NOT NULL,
  "episodeId" TEXT,
  "contestantId" TEXT,
  prediction JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reality_predictions_show ON "reality_predictions"("showId");

-- ============================================================================
-- SPORTS SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "sports_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  "startsAt" TIMESTAMPTZ,
  "endsAt" TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "event_teams" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_teams_event ON "event_teams"("eventId");

CREATE TABLE IF NOT EXISTS "prediction_markets" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  odds JSONB,
  "totalPool" NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prediction_markets_event ON "prediction_markets"("eventId");

CREATE TABLE IF NOT EXISTS "prediction_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "marketId" TEXT,
  prediction JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prediction_entries_event ON "prediction_entries"("eventId");

-- ============================================================================
-- GAMES SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "games" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  "playCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "game_questions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "gameId" TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB,
  points INTEGER NOT NULL DEFAULT 10,
  "order" INTEGER NOT NULL DEFAULT 0,
  "timeLimit" INTEGER NOT NULL DEFAULT 30,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_game_questions_game ON "game_questions"("gameId");

CREATE TABLE IF NOT EXISTS "tournaments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  "startsAt" TIMESTAMPTZ,
  "endsAt" TIMESTAMPTZ,
  "entryFee" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "prizePool" NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tournamentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("tournamentId", "userId")
);
CREATE INDEX IF NOT EXISTS idx_tournament_entries_tournament ON "tournament_entries"("tournamentId");

-- ============================================================================
-- COMEDY SERVICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "comedian_profiles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  bio TEXT,
  banner TEXT,
  "socialLinks" JSONB DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "comedy_clips" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "comedianId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  "mediaUrl" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "shareCount" INTEGER NOT NULL DEFAULT 0,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comedy_clips_comedian ON "comedy_clips"("comedianId");

-- ============================================================================
-- ENGAGEMENT TABLES
-- ============================================================================

-- ============================================================================
-- NOTIFICATION SERVICE TABLES (init migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "notifications" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON "notifications"(type);

-- ============================================================================
-- NOTIFICATION SERVICE TABLES (20260617000006_notification_category_a migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "notification_templates" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS notification_templates_key_key ON "notification_templates"(key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON "notification_templates"(channel);

CREATE TABLE IF NOT EXISTS "delivery_attempts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "notificationId" TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL,
  "providerResponse" JSONB,
  error TEXT,
  "attemptedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deliveredAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_notification ON "delivery_attempts"("notificationId");
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_status ON "delivery_attempts"(status);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  timezone TEXT,
  "categoryOverrides" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_userId_key ON "notification_preferences"("userId");

CREATE TABLE IF NOT EXISTS "campaigns" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  channel TEXT NOT NULL,
  audience JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  "scheduledAt" TIMESTAMPTZ,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON "campaigns"(status);

CREATE TABLE IF NOT EXISTS "campaign_triggers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "sentAt" TIMESTAMPTZ,
  error TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_campaign ON "campaign_triggers"("campaignId");
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_user ON "campaign_triggers"("userId");

CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT UNIQUE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referrals" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward NUMERIC(18,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON "referrals"("referrerId");

-- ============================================================================
-- OPERATIONS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "support_tickets" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON "support_tickets"("userId");
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON "support_tickets"(status);

CREATE TABLE IF NOT EXISTS "moderation_queue" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "contentId" TEXT,
  "reportedBy" TEXT,
  "reportType" TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON "moderation_queue"(status);

-- ============================================================================
-- RECOMMENDATION SERVICE TABLES (for recommendation-service DB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "product_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "recommendation_logs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  score NUMERIC(18,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user ON "recommendation_logs"("userId");

CREATE TABLE IF NOT EXISTS "levels" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  "minPoints" INTEGER NOT NULL,
  icon TEXT,
  color TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "badges" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reward_accounts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  "levelId" TEXT,
  streak INTEGER NOT NULL DEFAULT 0,
  "lastLoginAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastCheckInAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reward_accounts_user ON "reward_accounts"("userId");

CREATE TABLE IF NOT EXISTS "missions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "mission_rewards" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "missionId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "rewards" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "mission_completions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "completedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "missionId")
);

CREATE TABLE IF NOT EXISTS "reward_redemptions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "pointsCost" INTEGER NOT NULL,
  "redeemedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "points_ledger" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON "points_ledger"("userId");

CREATE TABLE IF NOT EXISTS "search_query_logs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  query TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  "lastSearchAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_query_logs_query ON "search_query_logs"(query);

CREATE TABLE IF NOT EXISTS "user_searches" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "queryId" TEXT NOT NULL,
  "resultsCount" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ============================================================================
-- ALTER: Add missing columns for cross-service compatibility
-- These run after CREATE to ensure tables exist first
-- ============================================================================

-- Add missing columns to user_preferences (privacySettings)
ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "privacySettings" JSONB DEFAULT '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}';

-- Add missing columns to wallet_transactions (reference)
ALTER TABLE IF EXISTS "wallet_transactions" ADD COLUMN IF NOT EXISTS reference TEXT;

COMMIT;


-- ============================================================================
-- MISSING TABLES FROM PRISMA SCHEMAS (Auto-generated)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "appeal" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  caseId TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionReason TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  case TEXT
);

CREATE TABLE IF NOT EXISTS "artifact" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "physical",
  power TEXT,
  origin TEXT,
  status TEXT DEFAULT "active",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "audience_segment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  segmentType TEXT,
  criteria JSONB,
  size INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "audit_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  action TEXT,
  resourceType TEXT,
  resourceId TEXT,
  actorId TEXT,
  actorType TEXT,
  details TEXT,
  previousState TEXT,
  newState TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  actor TEXT,
  action TEXT,
  resourceType TEXT,
  resourceId TEXT,
  result TEXT,
  error TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "badge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  icon TEXT,
  points INTEGER,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rewardAccounts TEXT
);

CREATE TABLE IF NOT EXISTS "balance_snapshot" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  walletId TEXT,
  balance NUMERIC,
  bonusBalance NUMERIC,
  promoBalance NUMERIC,
  currency TEXT DEFAULT "NGN",
  capturedAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  wallet TEXT
);

CREATE TABLE IF NOT EXISTS "campaign" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  templateKey TEXT,
  channel TEXT,
  audience JSONB,
  status TEXT DEFAULT "draft",
  scheduledAt TEXT,
  startedAt TEXT,
  completedAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  triggers TEXT
);

CREATE TABLE IF NOT EXISTS "campaign_trigger" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  campaignId TEXT,
  userId TEXT,
  status TEXT DEFAULT "pending",
  sentAt TEXT,
  error TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  campaign TEXT
);

CREATE TABLE IF NOT EXISTS "category" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  contentItems TEXT
);

CREATE TABLE IF NOT EXISTS "celebrity_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  bio TEXT,
  coverImage TEXT,
  profession TEXT,
  nationality TEXT,
  birthDate TEXT,
  socialLinks TEXT,
  isFeatured BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "draft",
  createdById TEXT,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  news TEXT
);

CREATE TABLE IF NOT EXISTS "celebrity_news" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  coverImage TEXT,
  celebrityId TEXT,
  status TEXT DEFAULT "draft",
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  celebrity TEXT
);

CREATE TABLE IF NOT EXISTS "challenge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  type TEXT,
  startDate TIMESTAMPTZ,
  endDate TIMESTAMPTZ,
  prize TEXT,
  rules TEXT,
  status TEXT DEFAULT "draft",
  participantCount INTEGER DEFAULT 0,
  createdById TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  submissions TEXT
);

CREATE TABLE IF NOT EXISTS "challenge_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  challengeId TEXT,
  contentUrl TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  challenge TEXT
);

CREATE TABLE IF NOT EXISTS "challenge_prize" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challengeId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(),
  challenge TEXT
);

CREATE TABLE IF NOT EXISTS "challenge_submission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challengeId TEXT,
  userId TEXT,
  content TEXT,
  mediaUrl TEXT,
  status TEXT DEFAULT "pending",
  votes INTEGER DEFAULT 0,
  submittedAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  challenge TEXT,
  challengeVotes TEXT
);

CREATE TABLE IF NOT EXISTS "challenge_vote" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  submissionId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  submission TEXT
);

CREATE TABLE IF NOT EXISTS "channel" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  creator TEXT
);

CREATE TABLE IF NOT EXISTS "chapter" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titleId TEXT,
  number DOUBLE PRECISION,
  name TEXT,
  description TEXT,
  coverImage TEXT,
  content TEXT,
  wordCount TEXT,
  status TEXT DEFAULT "published",
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  title TEXT
);

CREATE TABLE IF NOT EXISTS "character" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  avatarUrl TEXT,
  role TEXT,
  status TEXT DEFAULT "active",
  universeId TEXT,
  birthDate TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  locations TEXT,
  relationshipsFrom TEXT,
  relationshipsTo TEXT,
  timeline TEXT
);

CREATE TABLE IF NOT EXISTS "character_location" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  characterId TEXT,
  locationId TEXT,
  role TEXT,
  description TEXT,
  firstSeenAt TEXT,
  lastSeenAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  character TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS "character_relationship" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fromId TEXT,
  toId TEXT,
  type TEXT,
  description TEXT,
  startDate TEXT,
  endDate TEXT,
  isOfficial BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  from TEXT,
  to TEXT
);

CREATE TABLE IF NOT EXISTS "chargeback" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  paymentId TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  status TEXT DEFAULT "PENDING",
  disputeDeadline TIMESTAMPTZ,
  evidenceDue TIMESTAMPTZ,
  chargebackRef TEXT,
  resolution TEXT,
  resolvedAt TEXT,
  resolvedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "churn_risk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  riskLevel TEXT,
  churnProbability DOUBLE PRECISION DEFAULT 0,
  factors JSONB,
  lastActivityAt TEXT,
  predictedChurnAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "cinema_pass" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  features TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  subscriptions TEXT
);

CREATE TABLE IF NOT EXISTS "cinema_pass_subscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  passId TEXT,
  status TEXT DEFAULT "active",
  startDate TIMESTAMPTZ,
  endDate TIMESTAMPTZ,
  autoRenew BOOLEAN DEFAULT true,
  paymentIntentId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  pass TEXT
);

CREATE TABLE IF NOT EXISTS "city_guide_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  coverImage TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude TEXT,
  longitude TEXT,
  rating TEXT,
  priceLevel TEXT,
  hours TEXT,
  phone TEXT,
  website TEXT,
  amenities TEXT,
  status TEXT DEFAULT "draft",
  viewCount INTEGER DEFAULT 0,
  createdById TEXT,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS "city_guide_tag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "clip_comment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  text TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "clip_like" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "clip_share" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  platform TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "cohort" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  criteria JSONB,
  size INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "cohort_member" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  cohortId TEXT,
  userId TEXT,
  joinedAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "comedian_profile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  bio TEXT,
  banner TEXT,
  socialLinks TEXT,
  verified BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  clips TEXT,
  specials TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_challenge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  status TEXT DEFAULT "active",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  prizes TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_challenge_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  challengeId TEXT,
  clipUrl TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  challenge TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_clip" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  comedianId TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  viewCount INTEGER DEFAULT 0,
  shareCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  comedian TEXT,
  shares TEXT,
  likes TEXT,
  comments TEXT,
  trends TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_episode" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  seriesId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  duration TEXT,
  viewCount INTEGER DEFAULT 0,
  order INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  series TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_series" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  creatorId TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  episodes TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_special" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  duration TEXT,
  comedianId TEXT,
  genre TEXT,
  isPremium BOOLEAN DEFAULT true,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  viewCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  releaseDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  comedian TEXT,
  likes TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_trend" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  clipId TEXT,
  score DOUBLE PRECISION DEFAULT 0,
  rank INTEGER,
  period TEXT DEFAULT "daily",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "comment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  userId TEXT,
  text TEXT,
  parentId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  content TEXT,
  parent TEXT,
  replies TEXT
);

CREATE TABLE IF NOT EXISTS "content" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  type TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  reports TEXT
);

CREATE TABLE IF NOT EXISTS "content_item" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  universeId TEXT,
  creatorId TEXT,
  status TEXT DEFAULT "pending",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "content_relationship" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  relatedContentId TEXT,
  type TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  content TEXT,
  relatedContent TEXT
);

CREATE TABLE IF NOT EXISTS "content_takedown" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  contentId TEXT,
  reportedBy TEXT,
  reason TEXT,
  evidence TEXT,
  status TEXT DEFAULT "PENDING",
  decision TEXT,
  decidedAt TEXT,
  decidedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "contest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  title TEXT,
  description TEXT,
  entryFee NUMERIC DEFAULT 0,
  prizePool NUMERIC,
  status TEXT DEFAULT "active",
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT,
  prizes TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "contest_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contestId TEXT,
  userId TEXT,
  entryData JSONB,
  score INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  contest TEXT,
  SportsEvent TEXT,
  sportsEventId TEXT
);

CREATE TABLE IF NOT EXISTS "contest_prize" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contestId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(),
  contest TEXT
);

CREATE TABLE IF NOT EXISTS "contestant" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  showId TEXT,
  name TEXT,
  description TEXT,
  thumbnail TEXT,
  socialLinks TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  show TEXT,
  votes TEXT,
  supervotes TEXT,
  predictions TEXT
);

CREATE TABLE IF NOT EXISTS "conversation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT DEFAULT "direct",
  name TEXT,
  avatar TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  participants TEXT,
  messages TEXT
);

CREATE TABLE IF NOT EXISTS "conversation_participant" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversationId TEXT,
  userId TEXT,
  role TEXT DEFAULT "member",
  joinedAt TIMESTAMPTZ DEFAULT now(),
  lastReadAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  conversation TEXT
);

CREATE TABLE IF NOT EXISTS "conversion_metric" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  funnelId TEXT,
  triggerEvent TEXT,
  conditions JSONB,
  windowMinutes TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "creator_challenge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  prize TEXT,
  startDate TIMESTAMPTZ,
  endDate TIMESTAMPTZ,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  creator TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "creator_earning" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  amount NUMERIC,
  type TEXT,
  referenceId TEXT,
  status TEXT DEFAULT "pending",
  paidAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "creator_profile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  displayName TEXT,
  avatar TEXT,
  bio TEXT,
  banner TEXT,
  socialLinks TEXT,
  settings TEXT,
  verified BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  earnings TEXT,
  subscriptions TEXT,
  channels TEXT,
  challenges TEXT,
  payoutRequests TEXT
);

CREATE TABLE IF NOT EXISTS "creator_score" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  engagementScore DOUBLE PRECISION DEFAULT 0,
  growthScore DOUBLE PRECISION DEFAULT 0,
  monetizationScore DOUBLE PRECISION DEFAULT 0,
  overallScore DOUBLE PRECISION DEFAULT 0,
  lastUpdated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "crossover" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  startDate TEXT,
  endDate TEXT,
  status TEXT DEFAULT "announced",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  titles TEXT
);

CREATE TABLE IF NOT EXISTS "crossover_title" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  crossoverId TEXT,
  titleId TEXT,
  crossover TEXT,
  title TEXT
);

CREATE TABLE IF NOT EXISTS "culture_story" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  coverImage TEXT,
  categoryId TEXT,
  authorId TEXT,
  status TEXT DEFAULT "draft",
  viewCount INTEGER DEFAULT 0,
  readTime TEXT,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  category TEXT,
  comments TEXT
);

CREATE TABLE IF NOT EXISTS "custom_report" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  category TEXT DEFAULT "general",
  createdBy TEXT,
  metrics JSONB,
  dimensions JSONB,
  filters JSONB DEFAULT "[]",
  dateField TEXT DEFAULT "createdAt",
  dateRange TEXT DEFAULT "30d",
  startDate TEXT,
  endDate TEXT,
  isPublic BOOLEAN DEFAULT false,
  chartConfig JSONB
);

CREATE TABLE IF NOT EXISTS "data_deletion_request" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT DEFAULT "scheduled",
  scheduledAt TIMESTAMPTZ DEFAULT now(),
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "dead_letter_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  jobId TEXT,
  type TEXT,
  payload JSONB,
  error TEXT,
  attempts INTEGER,
  movedAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  job TEXT
);

CREATE TABLE IF NOT EXISTS "delivery_attempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  notificationId TEXT,
  channel TEXT,
  provider TEXT,
  status TEXT,
  providerResponse TEXT,
  error TEXT,
  attemptedAt TIMESTAMPTZ DEFAULT now(),
  deliveredAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  notification TEXT
);

CREATE TABLE IF NOT EXISTS "device_info" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  productEventId TEXT,
  deviceType TEXT,
  os TEXT,
  osVersion TEXT,
  browser TEXT,
  browserVersion TEXT,
  appVersion TEXT,
  screenWidth TEXT,
  screenHeight TEXT,
  language TEXT,
  timezone TEXT,
  userAgent TEXT,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "episode" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  showId TEXT,
  seasonId TEXT,
  title TEXT,
  number INTEGER,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  airedAt TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  show TEXT,
  season TEXT,
  votes TEXT,
  predictions TEXT
);

CREATE TABLE IF NOT EXISTS "event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  startDate TIMESTAMPTZ,
  endDate TEXT,
  location TEXT,
  venue TEXT,
  isOnline BOOLEAN DEFAULT false,
  onlineLink TEXT,
  maxAttendees TEXT,
  status TEXT DEFAULT "draft",
  categoryId TEXT,
  creatorId TEXT,
  viewCount INTEGER DEFAULT 0,
  rsvpCount INTEGER DEFAULT 0,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  category TEXT,
  rsvps TEXT
);

CREATE TABLE IF NOT EXISTS "event_category" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  icon TEXT,
  events TEXT
);

CREATE TABLE IF NOT EXISTS "event_rsvp" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  eventId TEXT,
  status TEXT DEFAULT "attending",
  guests INTEGER DEFAULT 0,
  note TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "event_schema" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  properties JSONB,
  required JSONB,
  version INTEGER DEFAULT 1,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "event_team" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  name TEXT,
  logo TEXT,
  score INTEGER DEFAULT 0,
  order INTEGER DEFAULT 0,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "experiment_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  experimentKey TEXT,
  userId TEXT,
  variant TEXT,
  assignmentAt TIMESTAMPTZ DEFAULT now(),
  outcome TEXT,
  outcomeAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fan_board" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  userId TEXT,
  text TEXT,
  likes INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT,
  comments TEXT
);

CREATE TABLE IF NOT EXISTS "fan_board_comment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fanBoardId TEXT,
  userId TEXT,
  text TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  fanBoard TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_backer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  projectId TEXT,
  userId TEXT,
  amount NUMERIC,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  project TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_project" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  filmmakerId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  status TEXT DEFAULT "development",
  fundingGoal TEXT,
  fundingRaised NUMERIC DEFAULT 0,
  targetDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  updates TEXT,
  backers TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_update" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  projectId TEXT,
  title TEXT,
  content TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  project TEXT
);

CREATE TABLE IF NOT EXISTS "fixture_metadata" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  venue TEXT,
  referee TEXT,
  weather TEXT,
  temperature TEXT,
  attendance TEXT,
  broadcast TEXT,
  stats TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "fraud_detection" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  eventType TEXT,
  severity TEXT,
  details JSONB,
  status TEXT DEFAULT "pending",
  reviewedBy TEXT,
  reviewedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "funnel" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  steps JSONB,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  funnelSteps TEXT
);

CREATE TABLE IF NOT EXISTS "funnel_completion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  funnelId TEXT,
  userId TEXT,
  completedSteps INTEGER DEFAULT 0,
  completedAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "funnel_step" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  funnelId TEXT,
  stepOrder INTEGER,
  eventName TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  funnel TEXT
);

CREATE TABLE IF NOT EXISTS "game" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  difficulty TEXT DEFAULT "medium",
  playCount INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "game_answer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sessionId TEXT,
  questionId TEXT,
  answer TEXT,
  isCorrect BOOLEAN,
  timeTaken INTEGER,
  pointsEarned INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "game_play_session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  gameId TEXT,
  score INTEGER DEFAULT 0,
  correctCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "active",
  startedAt TIMESTAMPTZ DEFAULT now(),
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "game_question" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  gameId TEXT,
  question TEXT,
  answer TEXT,
  options TEXT,
  points INTEGER DEFAULT 10,
  order INTEGER DEFAULT 0,
  timeLimit INTEGER DEFAULT 30,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "game_session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  challengeId TEXT,
  questionId TEXT,
  status TEXT,
  score INTEGER DEFAULT 0,
  startedAt TIMESTAMPTZ DEFAULT now(),
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "highlight" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "influencer_collaboration" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  influencerId TEXT,
  brandName TEXT,
  campaignName TEXT,
  description TEXT,
  coverImage TEXT,
  startDate TEXT,
  endDate TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  influencer TEXT
);

CREATE TABLE IF NOT EXISTS "influencer_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  slug TEXT,
  displayName TEXT,
  bio TEXT,
  avatarUrl TEXT,
  coverImage TEXT,
  category TEXT,
  followerCount INTEGER DEFAULT 0,
  followingCount INTEGER DEFAULT 0,
  postCount INTEGER DEFAULT 0,
  isVerified BOOLEAN DEFAULT false,
  socialLinks TEXT,
  collaborationCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "draft",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  collaborations TEXT
);

CREATE TABLE IF NOT EXISTS "job" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  payload JSONB,
  status TEXT DEFAULT "pending",
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  maxAttempts INTEGER DEFAULT 3,
  nextRetryAt TEXT,
  lockedAt TEXT,
  lockedBy TEXT,
  result TEXT,
  error TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  retries TEXT,
  deadLetterEntry TEXT
);

CREATE TABLE IF NOT EXISTS "job_retry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  jobId TEXT,
  attempt INTEGER,
  error TEXT,
  stackTrace TEXT,
  retriedAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  job TEXT
);

CREATE TABLE IF NOT EXISTS "job_schedule" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  cron TEXT,
  payload JSONB,
  isActive BOOLEAN DEFAULT true,
  lastRunAt TEXT,
  nextRunAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "leaderboard_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  displayName TEXT,
  avatar TEXT,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  category TEXT DEFAULT "all",
  timePeriod TEXT DEFAULT "weekly",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "level" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  rank INTEGER,
  minPoints INTEGER,
  icon TEXT,
  color TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rewardAccounts TEXT
);

CREATE TABLE IF NOT EXISTS "location" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  latitude TEXT,
  longitude TEXT,
  universeId TEXT,
  parentId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  parent TEXT,
  children TEXT,
  characters TEXT,
  timeline TEXT
);

CREATE TABLE IF NOT EXISTS "locked_extra" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  extraType TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  price TEXT,
  currency TEXT DEFAULT "NGN",
  unlockType TEXT DEFAULT "purchase",
  isUnlocked BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  content TEXT
);

CREATE TABLE IF NOT EXISTS "lore_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  category TEXT,
  content TEXT,
  excerpt TEXT,
  coverImage TEXT,
  importance TEXT DEFAULT "normal",
  universeId TEXT,
  viewCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "published",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "media_asset" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentItemId TEXT,
  originalUrl TEXT,
  thumbnailUrl TEXT,
  format TEXT,
  size INTEGER,
  duration TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  contentItem TEXT
);

CREATE TABLE IF NOT EXISTS "media_upload" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  fileName TEXT,
  mimeType TEXT,
  size BIGINT,
  status TEXT DEFAULT "pending",
  uploadId TEXT,
  assetId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "message" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversationId TEXT,
  senderId TEXT,
  content TEXT,
  type TEXT DEFAULT "text",
  isRead BOOLEAN DEFAULT false,
  readAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  conversation TEXT
);

CREATE TABLE IF NOT EXISTS "mission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  points INTEGER,
  type TEXT,
  isActive BOOLEAN DEFAULT true,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rewards TEXT,
  completions TEXT
);

CREATE TABLE IF NOT EXISTS "mission_completion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  missionId TEXT,
  completedAt TIMESTAMPTZ DEFAULT now(),
  mission TEXT
);

CREATE TABLE IF NOT EXISTS "mission_reward" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  missionId TEXT,
  rewardId TEXT,
  quantity INTEGER DEFAULT 1,
  createdAt TIMESTAMPTZ DEFAULT now(),
  mission TEXT,
  reward TEXT
);

CREATE TABLE IF NOT EXISTS "moderation_case" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportId TEXT,
  userId TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionAction TEXT,
  resolutionReason TEXT,
  resolution TEXT,
  notes TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  report TEXT,
  user TEXT,
  resolvedByUser TEXT,
  Appeal TEXT,
  reviewerAssignments TEXT
);

CREATE TABLE IF NOT EXISTS "movie" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  mediaUrl TEXT,
  universeId TEXT,
  creatorId TEXT,
  status TEXT,
  viewCount INTEGER DEFAULT 0,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rentals TEXT,
  watchlistItems TEXT,
  viewingWindows TEXT,
  Premiere TEXT
);

CREATE TABLE IF NOT EXISTS "music_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  coverImage TEXT,
  artistName TEXT,
  albumName TEXT,
  duration TEXT,
  genre TEXT,
  trackUrl TEXT,
  isPremium BOOLEAN DEFAULT false,
  playCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "draft",
  createdById TEXT,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "nightlife_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  coverImage TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude TEXT,
  longitude TEXT,
  hours TEXT,
  dressCode TEXT,
  coverCharge TEXT,
  rating TEXT,
  status TEXT DEFAULT "draft",
  viewCount INTEGER DEFAULT 0,
  createdById TEXT,
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  metadata TEXT,
  readAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notification_preference" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  pushEnabled BOOLEAN DEFAULT true,
  emailEnabled BOOLEAN DEFAULT true,
  smsEnabled BOOLEAN DEFAULT false,
  inAppEnabled BOOLEAN DEFAULT true,
  quietHoursStart TEXT,
  quietHoursEnd TEXT,
  timezone TEXT,
  categoryOverrides TEXT
);

CREATE TABLE IF NOT EXISTS "notification_template" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT,
  channel TEXT,
  subject TEXT,
  body TEXT,
  variables JSONB
);

CREATE TABLE IF NOT EXISTS "orisa_file" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  title TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  domain TEXT,
  symbols TEXT,
  status TEXT DEFAULT "active",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "otp" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  code TEXT,
  expiresAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  user TEXT
);

CREATE TABLE IF NOT EXISTS "pass" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  passType TEXT,
  universeId TEXT,
  status TEXT DEFAULT "active",
  startTime TIMESTAMPTZ DEFAULT now(),
  endTime TIMESTAMPTZ,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  transactionId TEXT,
  autoRenew BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "payment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT DEFAULT "pending",
  type TEXT DEFAULT "payment",
  provider TEXT,
  providerRef TEXT,
  failureReason TEXT,
  refundAmount TEXT,
  metadata TEXT,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payment_intent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT,
  provider TEXT,
  reference TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payment_method" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  provider TEXT,
  providerToken TEXT,
  type TEXT,
  brand TEXT,
  last4 TEXT,
  expiryMonth TEXT,
  expiryYear TEXT,
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payout_dispute" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  creatorId TEXT,
  payoutId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  evidence TEXT,
  status TEXT DEFAULT "PENDING",
  resolution TEXT,
  resolvedAt TEXT,
  resolvedBy TEXT,
  compensation TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "payout_request" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  amount NUMERIC,
  method TEXT,
  accountDetails JSONB,
  status TEXT DEFAULT "pending",
  processedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  creator TEXT
);

CREATE TABLE IF NOT EXISTS "permission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  resource TEXT,
  action TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rolePermissions TEXT
);

CREATE TABLE IF NOT EXISTS "poll" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  status TEXT DEFAULT "draft",
  totalVotes INTEGER DEFAULT 0,
  createdById TEXT,
  expiresAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  options TEXT,
  votes TEXT
);

CREATE TABLE IF NOT EXISTS "poll_option" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  pollId TEXT,
  text TEXT,
  imageUrl TEXT,
  voteCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  poll TEXT,
  votes TEXT
);

CREATE TABLE IF NOT EXISTS "poll_vote" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  pollId TEXT,
  optionId TEXT,
  userId TEXT,
  votedAt TIMESTAMPTZ DEFAULT now(),
  poll TEXT,
  option TEXT
);

CREATE TABLE IF NOT EXISTS "prediction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  showId TEXT,
  prediction JSONB,
  episodeId TEXT,
  contestantId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  show TEXT,
  episode TEXT,
  contestant TEXT
);

CREATE TABLE IF NOT EXISTS "prediction_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  eventId TEXT,
  prediction JSONB,
  points INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  event TEXT,
  PredictionMarket TEXT,
  predictionMarketId TEXT
);

CREATE TABLE IF NOT EXISTS "prediction_market" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  question TEXT,
  options JSONB,
  odds TEXT,
  totalPool NUMERIC DEFAULT 0,
  status TEXT DEFAULT "active",
  settlementType TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  event TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "prediction_reward" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  correctPredictions INTEGER DEFAULT 0,
  rewardPoints INTEGER DEFAULT 0,
  bonusPool NUMERIC DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  event TEXT
);

CREATE TABLE IF NOT EXISTS "premiere" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  movieId TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  status TEXT DEFAULT "scheduled",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "premium_purchase" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  extraId TEXT,
  extraName TEXT,
  extraType TEXT,
  price NUMERIC,
  duration TEXT,
  purchaseId TEXT,
  purchasedAt TIMESTAMPTZ DEFAULT now(),
  expiresAt TEXT,
  status TEXT DEFAULT "active"
);

CREATE TABLE IF NOT EXISTS "product_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventName TEXT,
  userId TEXT,
  sessionId TEXT,
  platform TEXT,
  universe TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  deviceInfo TEXT,
  appVersion TEXT,
  experimentFlags TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS "prophecy" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  imageUrl TEXT,
  universeId TEXT,
  source TEXT,
  status TEXT DEFAULT "active",
  fulfilledAt TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "push_token" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  token TEXT,
  deviceType TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "question" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challengeId TEXT,
  question TEXT,
  answer TEXT,
  options TEXT,
  points INTEGER DEFAULT 10,
  order INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "quiz" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  category TEXT,
  difficulty TEXT DEFAULT "easy",
  timeLimit TEXT,
  status TEXT DEFAULT "draft",
  playCount INTEGER DEFAULT 0,
  createdById TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  questions TEXT,
  attempts TEXT
);

CREATE TABLE IF NOT EXISTS "quiz_attempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  quizId TEXT,
  userId TEXT,
  score INTEGER DEFAULT 0,
  totalQuestions INTEGER,
  answers TEXT,
  completedAt TEXT,
  startedAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  quiz TEXT
);

CREATE TABLE IF NOT EXISTS "quiz_question" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  quizId TEXT,
  question TEXT,
  options TEXT,
  correctAnswer INTEGER,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order INTEGER,
  quiz TEXT
);

CREATE TABLE IF NOT EXISTS "ranking" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  displayName TEXT,
  avatar TEXT,
  category TEXT,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  period TEXT DEFAULT "all",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "ranking_rule" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  signal TEXT,
  weight NUMERIC DEFAULT 1,
  conditions JSONB
);

CREATE TABLE IF NOT EXISTS "reality_clip" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  showId TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  show TEXT
);

CREATE TABLE IF NOT EXISTS "reality_show" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  universeId TEXT,
  status TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  seasons TEXT,
  contestants TEXT,
  episodes TEXT,
  votes TEXT,
  supervotes TEXT,
  predictions TEXT,
  clips TEXT
);

CREATE TABLE IF NOT EXISTS "realm" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "physical",
  parentId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  parent TEXT,
  children TEXT
);

CREATE TABLE IF NOT EXISTS "recap" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titleId TEXT,
  season TEXT,
  episode TEXT,
  name TEXT,
  content TEXT,
  coverImage TEXT,
  isSpoiler BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "published",
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  title TEXT
);

CREATE TABLE IF NOT EXISTS "recommendation_log" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  type TEXT,
  itemId TEXT,
  score NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referral" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  referrerId TEXT,
  referredId TEXT,
  referralCodeId TEXT,
  status TEXT DEFAULT "pending",
  rewardAmount TEXT DEFAULT 0,
  rewardStatus TEXT DEFAULT "pending",
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  referralCode TEXT
);

CREATE TABLE IF NOT EXISTS "referral_code" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  code TEXT,
  isActive BOOLEAN DEFAULT true,
  maxUses TEXT,
  currentUses INTEGER DEFAULT 0,
  expiresAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  referrals TEXT
);

CREATE TABLE IF NOT EXISTS "referral_config" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT,
  value NUMERIC,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "referral_reward" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  referralId TEXT,
  userId TEXT,
  amount NUMERIC,
  type TEXT,
  status TEXT DEFAULT "pending",
  creditedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "refund" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  paymentId TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  status TEXT DEFAULT "PENDING",
  refundReference TEXT,
  processedAt TEXT,
  processedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "rental" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  movieId TEXT,
  status TEXT DEFAULT "active",
  expiresAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "report" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportingUserId TEXT,
  type TEXT,
  contentId TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionAction TEXT,
  resolutionReason TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ModerationCase TEXT,
  reportingUser TEXT,
  reportedUser TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS "report_execution" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportId TEXT,
  executedBy TEXT,
  executionTime INTEGER,
  rowCount INTEGER,
  parameters JSONB,
  executedAt TIMESTAMPTZ DEFAULT now(),
  report TEXT
);

CREATE TABLE IF NOT EXISTS "reviewer_assignment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  caseId TEXT,
  reviewerId TEXT,
  assignedBy TEXT,
  status TEXT,
  assignedAt TIMESTAMPTZ DEFAULT now(),
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  case TEXT
);

CREATE TABLE IF NOT EXISTS "reward" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  cost INTEGER,
  type TEXT,
  metadata TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  redemptions TEXT,
  missionRewards TEXT
);

CREATE TABLE IF NOT EXISTS "reward_account" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  points INTEGER DEFAULT 0,
  levelId TEXT,
  streak INTEGER DEFAULT 0,
  lastLoginAt TIMESTAMPTZ DEFAULT now(),
  lastCheckInAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  level TEXT,
  badges TEXT
);

CREATE TABLE IF NOT EXISTS "reward_redemption" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  rewardId TEXT,
  pointsCost INTEGER,
  redeemedAt TIMESTAMPTZ DEFAULT now(),
  reward TEXT
);

CREATE TABLE IF NOT EXISTS "role" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  rolePermissions TEXT
);

CREATE TABLE IF NOT EXISTS "role_permission" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  roleId TEXT,
  permissionId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  role TEXT,
  permission TEXT
);

CREATE TABLE IF NOT EXISTS "room" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  posts TEXT
);

CREATE TABLE IF NOT EXISTS "room_post" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  roomId TEXT,
  content TEXT,
  authorId TEXT,
  authorName TEXT,
  authorAvatar TEXT,
  spoilerLevel TEXT DEFAULT "none",
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  room TEXT
);

CREATE TABLE IF NOT EXISTS "safety_action" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  targetId TEXT,
  targetType TEXT,
  reason TEXT,
  moderatorId TEXT,
  duration TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "safety_scan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  mediaUrl TEXT,
  scanType TEXT,
  status TEXT,
  result TEXT,
  details TEXT,
  threatLevel TEXT,
  categories TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  completedAt TEXT,
  scanDurationMs TEXT
);

CREATE TABLE IF NOT EXISTS "saved_item" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  itemType TEXT,
  itemId TEXT,
  note TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "score_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "screening" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  screeningTime TIMESTAMPTZ,
  endTime TIMESTAMPTZ,
  location TEXT,
  streamUrl TEXT,
  status TEXT DEFAULT "scheduled",
  maxViewers TEXT,
  currentViewers INTEGER DEFAULT 0,
  price TEXT,
  currency TEXT DEFAULT "NGN",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  content TEXT
);

CREATE TABLE IF NOT EXISTS "search_query_log" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  query TEXT,
  userId TEXT,
  resultCount INTEGER DEFAULT 0,
  clickedId TEXT,
  session TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "season" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  showId TEXT,
  title TEXT,
  number INTEGER,
  description TEXT,
  startDate TEXT,
  endDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  show TEXT,
  episodes TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  refreshToken TEXT,
  expiresAt TIMESTAMPTZ,
  deviceName TEXT,
  deviceType TEXT,
  os TEXT,
  browser TEXT,
  ipAddress TEXT,
  lastActiveAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  user TEXT
);

CREATE TABLE IF NOT EXISTS "session_summary" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sessionId TEXT,
  userId TEXT,
  platform TEXT,
  universe TEXT,
  startedAt TIMESTAMPTZ,
  endedAt TEXT,
  durationSeconds INTEGER DEFAULT 0,
  screenViews INTEGER DEFAULT 0,
  eventsCount INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "share_record" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  itemType TEXT,
  itemId TEXT,
  platform TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "social_account" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  provider TEXT,
  socialId TEXT,
  accessToken TEXT,
  refreshToken TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  user TEXT
);

CREATE TABLE IF NOT EXISTS "special_like" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  specialId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  special TEXT
);

CREATE TABLE IF NOT EXISTS "sports_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  sport TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  status TEXT DEFAULT "upcoming",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  teams TEXT,
  predictions TEXT,
  fanBoards TEXT,
  contests TEXT,
  PredictionMarket TEXT,
  Highlight TEXT,
  Contest TEXT,
  fixtureMetadata TEXT,
  predictionReward TEXT
);

CREATE TABLE IF NOT EXISTS "story_category" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  stories TEXT
);

CREATE TABLE IF NOT EXISTS "story_comment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  content TEXT,
  authorId TEXT,
  storyId TEXT,
  parentId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  story TEXT,
  parent TEXT,
  replies TEXT
);

CREATE TABLE IF NOT EXISTS "subscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  creatorId TEXT,
  tier TEXT DEFAULT "free",
  status TEXT DEFAULT "active",
  startDate TIMESTAMPTZ DEFAULT now(),
  endDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "subscription_plan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  duration INTEGER,
  features TEXT,
  isActive BOOLEAN DEFAULT true,
  tier TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  subscriptions TEXT
);

CREATE TABLE IF NOT EXISTS "subscription_transaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  subscriptionId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT DEFAULT "completed",
  paymentProvider TEXT,
  providerTxId TEXT,
  description TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "suggestion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  term TEXT,
  type TEXT,
  universe TEXT,
  weight INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  startsAt TEXT,
  endsAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "supervote" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  contestantId TEXT,
  showId TEXT,
  amount NUMERIC DEFAULT 10,
  createdAt TIMESTAMPTZ DEFAULT now(),
  contestant TEXT,
  show TEXT
);

CREATE TABLE IF NOT EXISTS "support_analytics_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event TEXT,
  data JSONB,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "support_message" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  senderId TEXT,
  senderType TEXT,
  message TEXT,
  isInternal BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(),
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "support_ticket" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  orderId TEXT,
  ticketId TEXT DEFAULT uuid(,
  category TEXT,
  priority TEXT DEFAULT MEDIUM,
  status TEXT DEFAULT OPEN,
  subject TEXT,
  description TEXT,
  metadata TEXT,
  assignedTo TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  messages TEXT,
  refund TEXT,
  chargeback TEXT,
  appeal TEXT,
  takedown TEXT,
  dispute TEXT,
  suspension TEXT
);

CREATE TABLE IF NOT EXISTS "tag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  contentItems TEXT
);

CREATE TABLE IF NOT EXISTS "theory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  content TEXT,
  authorId TEXT,
  authorName TEXT,
  spoilerLevel TEXT DEFAULT "none",
  accessLevel TEXT DEFAULT "public",
  status TEXT DEFAULT "published",
  viewCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "timeline_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  date TIMESTAMPTZ,
  endDate TEXT,
  type TEXT,
  importance TEXT DEFAULT "normal",
  universeId TEXT,
  characterId TEXT,
  locationId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  character TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS "tip" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fromUserId TEXT,
  toUserId TEXT,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "title" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  coverImage TEXT,
  releaseYear TEXT,
  endYear TEXT,
  status TEXT DEFAULT "ongoing",
  rating TEXT,
  universeId TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  recaps TEXT,
  crossovers TEXT,
  chapters TEXT
);

CREATE TABLE IF NOT EXISTS "tournament" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  entryFee NUMERIC DEFAULT 0,
  prizePool NUMERIC,
  status TEXT DEFAULT "active",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "tournament_entry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  tournamentId TEXT,
  score INTEGER DEFAULT 0,
  enteredAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_match" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tournamentId TEXT,
  player1Id TEXT,
  player2Id TEXT,
  player1Score INTEGER DEFAULT 0,
  player2Score INTEGER DEFAULT 0,
  round INTEGER,
  status TEXT DEFAULT "pending",
  winnerId TEXT,
  scheduledAt TEXT,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_prize" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tournamentId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "transcoding_job" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  mediaAssetId TEXT,
  sourceUrl TEXT,
  outputUrl TEXT,
  format TEXT,
  status TEXT DEFAULT "pending",
  progress INTEGER DEFAULT 0,
  profiles JSONB
);

CREATE TABLE IF NOT EXISTS "trust_score_history" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  oldScore INTEGER,
  newScore INTEGER,
  reason TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "universe" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  displayName TEXT,
  isEnabled BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "universe_feature_flag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  universeId TEXT,
  featureKey TEXT,
  isEnabled BOOLEAN DEFAULT true,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "universe_map" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  data TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  characters TEXT,
  locations TEXT,
  timeline TEXT,
  titles TEXT,
  loreEntries TEXT,
  realms TEXT,
  orisaFiles TEXT,
  artifacts TEXT,
  prophecies TEXT,
  worldMaps TEXT,
  rooms TEXT
);

CREATE TABLE IF NOT EXISTS "upload_session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  fileName TEXT,
  fileSize INTEGER,
  fileType TEXT,
  uploadId TEXT,
  bucket TEXT,
  key TEXT,
  parts TEXT
);

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT,
  displayName TEXT,
  role TEXT DEFAULT "user",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "user_profile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  displayName TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  isPublic BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "user_role" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  role TEXT,
  grantedBy TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_search" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  query TEXT,
  filters TEXT,
  resultCount INTEGER DEFAULT 0,
  clickedId TEXT,
  lastSearchAt TIMESTAMPTZ DEFAULT now(),
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_segment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  segmentId TEXT,
  score DOUBLE PRECISION DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_suspension" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  userId TEXT,
  reason TEXT,
  suspendedBy TEXT,
  status TEXT DEFAULT "ACTIVE",
  suspendedAt TIMESTAMPTZ DEFAULT now(),
  expiresAt TEXT,
  reinstatedAt TEXT,
  reinstatedBy TEXT,
  evidence TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "user_unlock" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  unlockType TEXT,
  resourceId TEXT,
  transactionId TEXT,
  price TEXT,
  currency TEXT DEFAULT "NGN",
  unlockedAt TIMESTAMPTZ DEFAULT now(),
  expiresAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "verification_document" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  documentType TEXT,
  documentUrl TEXT,
  status TEXT DEFAULT "pending",
  reviewedBy TEXT,
  reviewedAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "viewing_window" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  movieId TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  type TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "vote" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  contestantId TEXT,
  showId TEXT,
  episodeId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  contestant TEXT,
  show TEXT,
  episode TEXT
);

CREATE TABLE IF NOT EXISTS "wallet" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  balance NUMERIC DEFAULT 0,
  bonusBalance NUMERIC DEFAULT 0,
  promoBalance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT "NGN",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  version INTEGER DEFAULT 0,
  transactions TEXT,
  balanceSnapshots TEXT
);

CREATE TABLE IF NOT EXISTS "wallet_snapshot" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT "NGN",
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "wallet_transaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  walletId TEXT,
  type TEXT,
  amount NUMERIC,
  status TEXT,
  description TEXT,
  reference TEXT,
  provider TEXT,
  providerRef TEXT,
  metadata TEXT,
  idempotencyKey TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  wallet TEXT
);

CREATE TABLE IF NOT EXISTS "wallet_transaction_snapshot" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  walletId TEXT,
  type TEXT,
  amount NUMERIC,
  description TEXT,
  reference TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "watchlist_item" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  movieId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "webhook_event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  payload JSONB,
  provider TEXT,
  processedAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "webhook_retry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  provider TEXT,
  type TEXT,
  payload JSONB,
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 5,
  nextRetryAt TIMESTAMPTZ,
  status TEXT DEFAULT "pending",
  lastError TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "world_map" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "geographic",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ,
  universe TEXT
);



-- ============================================================================
-- MISSING TABLES FROM PRISMA SCHEMAS (Auto-generated v3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "appeals" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  caseId TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionReason TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  case TEXT
);

CREATE TABLE IF NOT EXISTS "artifacts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "physical",
  power TEXT,
  origin TEXT,
  status TEXT DEFAULT "active",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "audience_segments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  segmentType TEXT,
  criteria JSONB,
  size INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "audit_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  action TEXT,
  resourceType TEXT,
  resourceId TEXT,
  actorId TEXT,
  actorType TEXT,
  details TEXT,
  previousState TEXT,
  newState TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "challenge_prizes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challengeId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(,
  challenge TEXT
);

CREATE TABLE IF NOT EXISTS "challenges" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  type TEXT,
  points INTEGER DEFAULT 10,
  status TEXT DEFAULT "active",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "channels" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  creator TEXT
);

CREATE TABLE IF NOT EXISTS "chapters" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titleId TEXT,
  number DOUBLE PRECISION,
  name TEXT,
  description TEXT,
  coverImage TEXT,
  content TEXT,
  wordCount TEXT,
  status TEXT DEFAULT "published",
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  title TEXT
);

CREATE TABLE IF NOT EXISTS "character_locations" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  characterId TEXT,
  locationId TEXT,
  role TEXT,
  description TEXT,
  firstSeenAt TEXT,
  lastSeenAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  character TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS "character_relationships" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fromId TEXT,
  toId TEXT,
  type TEXT,
  description TEXT,
  startDate TEXT,
  endDate TEXT,
  isOfficial BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  from TEXT,
  to TEXT
);

CREATE TABLE IF NOT EXISTS "characters" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  avatarUrl TEXT,
  role TEXT,
  status TEXT DEFAULT "active",
  universeId TEXT,
  birthDate TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  locations TEXT,
  relationshipsFrom TEXT,
  relationshipsTo TEXT,
  timeline TEXT
);

CREATE TABLE IF NOT EXISTS "chargebacks" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  paymentId TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  status TEXT DEFAULT "PENDING",
  disputeDeadline TIMESTAMPTZ,
  evidenceDue TIMESTAMPTZ,
  chargebackRef TEXT,
  resolution TEXT,
  resolvedAt TEXT,
  resolvedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "churn_risks" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  riskLevel TEXT,
  churnProbability DOUBLE PRECISION DEFAULT 0,
  factors JSONB,
  lastActivityAt TEXT,
  predictedChurnAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "cinema_pass_subscriptions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  passId TEXT,
  status TEXT DEFAULT "active",
  startDate TIMESTAMPTZ,
  endDate TIMESTAMPTZ,
  autoRenew BOOLEAN DEFAULT true,
  paymentIntentId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  pass TEXT
);

CREATE TABLE IF NOT EXISTS "cinema_passes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  features TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  subscriptions TEXT
);

CREATE TABLE IF NOT EXISTS "clip_comments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  text TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "clip_likes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "clip_shares" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  clipId TEXT,
  platform TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "cohort_members" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  cohortId TEXT,
  userId TEXT,
  joinedAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "cohorts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  criteria JSONB,
  size INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "comedy_challenge_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  challengeId TEXT,
  clipUrl TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  challenge TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_challenges" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  status TEXT DEFAULT "active",
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  prizes TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_episodes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  seriesId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  duration TEXT,
  viewCount INTEGER DEFAULT 0,
  order INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  series TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_specials" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  duration TEXT,
  comedianId TEXT,
  genre TEXT,
  isPremium BOOLEAN DEFAULT true,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  viewCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  releaseDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  comedian TEXT,
  likes TEXT
);

CREATE TABLE IF NOT EXISTS "comedy_trends" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  clipId TEXT,
  score DOUBLE PRECISION DEFAULT 0,
  rank INTEGER,
  period TEXT DEFAULT "daily",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  clip TEXT
);

CREATE TABLE IF NOT EXISTS "content_takedowns" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  contentId TEXT,
  reportedBy TEXT,
  reason TEXT,
  evidence TEXT,
  status TEXT DEFAULT "PENDING",
  decision TEXT,
  decidedAt TEXT,
  decidedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "contents" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  type TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  reports TEXT
);

CREATE TABLE IF NOT EXISTS "contest_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contestId TEXT,
  userId TEXT,
  entryData JSONB,
  score INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  contest TEXT,
  SportsEvent TEXT,
  sportsEventId TEXT
);

CREATE TABLE IF NOT EXISTS "contest_prizes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contestId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(,
  contest TEXT
);

CREATE TABLE IF NOT EXISTS "contests" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  title TEXT,
  description TEXT,
  entryFee NUMERIC DEFAULT 0,
  prizePool NUMERIC,
  status TEXT DEFAULT "active",
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  event TEXT,
  prizes TEXT,
  entries TEXT
);

CREATE TABLE IF NOT EXISTS "conversation_participants" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversationId TEXT,
  userId TEXT,
  role TEXT DEFAULT "member",
  joinedAt TIMESTAMPTZ DEFAULT now(,
  lastReadAt TIMESTAMPTZ DEFAULT now(,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  conversation TEXT
);

CREATE TABLE IF NOT EXISTS "conversations" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT DEFAULT "direct",
  name TEXT,
  avatar TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  participants TEXT,
  messages TEXT
);

CREATE TABLE IF NOT EXISTS "conversion_metrics" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  funnelId TEXT,
  triggerEvent TEXT,
  conditions JSONB,
  windowMinutes TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "creator_scores" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  creatorId TEXT,
  engagementScore DOUBLE PRECISION DEFAULT 0,
  growthScore DOUBLE PRECISION DEFAULT 0,
  monetizationScore DOUBLE PRECISION DEFAULT 0,
  overallScore DOUBLE PRECISION DEFAULT 0,
  lastUpdated TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "crossover_titles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  crossoverId TEXT,
  titleId TEXT,
  crossover TEXT,
  title TEXT
);

CREATE TABLE IF NOT EXISTS "crossovers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  description TEXT,
  coverImage TEXT,
  startDate TEXT,
  endDate TEXT,
  status TEXT DEFAULT "announced",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  titles TEXT
);

CREATE TABLE IF NOT EXISTS "data_deletion_requests" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT DEFAULT "scheduled",
  scheduledAt TIMESTAMPTZ DEFAULT now(,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "dead_letter_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  jobId TEXT,
  type TEXT,
  payload JSONB,
  error TEXT,
  attempts INTEGER,
  movedAt TIMESTAMPTZ DEFAULT now(,
  createdAt TIMESTAMPTZ DEFAULT now(,
  job TEXT
);

CREATE TABLE IF NOT EXISTS "event_schemas" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  properties JSONB,
  required JSONB,
  version INTEGER DEFAULT 1,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "experiment_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  experimentKey TEXT,
  userId TEXT,
  variant TEXT,
  assignmentAt TIMESTAMPTZ DEFAULT now(,
  outcome TEXT,
  outcomeAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "fan_board_comments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fanBoardId TEXT,
  userId TEXT,
  text TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  fanBoard TEXT
);

CREATE TABLE IF NOT EXISTS "fan_boards" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  userId TEXT,
  text TEXT,
  likes INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  event TEXT,
  comments TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_backers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  projectId TEXT,
  userId TEXT,
  amount NUMERIC,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(,
  project TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_projects" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  filmmakerId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  status TEXT DEFAULT "development",
  fundingGoal TEXT,
  fundingRaised NUMERIC DEFAULT 0,
  targetDate TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  updates TEXT,
  backers TEXT
);

CREATE TABLE IF NOT EXISTS "filmmaker_updates" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  projectId TEXT,
  title TEXT,
  content TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  project TEXT
);

CREATE TABLE IF NOT EXISTS "fraud_detections" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  eventType TEXT,
  severity TEXT,
  details JSONB,
  status TEXT DEFAULT "pending",
  reviewedBy TEXT,
  reviewedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "funnel_completions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  funnelId TEXT,
  userId TEXT,
  completedSteps INTEGER DEFAULT 0,
  completedAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "funnel_steps" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  funnelId TEXT,
  stepOrder INTEGER,
  eventName TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  funnel TEXT
);

CREATE TABLE IF NOT EXISTS "funnels" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  steps JSONB,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  funnelSteps TEXT
);

CREATE TABLE IF NOT EXISTS "game_answers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sessionId TEXT,
  questionId TEXT,
  answer TEXT,
  isCorrect BOOLEAN,
  timeTaken INTEGER,
  pointsEarned INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "game_play_sessions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  gameId TEXT,
  score INTEGER DEFAULT 0,
  correctCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "active",
  startedAt TIMESTAMPTZ DEFAULT now(,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "game_sessions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  challengeId TEXT,
  questionId TEXT,
  status TEXT,
  score INTEGER DEFAULT 0,
  startedAt TIMESTAMPTZ DEFAULT now(,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "highlights" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "job_retries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  jobId TEXT,
  attempt INTEGER,
  error TEXT,
  stackTrace TEXT,
  retriedAt TIMESTAMPTZ DEFAULT now(,
  createdAt TIMESTAMPTZ DEFAULT now(,
  job TEXT
);

CREATE TABLE IF NOT EXISTS "job_schedules" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  cron TEXT,
  payload JSONB,
  isActive BOOLEAN DEFAULT true,
  lastRunAt TEXT,
  nextRunAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "jobs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  payload JSONB,
  status TEXT DEFAULT "pending",
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  maxAttempts INTEGER DEFAULT 3,
  nextRetryAt TEXT,
  lockedAt TEXT,
  lockedBy TEXT,
  result TEXT,
  error TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  retries TEXT,
  deadLetterEntry TEXT
);

CREATE TABLE IF NOT EXISTS "locations" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  latitude TEXT,
  longitude TEXT,
  universeId TEXT,
  parentId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  parent TEXT,
  children TEXT,
  characters TEXT,
  timeline TEXT
);

CREATE TABLE IF NOT EXISTS "lore_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  category TEXT,
  content TEXT,
  excerpt TEXT,
  coverImage TEXT,
  importance TEXT DEFAULT "normal",
  universeId TEXT,
  viewCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "published",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "media_uploads" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  fileName TEXT,
  mimeType TEXT,
  size BIGINT,
  status TEXT DEFAULT "pending",
  uploadId TEXT,
  assetId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "messages" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversationId TEXT,
  senderId TEXT,
  content TEXT,
  type TEXT DEFAULT "text",
  isRead BOOLEAN DEFAULT false,
  readAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  conversation TEXT
);

CREATE TABLE IF NOT EXISTS "moderation_cases" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportId TEXT,
  userId TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionAction TEXT,
  resolutionReason TEXT,
  resolution TEXT,
  notes TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  report TEXT,
  user TEXT,
  resolvedByUser TEXT,
  Appeal TEXT,
  reviewerAssignments TEXT
);

CREATE TABLE IF NOT EXISTS "movies" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  mediaUrl TEXT,
  universeId TEXT,
  creatorId TEXT,
  status TEXT,
  viewCount INTEGER DEFAULT 0,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  rentals TEXT,
  watchlistItems TEXT,
  viewingWindows TEXT,
  Premiere TEXT
);

CREATE TABLE IF NOT EXISTS "orisa_files" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  title TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  domain TEXT,
  symbols TEXT,
  status TEXT DEFAULT "active",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "payment_intents" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT,
  provider TEXT,
  reference TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payment_methods" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  provider TEXT,
  providerToken TEXT,
  type TEXT,
  brand TEXT,
  last4 TEXT,
  expiryMonth TEXT,
  expiryYear TEXT,
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT DEFAULT "pending",
  type TEXT DEFAULT "payment",
  provider TEXT,
  providerRef TEXT,
  failureReason TEXT,
  refundAmount TEXT,
  metadata TEXT,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payout_disputes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  creatorId TEXT,
  payoutId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  evidence TEXT,
  status TEXT DEFAULT "PENDING",
  resolution TEXT,
  resolvedAt TEXT,
  resolvedBy TEXT,
  compensation TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "prediction_rewards" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  correctPredictions INTEGER DEFAULT 0,
  rewardPoints INTEGER DEFAULT 0,
  bonusPool NUMERIC DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  event TEXT
);

CREATE TABLE IF NOT EXISTS "predictions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  contentId TEXT,
  prediction TEXT,
  points INTEGER DEFAULT 0,
  isCorrect TEXT,
  result TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "premieres" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  movieId TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  status TEXT DEFAULT "scheduled",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "prophecies" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  imageUrl TEXT,
  universeId TEXT,
  source TEXT,
  status TEXT DEFAULT "active",
  fulfilledAt TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT
);

CREATE TABLE IF NOT EXISTS "push_tokens" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  token TEXT,
  deviceType TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "questions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  challengeId TEXT,
  question TEXT,
  answer TEXT,
  options TEXT,
  points INTEGER DEFAULT 10,
  order INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "rankings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  displayName TEXT,
  avatar TEXT,
  category TEXT,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  period TEXT DEFAULT "all",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "reality_clips" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  showId TEXT,
  creatorId TEXT,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  mediaUrl TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  show TEXT
);

CREATE TABLE IF NOT EXISTS "reality_premium_purchases" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  extraId TEXT,
  extraName TEXT,
  extraType TEXT,
  price NUMERIC,
  duration TEXT,
  purchaseId TEXT,
  purchasedAt TIMESTAMPTZ DEFAULT now(,
  expiresAt TEXT,
  status TEXT DEFAULT "active"
);

CREATE TABLE IF NOT EXISTS "realms" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "physical",
  parentId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  parent TEXT,
  children TEXT
);

CREATE TABLE IF NOT EXISTS "recaps" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titleId TEXT,
  season TEXT,
  episode TEXT,
  name TEXT,
  content TEXT,
  coverImage TEXT,
  isSpoiler BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  status TEXT DEFAULT "published",
  publishedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  title TEXT
);

CREATE TABLE IF NOT EXISTS "referral_codes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  code TEXT,
  isActive BOOLEAN DEFAULT true,
  maxUses TEXT,
  currentUses INTEGER DEFAULT 0,
  expiresAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  referrals TEXT
);

CREATE TABLE IF NOT EXISTS "referral_configs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT,
  value NUMERIC,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "referral_rewards" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  referralId TEXT,
  userId TEXT,
  amount NUMERIC,
  type TEXT,
  status TEXT DEFAULT "pending",
  creditedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "refunds" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  paymentId TEXT,
  userId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  reason TEXT,
  status TEXT DEFAULT "PENDING",
  refundReference TEXT,
  processedAt TEXT,
  processedBy TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "report_executions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportId TEXT,
  executedBy TEXT,
  executionTime INTEGER,
  rowCount INTEGER,
  parameters JSONB,
  executedAt TIMESTAMPTZ DEFAULT now(,
  report TEXT
);

CREATE TABLE IF NOT EXISTS "reports" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reportingUserId TEXT,
  type TEXT,
  contentId TEXT,
  userId TEXT,
  reason TEXT,
  status TEXT,
  resolvedBy TEXT,
  resolutionAction TEXT,
  resolutionReason TEXT,
  resolvedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ModerationCase TEXT,
  reportingUser TEXT,
  reportedUser TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS "reviewer_assignments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  caseId TEXT,
  reviewerId TEXT,
  assignedBy TEXT,
  status TEXT,
  assignedAt TIMESTAMPTZ DEFAULT now(,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  case TEXT
);

CREATE TABLE IF NOT EXISTS "room_posts" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  roomId TEXT,
  content TEXT,
  authorId TEXT,
  authorName TEXT,
  authorAvatar TEXT,
  spoilerLevel TEXT DEFAULT "none",
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  room TEXT
);

CREATE TABLE IF NOT EXISTS "rooms" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  posts TEXT
);

CREATE TABLE IF NOT EXISTS "safety_actions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  targetId TEXT,
  targetType TEXT,
  reason TEXT,
  moderatorId TEXT,
  duration TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "safety_scans" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contentId TEXT,
  mediaUrl TEXT,
  scanType TEXT,
  status TEXT,
  result TEXT,
  details TEXT,
  threatLevel TEXT,
  categories TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  completedAt TEXT,
  scanDurationMs TEXT
);

CREATE TABLE IF NOT EXISTS "score_entries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "session_summaries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sessionId TEXT,
  userId TEXT,
  platform TEXT,
  universe TEXT,
  startedAt TIMESTAMPTZ,
  endedAt TEXT,
  durationSeconds INTEGER DEFAULT 0,
  screenViews INTEGER DEFAULT 0,
  eventsCount INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "special_likes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  specialId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  special TEXT
);

CREATE TABLE IF NOT EXISTS "subscription_plans" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT DEFAULT "NGN",
  duration INTEGER,
  features TEXT,
  isActive BOOLEAN DEFAULT true,
  tier TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  subscriptions TEXT
);

CREATE TABLE IF NOT EXISTS "subscription_transactions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  subscriptionId TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT "NGN",
  status TEXT DEFAULT "completed",
  paymentProvider TEXT,
  providerTxId TEXT,
  description TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "suggestions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  term TEXT,
  type TEXT,
  universe TEXT,
  weight INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  startsAt TEXT,
  endsAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "support_analytics_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event TEXT,
  data JSONB,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "support_messages" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  senderId TEXT,
  senderType TEXT,
  message TEXT,
  isInternal BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT now(,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "theories" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  slug TEXT,
  content TEXT,
  authorId TEXT,
  authorName TEXT,
  spoilerLevel TEXT DEFAULT "none",
  accessLevel TEXT DEFAULT "public",
  status TEXT DEFAULT "published",
  viewCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "timeline_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT,
  description TEXT,
  date TIMESTAMPTZ,
  endDate TEXT,
  type TEXT,
  importance TEXT DEFAULT "normal",
  universeId TEXT,
  characterId TEXT,
  locationId TEXT,
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  character TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS "tips" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  fromUserId TEXT,
  toUserId TEXT,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "titles" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  type TEXT,
  description TEXT,
  coverImage TEXT,
  releaseYear TEXT,
  endYear TEXT,
  status TEXT DEFAULT "ongoing",
  rating TEXT,
  universeId TEXT,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT,
  recaps TEXT,
  crossovers TEXT,
  chapters TEXT
);

CREATE TABLE IF NOT EXISTS "tournament_matches" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tournamentId TEXT,
  player1Id TEXT,
  player2Id TEXT,
  player1Score INTEGER DEFAULT 0,
  player2Score INTEGER DEFAULT 0,
  round INTEGER,
  status TEXT DEFAULT "pending",
  winnerId TEXT,
  scheduledAt TEXT,
  completedAt TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "tournament_prizes" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tournamentId TEXT,
  rank INTEGER,
  amount NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "transcoding_jobs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  uploadId TEXT,
  sourceKey TEXT,
  status TEXT DEFAULT "pending",
  progress INTEGER DEFAULT 0,
  outputKeys TEXT,
  error TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "universe_maps" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  data TEXT,
  status TEXT DEFAULT "active",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  characters TEXT,
  locations TEXT,
  timeline TEXT,
  titles TEXT,
  loreEntries TEXT,
  realms TEXT,
  orisaFiles TEXT,
  artifacts TEXT,
  prophecies TEXT,
  worldMaps TEXT,
  rooms TEXT
);

CREATE TABLE IF NOT EXISTS "user_segments" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  segmentId TEXT,
  score DOUBLE PRECISION DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "user_suspensions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticketId TEXT,
  userId TEXT,
  reason TEXT,
  suspendedBy TEXT,
  status TEXT DEFAULT "ACTIVE",
  suspendedAt TIMESTAMPTZ DEFAULT now(,
  expiresAt TEXT,
  reinstatedAt TEXT,
  reinstatedBy TEXT,
  evidence TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  ticket TEXT
);

CREATE TABLE IF NOT EXISTS "verification_documents" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  documentType TEXT,
  documentUrl TEXT,
  status TEXT DEFAULT "pending",
  reviewedBy TEXT,
  reviewedAt TEXT,
  metadata TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "viewing_windows" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  movieId TEXT,
  startsAt TIMESTAMPTZ,
  endsAt TEXT,
  type TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "wallet_snapshots" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT "NGN",
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "wallet_transaction_snapshots" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  walletId TEXT,
  type TEXT,
  amount NUMERIC,
  description TEXT,
  reference TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(
);

CREATE TABLE IF NOT EXISTS "watchlist_items" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId TEXT,
  movieId TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  movie TEXT
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT,
  payload JSONB,
  provider TEXT,
  processedAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "webhook_retries" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  eventId TEXT,
  provider TEXT,
  type TEXT,
  payload JSONB,
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 5,
  nextRetryAt TIMESTAMPTZ,
  status TEXT DEFAULT "pending",
  lastError TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "world_maps" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  imageUrl TEXT,
  universeId TEXT,
  type TEXT DEFAULT "geographic",
  data TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(,
  updatedAt TIMESTAMPTZ,
  universe TEXT
);


-- ============================================================================
-- PRISMA IMPLICIT MANY-TO-MANY JOIN TABLES
-- These are auto-generated by Prisma for implicit relations
-- ============================================================================

CREATE TABLE IF NOT EXISTS "_CategoryToContentItem" (
  "A" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_CategoryToContentItem_AB_unique" ON "_CategoryToContentItem"("A", "B");
CREATE INDEX IF NOT EXISTS "_CategoryToContentItem_B_index" ON "_CategoryToContentItem"("B");

CREATE TABLE IF NOT EXISTS "_ContentItemToTag" (
  "A" TEXT NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ContentItemToTag_AB_unique" ON "_ContentItemToTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_ContentItemToTag_B_index" ON "_ContentItemToTag"("B");

CREATE TABLE IF NOT EXISTS "_ChallengeToChallengeEntry" (
  "A" TEXT NOT NULL REFERENCES "challenges"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "challenge_entries"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ChallengeToChallengeEntry_AB_unique" ON "_ChallengeToChallengeEntry"("A", "B");
CREATE INDEX IF NOT EXISTS "_ChallengeToChallengeEntry_B_index" ON "_ChallengeToChallengeEntry"("B");

CREATE TABLE IF NOT EXISTS "_ChallengeToChallengePrize" (
  "A" TEXT NOT NULL REFERENCES "challenges"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "challenge_prizes"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ChallengeToChallengePrize_AB_unique" ON "_ChallengeToChallengePrize"("A", "B");
CREATE INDEX IF NOT EXISTS "_ChallengeToChallengePrize_B_index" ON "_ChallengeToChallengePrize"("B");
