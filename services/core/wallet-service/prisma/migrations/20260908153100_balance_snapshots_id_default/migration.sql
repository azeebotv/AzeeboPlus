-- Migrations↔schema drift reconciliation (idempotent).
--
-- balance_snapshots was created by a hand-rolled init with a serial default;
-- schema.prisma declares a plain TEXT id with client-side generation.

ALTER TABLE "balance_snapshots" ALTER COLUMN "id" DROP DEFAULT;
