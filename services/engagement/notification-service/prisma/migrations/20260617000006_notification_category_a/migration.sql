-- CreateTable: NotificationTemplate
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_templates_key_key" ON "notification_templates"("key");
CREATE INDEX "notification_templates_key_idx" ON "notification_templates"("key");
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateTable: DeliveryAttempt
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "providerResponse" JSONB,
    "error" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "delivery_attempts_notificationId_idx" ON "delivery_attempts"("notificationId");
CREATE INDEX "delivery_attempts_channel_idx" ON "delivery_attempts"("channel");
CREATE INDEX "delivery_attempts_status_idx" ON "delivery_attempts"("status");
CREATE INDEX "delivery_attempts_attemptedAt_idx" ON "delivery_attempts"("attemptedAt");
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: NotificationPreference
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT,
    "categoryOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Campaign
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "audience" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "campaigns_templateKey_idx" ON "campaigns"("templateKey");
CREATE INDEX "campaigns_channel_idx" ON "campaigns"("channel");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateTable: CampaignTrigger
CREATE TABLE "campaign_triggers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_triggers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "campaign_triggers_campaignId_idx" ON "campaign_triggers"("campaignId");
CREATE INDEX "campaign_triggers_userId_idx" ON "campaign_triggers"("userId");
CREATE INDEX "campaign_triggers_status_idx" ON "campaign_triggers"("status");
ALTER TABLE "campaign_triggers" ADD CONSTRAINT "campaign_triggers_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_triggers" ADD CONSTRAINT "campaign_triggers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
