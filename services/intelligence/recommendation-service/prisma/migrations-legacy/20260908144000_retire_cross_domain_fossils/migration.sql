-- Recommendation-service schema sync
--
-- Retires 25 legacy tables cloned from an old all-in-one template (domains
-- of other services: badges, wallets, missions, refunds, moderation, ...).
-- All 30 public tables verified 0 rows before writing this migration; the
-- archive step is belt-and-braces so nothing is ever dropped unrecoverable.
-- Also adds the service's real segment tables and normalizes FKs/defaults.

-- Archive namespace (idempotent)
CREATE SCHEMA IF NOT EXISTS archive;

-- Drop fossil FKs first (constraints live on the dropped tables' sides)
ALTER TABLE "_BadgeToRewardAccount" DROP CONSTRAINT IF EXISTS "_BadgeToRewardAccount_A_fkey";
ALTER TABLE "_BadgeToRewardAccount" DROP CONSTRAINT IF EXISTS "_BadgeToRewardAccount_B_fkey";
ALTER TABLE "_CategoryToContentItem" DROP CONSTRAINT IF EXISTS "_CategoryToContentItem_A_fkey";
ALTER TABLE "_CategoryToContentItem" DROP CONSTRAINT IF EXISTS "_CategoryToContentItem_B_fkey";
ALTER TABLE "_ContentItemToTag" DROP CONSTRAINT IF EXISTS "_ContentItemToTag_A_fkey";
ALTER TABLE "_ContentItemToTag" DROP CONSTRAINT IF EXISTS "_ContentItemToTag_B_fkey";
ALTER TABLE "appeals" DROP CONSTRAINT IF EXISTS "appeals_caseId_fkey";
ALTER TABLE "appeals" DROP CONSTRAINT IF EXISTS "appeals_userId_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_creatorId_fkey";
ALTER TABLE "content_items" DROP CONSTRAINT IF EXISTS "content_items_universeId_fkey";
ALTER TABLE "creator_profiles" DROP CONSTRAINT IF EXISTS "creator_profiles_userId_fkey";
ALTER TABLE "media_assets" DROP CONSTRAINT IF EXISTS "media_assets_contentItemId_fkey";
ALTER TABLE "mission_completions" DROP CONSTRAINT IF EXISTS "mission_completions_missionId_fkey";
ALTER TABLE "mission_completions" DROP CONSTRAINT IF EXISTS "mission_completions_userId_fkey";
ALTER TABLE "mission_rewards" DROP CONSTRAINT IF EXISTS "mission_rewards_missionId_fkey";
ALTER TABLE "mission_rewards" DROP CONSTRAINT IF EXISTS "mission_rewards_rewardId_fkey";
ALTER TABLE "moderation_cases" DROP CONSTRAINT IF EXISTS "moderation_cases_reportId_fkey";
ALTER TABLE "moderation_cases" DROP CONSTRAINT IF EXISTS "moderation_cases_resolvedBy_fkey";
ALTER TABLE "moderation_cases" DROP CONSTRAINT IF EXISTS "moderation_cases_userId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "payment_intents" DROP CONSTRAINT IF EXISTS "payment_intents_userId_fkey";
ALTER TABLE "points_ledger" DROP CONSTRAINT IF EXISTS "points_ledger_userId_fkey";
ALTER TABLE "product_events" DROP CONSTRAINT IF EXISTS "product_events_userId_fkey";
ALTER TABLE "recommendation_logs" DROP CONSTRAINT IF EXISTS "recommendation_logs_userId_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_paymentIntentId_fkey";
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_contentId_fkey";
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_reportingUserId_fkey";
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_userId_fkey";
ALTER TABLE "reward_accounts" DROP CONSTRAINT IF EXISTS "reward_accounts_levelId_fkey";
ALTER TABLE "reward_accounts" DROP CONSTRAINT IF EXISTS "reward_accounts_userId_fkey";
ALTER TABLE "reward_redemptions" DROP CONSTRAINT IF EXISTS "reward_redemptions_rewardAccountId_fkey";
ALTER TABLE "reward_redemptions" DROP CONSTRAINT IF EXISTS "reward_redemptions_rewardId_fkey";
ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "rewards_levelId_fkey";
ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "saved_items_contentItemId_fkey";
ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "saved_items_userId_fkey";
ALTER TABLE "search_query_logs" DROP CONSTRAINT IF EXISTS "search_query_logs_userId_fkey";
ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_categoryId_fkey";
ALTER TABLE "user_searches" DROP CONSTRAINT IF EXISTS "user_searches_userId_fkey";
ALTER TABLE "user_searches" DROP CONSTRAINT IF EXISTS "user_searches_queryId_fkey";
ALTER TABLE "wallet_transactions" DROP CONSTRAINT IF EXISTS "wallet_transactions_walletId_fkey";
ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_userId_fkey";
ALTER TABLE "watch_history" DROP CONSTRAINT IF EXISTS "watch_history_contentItemId_fkey";
ALTER TABLE "watch_history" DROP CONSTRAINT IF EXISTS "watch_history_userId_fkey";

-- Archive then drop (all tables verified empty; archive is the safety net)
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['_BadgeToRewardAccount', '_CategoryToContentItem', '_ContentItemToTag', 'appeals', 'badges', 'categories', 'levels', 'media_assets', 'mission_completions', 'mission_rewards', 'missions', 'moderation_cases', 'notifications', 'refunds', 'reports', 'reward_accounts', 'reward_redemptions', 'rewards', 'saved_items', 'search_query_logs', 'tags', 'user_searches', 'wallet_transactions', 'wallets', 'watch_history']
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS archive.%I AS SELECT * FROM public.%I WITH NO DATA', t, t);
        EXECUTE format('INSERT INTO archive.%I SELECT * FROM public.%I', t, t);
    END LOOP;
END $$;

DROP TABLE "_BadgeToRewardAccount";
DROP TABLE "_CategoryToContentItem";
DROP TABLE "_ContentItemToTag";
DROP TABLE "appeals";
DROP TABLE "badges";
DROP TABLE "categories";
DROP TABLE "levels";
DROP TABLE "media_assets";
DROP TABLE "mission_completions";
DROP TABLE "mission_rewards";
DROP TABLE "missions";
DROP TABLE "moderation_cases";
DROP TABLE "notifications";
DROP TABLE "refunds";
DROP TABLE "reports";
DROP TABLE "reward_accounts";
DROP TABLE "reward_redemptions";
DROP TABLE "rewards";
DROP TABLE "saved_items";
DROP TABLE "search_query_logs";
DROP TABLE "tags";
DROP TABLE "user_searches";
DROP TABLE "wallet_transactions";
DROP TABLE "wallets";
DROP TABLE "watch_history";

-- Additive: segment tables
CREATE TABLE "audience_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_segments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_segments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_segments_userId_idx" ON "user_segments"("userId");
CREATE INDEX "user_segments_segmentId_idx" ON "user_segments"("segmentId");

ALTER TABLE "user_segments" ADD CONSTRAINT "user_segments_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "audience_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Normalization to match schema exactly
ALTER TABLE "universes" ADD COLUMN "isEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "universes" ALTER COLUMN "isEnabled" DROP DEFAULT;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
