-- CreateTable: TranscodingJob
CREATE TABLE "transcoding_jobs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "mediaAssetId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "outputUrl" TEXT,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "profiles" JSONB NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcoding_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transcoding_jobs_userId_idx" ON "transcoding_jobs"("userId");
CREATE INDEX "transcoding_jobs_status_idx" ON "transcoding_jobs"("status");
CREATE INDEX "transcoding_jobs_mediaAssetId_idx" ON "transcoding_jobs"("mediaAssetId");
CREATE INDEX "transcoding_jobs_createdAt_idx" ON "transcoding_jobs"("createdAt");

-- CreateTable: UploadSession
CREATE TABLE "upload_sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parts" JSONB,
    "totalParts" INTEGER NOT NULL DEFAULT 1,
    "completedParts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "upload_sessions_uploadId_key" ON "upload_sessions"("uploadId");
CREATE INDEX "upload_sessions_userId_idx" ON "upload_sessions"("userId");
CREATE INDEX "upload_sessions_status_idx" ON "upload_sessions"("status");
CREATE INDEX "upload_sessions_expiresAt_idx" ON "upload_sessions"("expiresAt");
