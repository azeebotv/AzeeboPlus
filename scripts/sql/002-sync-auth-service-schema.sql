-- ============================================================
-- 002: Sync auth-service schema to shared database
-- Adds missing columns to users table and creates sessions,
-- otps, social_accounts, and roles tables.
-- ============================================================

-- users: add missing auth columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT;

-- Ensure password column has a default (for users created before this column existed)
ALTER TABLE users ALTER COLUMN "password" SET DEFAULT '';

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "refreshToken" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "deviceName" TEXT,
  "deviceType" TEXT,
  os TEXT,
  browser TEXT,
  "ipAddress" TEXT,
  "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- OTPs table
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  provider TEXT NOT NULL,
  "socialId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("socialId", provider),
  UNIQUE ("userId", provider),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_refreshToken ON sessions("refreshToken");
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions("expiresAt");
CREATE INDEX IF NOT EXISTS idx_otps_expiresAt ON otps("expiresAt");
CREATE INDEX IF NOT EXISTS idx_social_accounts_userId ON social_accounts("userId");
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users("createdAt");

-- Table ownership
ALTER TABLE users OWNER TO azeebo;
ALTER TABLE sessions OWNER TO azeebo;
ALTER TABLE otps OWNER TO azeebo;
ALTER TABLE social_accounts OWNER TO azeebo;
ALTER TABLE roles OWNER TO azeebo;
