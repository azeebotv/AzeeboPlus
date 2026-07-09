-- AlterTable: Add missing device columns to sessions table
ALTER TABLE "sessions" ADD COLUMN "deviceName" TEXT,
    ADD COLUMN "deviceType" TEXT,
    ADD COLUMN "os" TEXT,
    ADD COLUMN "browser" TEXT,
    ADD COLUMN "ipAddress" TEXT,
    ADD COLUMN "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
