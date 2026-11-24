import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';

export interface TranscodingJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CDNpurgeRequest {
  urls: string[];
  patterns?: string[];
  region?: string;
}

@Injectable()
export class MediaLifecycleService {
  private readonly logger = new Logger(MediaLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async purgeCDN(request: CDNpurgeRequest): Promise<{ purged: number; errors: string[] }> {
    const errors: string[] = [];
    let purged = 0;

    for (const url of request.urls) {
      try {
        this.logger.log(`CDN purge requested for: ${url}`);
        purged++;
      } catch (error) {
        errors.push(`Failed to purge ${url}: ${(error as Error).message}`);
      }
    }

    if (request.patterns) {
      for (const pattern of request.patterns) {
        this.logger.log(`CDN pattern purge requested: ${pattern}`);
        purged++;
      }
    }

    return { purged, errors };
  }

  async getTranscodingStatus(transcodingJobId: string): Promise<TranscodingJobStatus | null> {
    const job = await this.prisma.transcodingJob.findUnique({
      where: { id: transcodingJobId },
    });

    if (!job) return null;

    return {
      id: job.id,
      status: job.status as TranscodingJobStatus['status'],
    };
  }

  async updateTranscodingStatus(
    transcodingJobId: string,
    update: Partial<TranscodingJobStatus>
  ): Promise<void> {
    const job = await this.prisma.transcodingJob.findUnique({
      where: { id: transcodingJobId },
    });

    if (!job) return;

    await this.prisma.transcodingJob.update({
      where: { id: transcodingJobId },
      data: { status: update.status },
    });
  }

  async cleanupOrphanedMedia(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const orphanedUploads = await this.prisma.mediaUpload.findMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      this.logger.log(`Found ${orphanedUploads.length} old media uploads to review`);

      // Batch delete orphaned uploads (fixes N+1)
      const orphanIds = orphanedUploads
        .filter((upload) => {
          const metadata = (upload as Record<string, unknown>).metadata as
            | Record<string, unknown>
            | undefined;
          return metadata?.orphaned === true;
        })
        .map((upload) => upload.id);

      if (orphanIds.length > 0) {
        await this.prisma.mediaUpload.deleteMany({
          where: { id: { in: orphanIds } },
        });
        await Promise.all(orphanIds.map((id) => this.cache.delete(cacheKey('media', id))));
        cleaned = orphanIds.length;
      }
    } catch (error) {
      errors.push(`Orphan cleanup failed: ${(error as Error).message}`);
    }

    return { cleaned, errors };
  }

  async generatePremiumUrl(
    mediaUploadId: string,
    options: { expiresIn?: number } = {}
  ): Promise<{ url: string; expiresAt: Date }> {
    const upload = await this.prisma.mediaUpload.findUnique({
      where: { id: mediaUploadId },
    });

    if (!upload) {
      throw new Error(`Media upload ${mediaUploadId} not found`);
    }

    const expiresIn = options.expiresIn || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const url =
      upload.cdnUrl ||
      `${process.env.MEDIA_CDN_URL || 'https://cdn.azeebo.com'}/${upload.fileName}`;

    return { url, expiresAt };
  }
}
