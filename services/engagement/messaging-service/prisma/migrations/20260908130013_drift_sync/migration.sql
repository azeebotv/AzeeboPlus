-- Messaging-service drift sync — REVIEWED
--
-- Adds conversation/message soft-state flags (all defaulted), message
-- threading + reactions, and the watch-party family (watch_parties,
-- party_participants, party_chat) with FKs scoped inside the service.
--
-- Verification (2026-09-10, dev DB):
--   all statements additive; self-referencing messages_replyToId_fkey and
--   party FKs are intra-service; replay matches schema.prisma.

-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMuted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "replyToId" TEXT;

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_parties" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "currentTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isSyncing" BOOLEAN NOT NULL DEFAULT false,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_participants" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_chat" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE INDEX "message_reactions_userId_idx" ON "message_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "watch_parties_inviteCode_key" ON "watch_parties"("inviteCode");

-- CreateIndex
CREATE INDEX "watch_parties_hostId_idx" ON "watch_parties"("hostId");

-- CreateIndex
CREATE INDEX "watch_parties_inviteCode_idx" ON "watch_parties"("inviteCode");

-- CreateIndex
CREATE INDEX "watch_parties_status_idx" ON "watch_parties"("status");

-- CreateIndex
CREATE INDEX "watch_parties_contentId_idx" ON "watch_parties"("contentId");

-- CreateIndex
CREATE INDEX "party_participants_partyId_idx" ON "party_participants"("partyId");

-- CreateIndex
CREATE INDEX "party_participants_userId_idx" ON "party_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "party_participants_partyId_userId_key" ON "party_participants"("partyId", "userId");

-- CreateIndex
CREATE INDEX "party_chat_partyId_idx" ON "party_chat"("partyId");

-- CreateIndex
CREATE INDEX "party_chat_createdAt_idx" ON "party_chat"("createdAt");

-- CreateIndex
CREATE INDEX "conversations_isArchived_idx" ON "conversations"("isArchived");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_replyToId_idx" ON "messages"("replyToId");

-- CreateIndex
CREATE INDEX "messages_isPinned_idx" ON "messages"("isPinned");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_participants" ADD CONSTRAINT "party_participants_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_chat" ADD CONSTRAINT "party_chat_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

