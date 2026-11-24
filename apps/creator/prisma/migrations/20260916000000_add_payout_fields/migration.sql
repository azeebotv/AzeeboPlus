-- Payout fields on CreatorProfile: converges DB lineages created before
-- these columns existed. Idempotent so it is a no-op where already applied.
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "payoutMethod" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "minimumPayout" DECIMAL(18,2);
