-- EnumType
CREATE TYPE "LinkStatus" AS ENUM ('pending', 'confirmed', 'denied', 'expired');

-- CreateTable
CREATE TABLE "device_link_codes" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'pending',
    "userId" TEXT,
    "deviceName" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'tv',
    "intervalSec" INTEGER NOT NULL DEFAULT 5,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "tokenIssued" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastPolledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_link_codes_deviceCode_key" ON "device_link_codes"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "device_link_codes_code_key" ON "device_link_codes"("code");

-- CreateIndex
CREATE INDEX "device_link_codes_status_expiresAt_idx" ON "device_link_codes"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "device_link_codes_userId_idx" ON "device_link_codes"("userId");

-- AddForeignKey
ALTER TABLE "device_link_codes" ADD CONSTRAINT "device_link_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
