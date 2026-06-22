-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "banner" TEXT,
    "socialLinks" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_earnings" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_challenges" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" TEXT NOT NULL,
    "accountDetails" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tips" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadId" TEXT NOT NULL,
    "assetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");

-- CreateIndex
CREATE INDEX "creator_earnings_creatorId_idx" ON "creator_earnings"("creatorId");

-- CreateIndex
CREATE INDEX "creator_earnings_type_idx" ON "creator_earnings"("type");

-- CreateIndex
CREATE INDEX "creator_earnings_status_idx" ON "creator_earnings"("status");

-- CreateIndex
CREATE INDEX "channels_creatorId_idx" ON "channels"("creatorId");

-- CreateIndex
CREATE INDEX "creator_challenges_creatorId_idx" ON "creator_challenges"("creatorId");

-- CreateIndex
CREATE INDEX "creator_challenges_status_idx" ON "creator_challenges"("status");

-- CreateIndex
CREATE INDEX "challenge_entries_userId_idx" ON "challenge_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_entries_userId_challengeId_key" ON "challenge_entries"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "payout_requests_creatorId_idx" ON "payout_requests"("creatorId");

-- CreateIndex
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_creatorId_idx" ON "subscriptions"("creatorId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_creatorId_key" ON "subscriptions"("userId", "creatorId");

-- CreateIndex
CREATE INDEX "tips_fromUserId_idx" ON "tips"("fromUserId");

-- CreateIndex
CREATE INDEX "tips_toUserId_idx" ON "tips"("toUserId");

-- CreateIndex
CREATE INDEX "verification_documents_userId_idx" ON "verification_documents"("userId");

-- CreateIndex
CREATE INDEX "verification_documents_status_idx" ON "verification_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "media_uploads_uploadId_key" ON "media_uploads"("uploadId");

-- CreateIndex
CREATE INDEX "media_uploads_userId_idx" ON "media_uploads"("userId");

-- CreateIndex
CREATE INDEX "media_uploads_uploadId_idx" ON "media_uploads"("uploadId");

-- CreateIndex
CREATE INDEX "media_uploads_status_idx" ON "media_uploads"("status");

-- CreateIndex
CREATE INDEX "content_items_creatorId_idx" ON "content_items"("creatorId");

-- CreateIndex
CREATE INDEX "content_items_universeId_idx" ON "content_items"("universeId");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_challenges" ADD CONSTRAINT "creator_challenges_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "creator_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
