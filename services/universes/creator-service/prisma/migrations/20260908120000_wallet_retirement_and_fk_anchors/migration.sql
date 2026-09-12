-- ============================================================================
-- Creator-service schema sync: wallet retirement + FK anchors + precision fix
--
-- Destructive (reviewed 2026-09-08):
--   * DROP "wallet_transactions" and "wallets" — legacy local wallet tables,
--     superseded by wallet-service as system of record. Both tables were
--     EMPTY (0 rows) at migration time and referenced by no FKs; contents
--     are archived first for auditability.
--
-- Additive:
--   * CREATE "universes", "users" — denormalized FK anchors (mirrors
--     tipping_schema_sync precedent)
--   * CREATE "wallet_snapshots", "wallet_transaction_snapshots" —
--     write-only mirror of wallet-service state (read model)
--   * updatedAt on challenge_entries / notifications (both empty)
--   * FKs from existing tables to the new anchor tables (all empty)
--
-- Precision (reviewed):
--   * DECIMAL(65,30) -> DECIMAL(18,2) on creator_earnings / payout_requests /
--     tips.amount. Explicit USING round(..., 2). Tables empty at migration
--     time; round() keeps the migration safe if replayed with data that
--     fits, and values that would overflow DECIMAL(18,2) fail loudly.
-- ============================================================================

-- ── 1. Archive legacy wallet data (audit trail, outside Prisma schema) ────
CREATE SCHEMA IF NOT EXISTS "archive";
CREATE TABLE IF NOT EXISTS "archive"."wallets_backup_20260908" (LIKE "wallets" INCLUDING ALL);
CREATE TABLE IF NOT EXISTS "archive"."wallet_transactions_backup_20260908" (LIKE "wallet_transactions" INCLUDING ALL);
INSERT INTO "archive"."wallets_backup_20260908" SELECT * FROM "wallets";
INSERT INTO "archive"."wallet_transactions_backup_20260908" SELECT * FROM "wallet_transactions";

-- ── 2. Drop legacy local wallet tables ─────────────────────────────────────
DROP TABLE "wallet_transactions";
DROP TABLE "wallets";

-- ── 3. Alter existing tables ───────────────────────────────────────────────
ALTER TABLE "challenge_entries" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "notifications" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;

ALTER TABLE "creator_earnings" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2) USING round("amount", 2);
ALTER TABLE "payout_requests" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2) USING round("amount", 2);
ALTER TABLE "tips" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2) USING round("amount", 2),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ── 4. Create new tables (anchors + snapshot read model) ───────────────────
CREATE TABLE "universes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transaction_snapshots" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transaction_snapshots_pkey" PRIMARY KEY ("id")
);

-- ── 5. Indexes ──────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "universes_name_key" ON "universes"("name");
CREATE INDEX "universes_name_idx" ON "universes"("name");
CREATE INDEX "universes_isEnabled_idx" ON "universes"("isEnabled");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "wallet_snapshots_userId_key" ON "wallet_snapshots"("userId");
CREATE INDEX "wallet_snapshots_userId_idx" ON "wallet_snapshots"("userId");
CREATE INDEX "wallet_transaction_snapshots_walletId_idx" ON "wallet_transaction_snapshots"("walletId");
CREATE INDEX "wallet_transaction_snapshots_type_idx" ON "wallet_transaction_snapshots"("type");

-- ── 6. Foreign keys to the new anchor tables ───────────────────────────────
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tips" ADD CONSTRAINT "tips_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tips" ADD CONSTRAINT "tips_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "media_uploads" ADD CONSTRAINT "media_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "content_items" ADD CONSTRAINT "content_items_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "universes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_transaction_snapshots" ADD CONSTRAINT "wallet_transaction_snapshots_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
