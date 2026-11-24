-- Additive columns the admin panel owns. apps/admin federates azeebo_admin to
-- this database (postgres_fdw) and writes these fields through the foreign
-- `users` table; auth-service itself never reads them. Kept here so
-- `prisma migrate deploy` and the schema locks stay consistent.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
