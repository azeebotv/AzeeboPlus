-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "media_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "folder" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcoding_jobs" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "outputKeys" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcoding_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_uploads_userId_idx" ON "media_uploads"("userId");

-- CreateIndex
CREATE INDEX "media_uploads_status_idx" ON "media_uploads"("status");

-- CreateIndex
CREATE INDEX "media_uploads_createdAt_idx" ON "media_uploads"("createdAt");

-- CreateIndex
CREATE INDEX "transcoding_jobs_status_idx" ON "transcoding_jobs"("status");

-- CreateIndex
CREATE INDEX "transcoding_jobs_uploadId_idx" ON "transcoding_jobs"("uploadId");

