-- Migrations↔schema drift reconciliation (idempotent).
--
-- The replayed migration chain had users.role as TEXT; schema.prisma wants
-- the UserRole enum (with 'moderator' — runtime @Roles('moderator') guards
-- depend on it). On live databases the enum conversion was already applied
-- by hand (20260908140000 applied on a DB whose role column predates this
-- chain), so the guarded branch below is a no-op there; on a fresh replay
-- from empty it converts TEXT -> UserRole.
-- Also normalizes two serial id defaults the datamodel doesn't declare.

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('user', 'creator', 'moderator', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "role_permissions" ALTER COLUMN "id" DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'text'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
    ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
