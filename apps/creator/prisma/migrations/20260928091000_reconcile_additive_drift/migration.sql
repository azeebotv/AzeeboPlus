-- Reconcile the remaining ADDITIVE drift between schema.prisma and this
-- database (the wallet tables + content_items.viewCount are restored by the
-- 20260928090000 migration). The database's migration history diverged from
-- the repo's, so columns the current schema and creator.service.ts queries
-- expect are absent: Prisma P2022 ("column does not exist") surfaces as 500s
-- on dashboard/earnings/analytics.
--
-- Additive on purpose — column PRESENCE only. Constraint-only changes from
-- the same drift (SET NOT NULL on existing columns, DROP DEFAULT, dropped
-- legacy columns) do not affect Prisma queries and are deliberately not
-- applied here; a full reconcile is the owner's call, not a smoke fix.
--
-- IF NOT EXISTS keeps this a no-op on databases already matching the schema.

-- content_items: monetization/release metadata the schema declares (rows
-- exist, every added column is nullable or has a DEFAULT).
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "isExclusive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "isPremiere" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "releaseDate" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "streamingReleaseDate" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "theatricalReleaseDate" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'video';
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "windowEndDate" TIMESTAMP(3);
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "windowType" TEXT NOT NULL DEFAULT 'standard';

-- payout_requests: schema pivoted from creatorId to userId. The table is
-- empty on drifted databases (wallets retired earlier), so the NOT NULL add
-- cannot violate existing rows; on schema-matching databases this is a
-- no-op.
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payout_requests_userId_fkey'
    ) THEN
        ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- users: profile/auth columns the schema declares. `password` is NOT NULL in
-- the schema but the table already has rows: add nullable, backfill, then
-- enforce — no server default left behind, matching schema.prisma.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name = 'password'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "password" TEXT;
        UPDATE "users" SET "password" = '' WHERE "password" IS NULL;
        ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
    END IF;
END $$;
