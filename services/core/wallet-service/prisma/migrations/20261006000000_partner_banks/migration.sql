-- Approved lending partners for the public Borrow page (see schema.prisma).
-- Amounts and rates are Decimal so the disclosures rendered from these
-- columns cannot drift from what admin entered.
CREATE TABLE "partner_banks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productName" TEXT,
    "logoUrl" TEXT,
    "licenceRef" TEXT,
    "registrationNumber" TEXT,
    "minAmount" DECIMAL(18,2) NOT NULL,
    "maxAmount" DECIMAL(18,2) NOT NULL,
    "minTenorMonths" INTEGER NOT NULL,
    "maxTenorMonths" INTEGER NOT NULL,
    "interestRateMin" DECIMAL(6,3) NOT NULL,
    "interestRateMax" DECIMAL(6,3) NOT NULL,
    "feeDisclosure" TEXT,
    "totalCostExample" TEXT,
    "eligibility" TEXT,
    "applyUrl" TEXT NOT NULL,
    "termsUrl" TEXT,
    "privacyUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE UNIQUE INDEX "partner_banks_slug_key" ON "partner_banks"("slug");

CREATE INDEX "partner_banks_isActive_displayOrder_idx" ON "partner_banks"("isActive", "displayOrder");
