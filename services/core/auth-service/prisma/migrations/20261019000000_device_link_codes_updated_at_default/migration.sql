-- Align the column with schema.prisma: @updatedAt is managed by the Prisma
-- client, so the DDL must not carry a database-side default.
ALTER TABLE "device_link_codes" ALTER COLUMN "updatedAt" DROP DEFAULT;
