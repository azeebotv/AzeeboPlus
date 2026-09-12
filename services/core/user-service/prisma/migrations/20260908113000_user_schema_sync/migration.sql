-- ============================================================================
-- User-service schema sync (safe, reviewed)
--
-- Reviewed against live data on 2026-09-08 (18 users):
--   * users.password          — 18/18 rows populated (legacy hashes; auth is
--                               owned by auth-service, schema dropped the field)
--   * users.preferences       — 18/18 rows populated (superseded by the
--                               user_preferences table + featurePreferences)
--   * users.isVerified        — 13/18 true (no replacement field in schema;
--                               verification now lives with auth-service)
--   * users.mfaEnabled/Secret/BackupCodes — 0 rows populated (unused)
--   * audit_logs / following / saved_items / watch_history — 0 rows each, so
--     ADD COLUMN ... NOT NULL is safe without a backfill default
--   * No indexes depend on the dropped columns; no user-service code
--     references them (grep-verified).
--
-- Order of operations:
--   1. Archive the doomed columns into the dedicated `archive` schema
--      (outside `public`, so Prisma introspection/diff stays clean).
--   2. Additive DDL: updatedAt columns + new tables + indexes.
--   3. Backfill user_profiles from users (displayName/avatar continuity).
--   4. Drop the deprecated users columns (exact DDL from prisma migrate diff).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Archive legacy columns (preserves password hashes, preferences JSON,
--    and verification flags for recovery/audit without polluting `public`)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS archive;

CREATE TABLE IF NOT EXISTS archive.users_legacy_auth_20260908 (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "mfaEnabled" BOOLEAN,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT,
    "isVerified" BOOLEAN,
    "preferences" JSONB,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO archive.users_legacy_auth_20260908 (
    "id", "userId", "email", "password",
    "mfaEnabled", "mfaSecret", "mfaBackupCodes",
    "isVerified", "preferences"
)
SELECT
    gen_random_uuid()::text,
    u."id",
    u."email",
    u."password",
    u."mfaEnabled",
    u."mfaSecret",
    u."mfaBackupCodes",
    u."isVerified",
    u."preferences"
FROM "users" u;

-- ---------------------------------------------------------------------------
-- 2. Additive DDL (matches `prisma migrate diff` exactly)
-- ---------------------------------------------------------------------------
ALTER TABLE "audit_logs" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "following" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "saved_items" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "watch_history" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;

CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE INDEX "user_profiles_userId_idx" ON "user_profiles"("userId");
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");
CREATE INDEX "data_deletion_requests_userId_idx" ON "data_deletion_requests"("userId");
CREATE INDEX "data_deletion_requests_status_idx" ON "data_deletion_requests"("status");
CREATE INDEX "data_deletion_requests_scheduledAt_idx" ON "data_deletion_requests"("scheduledAt");

-- ---------------------------------------------------------------------------
-- 3. Backfill user_profiles from users (displayName/avatar continuity).
--    user_roles is deliberately NOT backfilled: users.role remains the
--    source of truth in the schema; duplicating it here would invite drift.
-- ---------------------------------------------------------------------------
INSERT INTO "user_profiles" ("id", "userId", "displayName", "avatar", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."displayName",
    u."avatar",
    CURRENT_TIMESTAMP
FROM "users" u
ON CONFLICT ("userId") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Drop deprecated columns (exact DDL from prisma migrate diff)
-- ---------------------------------------------------------------------------
ALTER TABLE "users" DROP COLUMN "isVerified",
DROP COLUMN "mfaBackupCodes",
DROP COLUMN "mfaEnabled",
DROP COLUMN "mfaSecret",
DROP COLUMN "password",
DROP COLUMN "preferences";
