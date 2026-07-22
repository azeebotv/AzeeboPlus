-- CreateTable
CREATE TABLE "public"."reality_show_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reality_show_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reality_show_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reality_show_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reality_show_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reality_show_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reality_show_likes_userId_showId_key" ON "public"."reality_show_likes"("userId", "showId");

-- CreateIndex
CREATE INDEX "reality_show_likes_userId_idx" ON "public"."reality_show_likes"("userId");

-- CreateIndex
CREATE INDEX "reality_show_likes_showId_idx" ON "public"."reality_show_likes"("showId");

-- CreateIndex
CREATE INDEX "reality_show_comments_userId_idx" ON "public"."reality_show_comments"("userId");

-- CreateIndex
CREATE INDEX "reality_show_comments_showId_idx" ON "public"."reality_show_comments"("showId");

-- CreateIndex
CREATE INDEX "reality_show_comments_createdAt_idx" ON "public"."reality_show_comments"("createdAt");

-- CreateIndex
CREATE INDEX "reality_show_shares_userId_idx" ON "public"."reality_show_shares"("userId");

-- CreateIndex
CREATE INDEX "reality_show_shares_showId_idx" ON "public"."reality_show_shares"("showId");

-- AddForeignKey
ALTER TABLE "public"."reality_show_likes" ADD CONSTRAINT "reality_show_likes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "public"."reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reality_show_comments" ADD CONSTRAINT "reality_show_comments_showId_fkey" FOREIGN KEY ("showId") REFERENCES "public"."reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reality_show_shares" ADD CONSTRAINT "reality_show_shares_showId_fkey" FOREIGN KEY ("showId") REFERENCES "public"."reality_shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
