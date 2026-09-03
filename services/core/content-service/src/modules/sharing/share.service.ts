import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import crypto from 'crypto';

export interface ShareLink {
  id: string;
  contentId: string;
  shortUrl: string;
  platform: string;
  shareCount: number;
  createdAt: Date;
}

export interface ShareAnalytics {
  contentId: string;
  totalShares: number;
  platformBreakdown: { platform: string; count: number }[];
  recentShares: { platform: string; timestamp: Date }[];
}

export interface SharePreview {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL', 'https://azeeboplus.com');
  }

  /**
   * Generate a shareable link for content
   */
  async generateShareLink(
    contentId: string,
    platform: string,
    userId?: string,
  ): Promise<ShareLink> {
    // Generate short code
    const shortCode = crypto.randomBytes(4).toString('hex');
    const shortUrl = `${this.baseUrl}/s/${shortCode}`;

    // Create or update share record
    const existing = await this.prisma.shareLink.findFirst({
      where: { contentId, platform },
    });

    let share: { id: string; contentId: string; shortUrl: string; platform: string; shareCount: number; createdAt: Date };
    if (existing) {
      share = await this.prisma.shareLink.update({
        where: { id: existing.id },
        data: { shareCount: { increment: 1 }, shortUrl },
      }) as typeof share;
    } else {
      share = await this.prisma.shareLink.create({
        data: {
          contentId,
          shortUrl,
          platform,
          shareCount: 1,
          shortCode,
        },
      }) as typeof share;
    }

    // Track analytics event
    await this.trackShare(contentId, platform, userId);

    this.logger.log(`Share link generated: ${shortUrl} for content ${contentId} on ${platform}`);

    return {
      id: share.id,
      contentId: share.contentId,
      shortUrl: share.shortUrl,
      platform: share.platform,
      shareCount: share.shareCount,
      createdAt: share.createdAt,
    };
  }

  /**
   * Resolve a short URL to content ID
   */
  async resolveShareLink(shortCode: string): Promise<{ contentId: string; redirectUrl: string } | null> {
    const share = await this.prisma.shareLink.findFirst({
      where: { shortCode },
    });

    if (!share) return null;

    // Increment click count
    await this.prisma.shareLink.update({
      where: { id: share.id },
      data: { clickCount: { increment: 1 } },
    });

    return {
      contentId: share.contentId,
      redirectUrl: `${this.baseUrl}/content/${share.contentId}`,
    };
  }

  /**
   * Get share analytics for content
   */
  async getShareAnalytics(contentId: string): Promise<ShareAnalytics> {
    const shares = await this.prisma.shareLink.findMany({
      where: { contentId },
    });

    const totalShares = shares.reduce((sum, s) => sum + s.shareCount, 0);

    const platformBreakdown = shares.map((s) => ({
      platform: s.platform,
      count: s.shareCount,
    }));

    const recentShares = shares
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((s) => ({
        platform: s.platform,
        timestamp: s.createdAt,
      }));

    return {
      contentId,
      totalShares,
      platformBreakdown,
      recentShares,
    };
  }

  /**
   * Generate share preview metadata for Open Graph
   */
  async getSharePreview(contentId: string): Promise<SharePreview | null> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      include: { mediaAsset: true },
    });

    if (!content) return null;

    return {
      title: content.title,
      description: content.description || `Watch ${content.title} on Azeebo+`,
      image: content.thumbnail || `${this.baseUrl}/og-default.png`,
      url: `${this.baseUrl}/content/${contentId}`,
      type: 'video.other',
    };
  }

  /**
   * Track share event for analytics
   */
  private async trackShare(
    contentId: string,
    platform: string,
    userId?: string,
  ): Promise<void> {
    try {
      await this.prisma.shareEvent.create({
        data: {
          contentId,
          platform,
          userId: userId || 'anonymous',
          timestamp: new Date(),
        },
      });
    } catch {
      // Analytics tracking is best-effort
      this.logger.warn(`Failed to track share event for ${contentId}`);
    }
  }
}
