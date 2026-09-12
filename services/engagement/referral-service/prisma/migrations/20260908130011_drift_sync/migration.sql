-- Referral-service drift sync — REVIEWED
--
-- Adds the missing referrals indexes and the referral_rewards→referrals FK
-- (onDelete: Cascade per schema).
--
-- Verification (2026-09-10, dev DB):
--   0 orphaned referral_rewards rows -> FK add cannot fail; replay
--   matches schema.prisma.

-- CreateIndex
CREATE INDEX "referrals_referralCodeId_idx" ON "referrals"("referralCodeId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_createdAt_idx" ON "referrals"("referrerId", "createdAt");

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

