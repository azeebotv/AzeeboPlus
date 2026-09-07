import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';

export interface DownloadRequest {
  contentId: string;
  quality: 'low' | 'medium' | 'high';
  userId: string;
}

export interface DownloadItem {
  id: string;
  contentId: string;
  userId: string;
  quality: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';
  progress: number;
  fileSize: number;
  downloadedAt: Date;
  expiresAt: Date;
  url?: string;
}

export interface StorageInfo {
  totalUsed: number;
  totalAvailable: number;
  items: number;
  breakdown: { quality: string; count: number; size: number }[];
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly maxStorageBytes: number;
  readonly defaultExpiryDays = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    // Default 2GB storage limit per user
    this.maxStorageBytes = this.configService.get<number>(
      'DOWNLOAD_MAX_STORAGE',
      2 * 1024 * 1024 * 1024
    );
  }

  /**
   * Initiate a content download
   */
  async requestDownload(dto: DownloadRequest): Promise<DownloadItem> {
    // Check if content exists and is downloadable
    const content = await this.prisma.contentItem.findUnique({
      where: { id: dto.contentId },
      include: { mediaAsset: true },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!content.mediaAsset) {
      throw new BadRequestException('Content has no media asset');
    }

    // Check if already downloaded
    const existing = await this.prisma.download.findFirst({
      where: {
        contentId: dto.contentId,
        userId: dto.userId,
        status: { in: ['pending', 'downloading', 'completed'] },
      },
    });

    if (existing && existing.status === 'completed') {
      throw new BadRequestException('Content already downloaded');
    }

    // Check storage quota
    const storage = await this.getStorageInfo(dto.userId);
    const estimatedSize = this.estimateSize(dto.quality, content.mediaAsset.duration || 0);
    if (storage.totalUsed + estimatedSize > this.maxStorageBytes) {
      throw new BadRequestException('Storage quota exceeded. Delete some downloads first.');
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.defaultExpiryDays);

    // Create or update download record
    const download = existing
      ? await this.prisma.download.update({
          where: { id: existing.id },
          data: {
            quality: dto.quality,
            status: 'pending',
            progress: 0,
            fileSize: estimatedSize,
            expiresAt,
          },
        })
      : await this.prisma.download.create({
          data: {
            contentId: dto.contentId,
            userId: dto.userId,
            quality: dto.quality,
            status: 'pending',
            progress: 0,
            fileSize: estimatedSize,
            expiresAt,
          },
        });

    // Generate signed download URL (would be S3/CDN in production)
    const downloadUrl = await this.generateDownloadUrl(dto.contentId, dto.quality);

    this.logger.log(`Download requested: ${dto.contentId} (${dto.quality}) by ${dto.userId}`);

    return {
      id: download.id,
      contentId: download.contentId,
      userId: download.userId,
      quality: download.quality,
      status: download.status as DownloadItem['status'],
      progress: download.progress,
      fileSize: Number(download.fileSize),
      downloadedAt: download.downloadedAt,
      expiresAt: download.expiresAt,
      url: downloadUrl,
    };
  }

  /**
   * Get all downloads for a user
   */
  async getUserDownloads(userId: string): Promise<DownloadItem[]> {
    const downloads = await this.prisma.download.findMany({
      where: { userId },
      orderBy: { downloadedAt: 'desc' },
    });

    return downloads.map((d) => ({
      id: d.id,
      contentId: d.contentId,
      userId: d.userId,
      quality: d.quality,
      status: d.status as DownloadItem['status'],
      progress: d.progress,
      fileSize: Number(d.fileSize),
      downloadedAt: d.downloadedAt,
      expiresAt: d.expiresAt,
    }));
  }

  /**
   * Get download by ID
   */
  async getDownload(downloadId: string, userId: string): Promise<DownloadItem> {
    const download = await this.prisma.download.findFirst({
      where: { id: downloadId, userId },
    });

    if (!download) {
      throw new NotFoundException('Download not found');
    }

    return {
      id: download.id,
      contentId: download.contentId,
      userId: download.userId,
      quality: download.quality,
      status: download.status as DownloadItem['status'],
      progress: download.progress,
      fileSize: Number(download.fileSize),
      downloadedAt: download.downloadedAt,
      expiresAt: download.expiresAt,
    };
  }

  /**
   * Update download progress
   */
  async updateProgress(downloadId: string, progress: number): Promise<void> {
    const status = progress >= 100 ? 'completed' : 'downloading';
    await this.prisma.download.update({
      where: { id: downloadId },
      data: { progress, status },
    });
  }

  /**
   * Delete a download
   */
  async deleteDownload(downloadId: string, userId: string): Promise<void> {
    const download = await this.prisma.download.findFirst({
      where: { id: downloadId, userId },
    });

    if (!download) {
      throw new NotFoundException('Download not found');
    }

    await this.prisma.download.delete({ where: { id: downloadId } });
    this.logger.log(`Download deleted: ${downloadId}`);
  }

  /**
   * Delete all downloads for a user
   */
  async deleteAllDownloads(userId: string): Promise<number> {
    const result = await this.prisma.download.deleteMany({ where: { userId } });
    return result.count;
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo(userId: string): Promise<StorageInfo> {
    const downloads = await this.prisma.download.findMany({
      where: { userId, status: 'completed' },
    });

    const breakdown = downloads.reduce(
      (acc, d) => {
        const existing = acc.find((b) => b.quality === d.quality);
        if (existing) {
          existing.count++;
          existing.size += Number(d.fileSize);
        } else {
          acc.push({ quality: d.quality, count: 1, size: Number(d.fileSize) });
        }
        return acc;
      },
      [] as { quality: string; count: number; size: number }[]
    );

    return {
      totalUsed: downloads.reduce((sum, d) => sum + Number(d.fileSize), 0),
      totalAvailable: this.maxStorageBytes,
      items: downloads.length,
      breakdown,
    };
  }

  /**
   * Clean up expired downloads
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.download.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { in: ['completed', 'failed'] },
      },
    });
    return result.count;
  }

  /**
   * Estimate file size based on quality and duration
   */
  private estimateSize(quality: string, durationSeconds: number): number {
    const bitrateMap: Record<string, number> = {
      low: 500 * 1000, // 500 kbps
      medium: 1500 * 1000, // 1.5 Mbps
      high: 3000 * 1000, // 3 Mbps
    };
    const bitrate = bitrateMap[quality] || bitrateMap.medium;
    return Math.ceil((bitrate * durationSeconds) / 8); // bytes
  }

  /**
   * Generate a signed download URL
   */
  private async generateDownloadUrl(contentId: string, quality: string): Promise<string> {
    // In production, this would generate a pre-signed S3/CDN URL
    const cdnBase = this.configService.get<string>('CDN_BASE_URL', 'https://cdn.azeebo.com');
    return `${cdnBase}/content/${contentId}/${quality}?token=signed`;
  }
}
