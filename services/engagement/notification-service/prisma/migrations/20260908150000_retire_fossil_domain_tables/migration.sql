-- Notification-service schema sync
--
-- Retires 7 legacy tables cloned from an old all-in-one template (domains of
-- other services: users, wallets, payments, saved items, watch history).
-- Data check before writing: only `users` held rows (6 fossil users, likely
-- early dev data); everything else 0 rows. All 7 are archived before the
-- drop. The service's own tables keep working — their FKs into fossil
-- `users` are dropped (the schema never declared them).

-- Archive namespace (idempotent)
CREATE SCHEMA IF NOT EXISTS archive;

-- Drop FKs pointing into fossil tables
ALTER TABLE "campaign_triggers" DROP CONSTRAINT "campaign_triggers_userId_fkey";

-- DropForeignKey
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment_intents" DROP CONSTRAINT "payment_intents_userId_fkey";

-- DropForeignKey
ALTER TABLE "push_tokens" DROP CONSTRAINT "push_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_paymentIntentId_fkey";

-- DropForeignKey
ALTER TABLE "saved_items" DROP CONSTRAINT "saved_items_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_walletId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- DropForeignKey
ALTER TABLE "watch_history" DROP CONSTRAINT "watch_history_userId_fkey";

-- AlterTable (both target tables verified 0 rows)
ALTER TABLE "campaign_triggers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable (0 rows verified)
ALTER TABLE "delivery_attempts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_templates" ALTER COLUMN "id" DROP DEFAULT;

-- Archive then drop the fossil domain tables (users held 6 rows, archived)
CREATE TABLE IF NOT EXISTS archive.users_20260908 AS SELECT * FROM "users";
CREATE TABLE IF NOT EXISTS archive.payment_intents_20260908 AS SELECT * FROM "payment_intents" WITH NO DATA;
CREATE TABLE IF NOT EXISTS archive.refunds_20260908 AS SELECT * FROM "refunds" WITH NO DATA;
CREATE TABLE IF NOT EXISTS archive.saved_items_20260908 AS SELECT * FROM "saved_items" WITH NO DATA;
CREATE TABLE IF NOT EXISTS archive.wallets_20260908 AS SELECT * FROM "wallets" WITH NO DATA;
CREATE TABLE IF NOT EXISTS archive.wallet_transactions_20260908 AS SELECT * FROM "wallet_transactions" WITH NO DATA;
CREATE TABLE IF NOT EXISTS archive.watch_history_20260908 AS SELECT * FROM "watch_history" WITH NO DATA;

DROP TABLE "payment_intents";
DROP TABLE "refunds";
DROP TABLE "saved_items";
DROP TABLE "users";
DROP TABLE "wallet_transactions";
DROP TABLE "wallets";
DROP TABLE "watch_history";

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");
