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

COMMIT;
