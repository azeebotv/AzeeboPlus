-- AlterTable: Add missing "preferences" column to "users" table
ALTER TABLE "users" ADD COLUMN "preferences" JSONB;
