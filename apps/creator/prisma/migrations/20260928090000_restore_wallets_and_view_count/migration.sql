-- Restore the wallet tables + content viewCount that the drift between the
-- repo's migration history and this database erased. The repo history splits
-- at a wallet-retirement migration this database still has recorded
-- (20260908120000_wallet_retirement_and_fk_anchors) while the schema and init
-- migration still define wallets, so wallet queries from creator.service.ts
-- fail with P2021/P2022 and surface as 500s on the creator backend.
--
-- Idempotent on purpose: databases whose history already created these
-- objects (or an operator applying this by hand) must get a no-op, not an
-- error. DDL written to match what `prisma migrate diff` generates from
-- schema.prisma (DECIMAL(18,2), JSONB, camelCase columns).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'wallets'
    ) THEN
        CREATE TABLE "wallets" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
            "bonusBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
            "promoBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
            "currency" TEXT NOT NULL DEFAULT 'NGN',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
        );
        ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'wallet_transactions'
    ) THEN
        CREATE TABLE "wallet_transactions" (
            "id" TEXT NOT NULL,
            "walletId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "amount" DECIMAL(18,2) NOT NULL,
            "status" TEXT NOT NULL,
            "description" TEXT,
            "reference" TEXT,
            "metadata" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
        );
        ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey"
            FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes: match schema.prisma (@@index([walletId]), @unique userId). IF NOT
-- EXISTS keeps this a no-op when the tables already existed.
CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");
CREATE UNIQUE INDEX IF NOT EXISTS "wallets_userId_key" ON "wallets"("userId");

-- content_items.viewCount: schema declares it, this database lost it in the
-- same drift.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'content_items'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'content_items'
          AND column_name = 'viewCount'
    ) THEN
        ALTER TABLE "content_items" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;
