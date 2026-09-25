-- Migrations↔schema drift reconciliation (idempotent).
--
-- Two gaps in the replayed chain: creator_profiles.settings (added to the
-- schema, never migrated) and the users.updatedAt serial default the
-- datamodel doesn't declare.

ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "settings" JSONB;

ALTER TABLE "users" ALTER COLUMN "updatedAt" DROP DEFAULT;
