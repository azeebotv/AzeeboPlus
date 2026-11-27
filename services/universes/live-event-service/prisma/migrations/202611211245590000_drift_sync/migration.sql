-- CreateTable
CREATE TABLE "watch_party_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentId" TEXT,
    "hostUserId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "playbackTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "participants" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_party_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_party_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_party_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watch_party_rooms_code_key" ON "watch_party_rooms"("code");

-- CreateIndex
CREATE INDEX "watch_party_rooms_code_idx" ON "watch_party_rooms"("code");

-- CreateIndex
CREATE INDEX "watch_party_rooms_isActive_idx" ON "watch_party_rooms"("isActive");

-- CreateIndex
CREATE INDEX "watch_party_messages_roomId_idx" ON "watch_party_messages"("roomId");

-- CreateIndex
CREATE INDEX "watch_party_messages_createdAt_idx" ON "watch_party_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "watch_party_messages" ADD CONSTRAINT "watch_party_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "watch_party_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

