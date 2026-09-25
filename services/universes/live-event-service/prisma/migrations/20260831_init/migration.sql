-- CreateTable
CREATE TABLE "live_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "ticketPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "maxViewers" INTEGER,
    "currentViewers" INTEGER NOT NULL DEFAULT 0,
    "streamUrl" TEXT,
    "replayUrl" TEXT,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_event_tickets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'purchased',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "live_event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_events_status_idx" ON "live_events"("status");

-- CreateIndex
CREATE INDEX "live_events_scheduledAt_idx" ON "live_events"("scheduledAt");

-- CreateIndex
CREATE INDEX "live_events_organizerId_idx" ON "live_events"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "live_event_tickets_eventId_userId_key" ON "live_event_tickets"("eventId", "userId");

-- CreateIndex
CREATE INDEX "live_event_tickets_eventId_idx" ON "live_event_tickets"("eventId");

-- CreateIndex
CREATE INDEX "live_event_tickets_userId_idx" ON "live_event_tickets"("userId");

-- CreateIndex
CREATE INDEX "live_event_tickets_status_idx" ON "live_event_tickets"("status");

-- AddForeignKey
ALTER TABLE "live_event_tickets" ADD CONSTRAINT "live_event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "live_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
