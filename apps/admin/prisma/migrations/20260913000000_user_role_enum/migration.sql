-- UserRole enum: azeebo_admin.users.role is federated from azeebo_auth.users
-- (postgres_fdw), where role is the UserRole enum. Mirror-mode databases need
-- the same type locally so Prisma result mapping matches either mode.
--
-- In federated mode `users` is a foreign table (relkind 'f') and UserRole
-- already exists locally — created by scripts/database/federate-admin-db.sh —
-- so the ALTER is skipped to avoid touching the remote-owned table.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('user', 'creator', 'moderator', 'admin', 'super_admin');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'users' AND n.nspname = 'public' AND c.relkind IN ('r', 'p')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role' AND data_type = 'text'
    ) THEN
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"UserRole";
    END IF;
  END IF;
END
$$;
