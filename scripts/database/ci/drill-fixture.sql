-- drill-fixture.sql — minimal per-service schemas for the federation drill in CI.
--
-- CI (federation-drill.yml) creates the seven azeebo_* service databases and
-- applies this file to each one; every object here lives in every service DB
-- (the drill and federate-admin-db.sh only touch the tables each DB actually
-- owns, and one extra empty table per DB is harmless).
--
-- Kept deliberately small: it exists to satisfy the drill's assertions —
--   users with the UserRole enum + seed rows (join + rowcount assertions),
--   wallets with a matching seed set (users ⋈ wallets cross-DB join),
--   content_items (spot-check assertion),
--   audit_logs in AZEEBO_AUTH'S OWN SHAPE (actor/result/... timestamp) —
--     scenario 1's A7 asserts admin sees the same count as the live DB, and
--     federate-admin-db.sh step 5b creates auth_audit_logs over it.
--   plus user_suspensions, since federate-admin-db.sh references it in its
--     closing echo (and it documents that admin-owned tables stay local).

-- ── shared enum ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('user','creator','admin','moderator','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── auth-service home tables ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                      text PRIMARY KEY,
  email                   text NOT NULL,
  password                text NOT NULL DEFAULT '',
  "displayName"           text NOT NULL,
  avatar                  text,
  role                    "UserRole" NOT NULL DEFAULT 'user'::"UserRole",
  "isVerified"            boolean NOT NULL DEFAULT false,
  "mfaEnabled"            boolean NOT NULL DEFAULT false,
  "mfaSecret"             text,
  "mfaBackupCodes"        text[],
  "createdAt"             timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             timestamp NOT NULL,
  preferences             jsonb
  -- NOTE: deliberately NO isSuspended/suspended* columns — the fixture is the
  -- Prisma baseline. federate-admin-db.sh step 2 must ADD them; the drill's
  -- scenario 2 asserts the repair. In CI scenario 2 drops them again (a no-op
  -- repair convergence proof is weaker than re-repairing a real drift, so the
  -- scenario-1 federate run repairs first, then scenario 2 re-drifts).
);
CREATE TABLE IF NOT EXISTS user_suspensions (
  id                 text PRIMARY KEY,
  "userId"           text NOT NULL,
  reason             text,
  "suspendedBy"      text,
  "suspendedAt"      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "suspendedUntil"   timestamp
);

-- auth-service's OWN audit trail (different schema from the admin AuditLog).
CREATE TABLE IF NOT EXISTS audit_logs (
  id             text PRIMARY KEY,
  actor          text,
  action         text NOT NULL,
  "resourceType" text,
  "resourceId"   text,
  result         text NOT NULL,
  error          text,
  "ipAddress"    text,
  "userAgent"    text,
  "timestamp"    timestamp NOT NULL,
  "createdAt"    timestamp NOT NULL,
  "updatedAt"    timestamp NOT NULL
);

-- ── wallet-service home tables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id             text PRIMARY KEY,
  "userId"       text NOT NULL,
  balance        numeric(14,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'NGN',
  "createdAt"    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id           text PRIMARY KEY,
  "walletId"   text NOT NULL,
  amount       numeric(14,2) NOT NULL DEFAULT 0,
  type         text NOT NULL DEFAULT 'credit',
  "createdAt"  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── content-service home tables ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  id             text PRIMARY KEY,
  title          text NOT NULL,
  "creatorId"    text,
  "viewCount"    bigint NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'published',
  "createdAt"    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Everything below is a stub so the seven-DB sanity pass and the SWAPS loop
-- can run against any service DB without missing-relation errors.
CREATE TABLE IF NOT EXISTS universes (
  id text PRIMARY KEY, name text NOT NULL DEFAULT '', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY, "userId" text NOT NULL DEFAULT '', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_intents (
  id text PRIMARY KEY, amount numeric(14,2) NOT NULL DEFAULT 0, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS moderation_cases (
  id text PRIMARY KEY, status text NOT NULL DEFAULT 'open', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS creator_profiles (
  id text PRIMARY KEY, "displayName" text NOT NULL DEFAULT '', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Remaining SWAPS tables (federate-admin-db.sh): IMPORT FOREIGN SCHEMA of a
-- table the source DB lacks creates a zero-column foreign table that only
-- fails later at query time, so every SWAPS relation needs a stub here.
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY, name text NOT NULL DEFAULT '', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tags (
  id text PRIMARY KEY, name text NOT NULL DEFAULT '', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS media_assets (
  id text PRIMARY KEY, url text, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS content_relationships (
  id text PRIMARY KEY, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS universe_feature_flags (
  id text PRIMARY KEY, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS _CategoryToContentItem (
  "A" text NOT NULL, "B" text NOT NULL, PRIMARY KEY ("A", "B")
);
CREATE TABLE IF NOT EXISTS _ContentItemToTag (
  "A" text NOT NULL, "B" text NOT NULL, PRIMARY KEY ("A", "B")
);
CREATE TABLE IF NOT EXISTS refunds (
  id text PRIMARY KEY, amount numeric(14,2) NOT NULL DEFAULT 0, "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY, status text NOT NULL DEFAULT 'open', "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── seed rows (only meaningful in azeebo_auth / azeebo_wallet, applied everywhere harmlessly) ──
INSERT INTO users (id, email, password, "displayName", role, "updatedAt") VALUES
  ('ci-user-1', 'ci-user-1@fixture.test', '', 'CI User 1', 'user'::"UserRole", now()),
  ('ci-user-2', 'ci-user-2@fixture.test', '', 'CI User 2', 'creator'::"UserRole", now()),
  ('ci-admin', 'ci-admin@fixture.test', '', 'CI Admin', 'admin'::"UserRole", now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallets (id, "userId", balance, "updatedAt") VALUES
  ('ci-wallet-1', 'ci-user-1', 1000.00, now()),
  ('ci-wallet-2', 'ci-user-2', 2500.50, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_items (id, title, "creatorId", "viewCount", "updatedAt") VALUES
  ('ci-content-1', 'Fixture Content 1', 'ci-user-2', 42, now()),
  ('ci-content-2', 'Fixture Content 2', 'ci-user-2', 7, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, actor, action, result, "timestamp", "createdAt", "updatedAt") VALUES
  ('ci-audit-1', 'ci-user-1', 'login.success', 'SUCCESS', now(), now(), now()),
  ('ci-audit-2', 'ci-user-2', 'login.success', 'SUCCESS', now(), now(), now())
ON CONFLICT (id) DO NOTHING;
