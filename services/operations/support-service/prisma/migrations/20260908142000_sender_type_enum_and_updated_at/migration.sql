-- Support-service schema sync (data-preserving)
--
-- 1. updatedAt adds: backfilled via temporary DEFAULT because
--    support_messages holds 3 rows (analytics events table is empty,
--    same form for consistency). DEFAULT dropped afterwards to match schema.
-- 2. senderType: old TEXT column ('user'|'admin') converted to the
--    SenderType enum. Mapping matches the service's own controller logic:
--    user -> USER, admin -> AGENT. Any unmapped value becomes NULL and the
--    SET NOT NULL fails loudly rather than silently discarding data.

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- AlterTable: updatedAt (non-empty tables need a backfill default)
ALTER TABLE "support_analytics_events" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "support_analytics_events" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "support_messages" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "support_messages" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- senderType: TEXT -> enum with value mapping
ALTER TABLE "support_messages" ADD COLUMN "senderType_new" "SenderType";
UPDATE "support_messages" SET "senderType_new" = CASE "senderType"
    WHEN 'user' THEN 'USER'::"SenderType"
    WHEN 'admin' THEN 'AGENT'::"SenderType"
END;
ALTER TABLE "support_messages" DROP COLUMN "senderType";
ALTER TABLE "support_messages" RENAME COLUMN "senderType_new" TO "senderType";
ALTER TABLE "support_messages" ALTER COLUMN "senderType" SET NOT NULL;

-- CreateIndex
CREATE INDEX "support_messages_senderId_idx" ON "support_messages"("senderId");
