-- AlterTable: bring payment_intents in line with the Prisma schema, which
-- declares `version Int @default(0)` (optimistic-concurrency counter). The
-- column was added to schema.prisma without a migration, so fresh databases
-- (prisma migrate deploy) were missing it and paymentIntent.create() failed.
ALTER TABLE "payment_intents" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
