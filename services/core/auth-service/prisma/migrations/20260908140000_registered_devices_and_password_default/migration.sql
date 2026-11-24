-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" SET DEFAULT '';

-- CreateTable
CREATE TABLE "registered_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "os" TEXT,
    "browser" TEXT,
    "fingerprint" TEXT,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "registered_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registered_devices_userId_idx" ON "registered_devices"("userId");

-- CreateIndex
CREATE INDEX "registered_devices_userId_isTrusted_idx" ON "registered_devices"("userId", "isTrusted");

-- AddForeignKey
ALTER TABLE "registered_devices" ADD CONSTRAINT "registered_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

