-- CreateTable: PaymentMethod
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerToken" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");

-- CreateIndex
CREATE INDEX "payment_methods_provider_idx" ON "payment_methods"("provider");

-- CreateIndex
CREATE INDEX "payment_methods_isDefault_idx" ON "payment_methods"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_userId_provider_providerToken_key" ON "payment_methods"("userId", "provider", "providerToken");
