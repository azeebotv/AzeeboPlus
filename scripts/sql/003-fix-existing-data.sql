-- ============================================================
-- 003: Fix existing data in shared database
-- Addresses NULL values in columns added after initial data.
-- ============================================================

-- Fix users with NULL passwords (created before password column existed)
UPDATE users SET "password" = '' WHERE "password" IS NULL;

-- Ensure password column has a default going forward
ALTER TABLE users ALTER COLUMN "password" SET DEFAULT '';

-- Fix any users with NULL displayName (shouldn't happen but safety net)
UPDATE users SET "displayName" = 'User' WHERE "displayName" IS NULL;
