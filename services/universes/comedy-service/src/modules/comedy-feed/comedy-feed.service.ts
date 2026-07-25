import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  thumbnail: string;
  mediaUrl: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  creator: { id: string; displayName: string; avatar?: string };
  createdAt: string;
}

interface FeedResponse {
  success: boolean;
  data?: {
    items: FeedItem[];
    page: number;
    limit: number;
    total: number;
  };
  error?: { code: string; message: string };
}

@Injectable()
export class ComedyFeedService {
  private readonly logger = new Logger(ComedyFeedService.name);
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private cache: CacheService
  ) {}

  async getFeed(page = 1, limit = 20, type?: string): Promise<FeedResponse> {
    try {
      const cacheK = cacheKey('comedy', `feed:${type || 'all'}:${page}:${limit}`);
      const cached = await this.cache.get<FeedResponse>(cacheK);
      if (cached) return cached;

      const where: Record<string, unknown> = {};
      if (type === 'clip') {
        where.mediaUrl = { not: null };
      } else if (type === 'series') {
        where.episodes = { some: {} };
      }

      const now = new Date();
      const trendingClips = await this.prisma.comedyClip.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          comedian: {
            select: { id: true, name: true, stageName: true, avatar: true },
          },
        } as never,
        orderBy: { viewCount: 'desc' },
        take: 20,
      });

      const items: FeedItem[] = [
        ...trendingClips.map((clip) => ({
          id: clip.id,
          type: 'clip',
          title: clip.title,
          thumbnail: clip.thumbnail,
          mediaUrl: clip.mediaUrl,
          viewCount: clip.viewCount,
          likeCount: clip.likeCount,
          shareCount: clip.shareCount,
          creator: {
            id: clip.creatorId,
            displayName: (clip as unknown as Record<string, unknown>).comedian
              ? (((clip as unknown as Record<string, unknown>).comedian as Record<string, unknown>)
                  .name as string) || ''
              : '',
            avatar: (clip as unknown as Record<string, unknown>).comedian
              ? (((clip as unknown as Record<string, unknown>).comedian as Record<string, unknown>)
                  .avatar as string) || undefined
              : undefined,
          },
          createdAt: clip.createdAt.toISOString(),
        })),
      ];

      const total = items.length;
      const result: FeedResponse = {
        success: true,
        data: {
          items: items.slice(0, limit),
          page,
          limit,
          total,
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get feed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'FEED_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async getClipById(
    clipId: string,
    userId?: string
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    try {
      const cacheK = cacheKey('comedy', `clip:${clipId}`);
      const cached = await this.cache.get<{
        success: boolean;
        data?: unknown;
        error?: { code: string; message: string };
      }>(cacheK);
      if (cached) return cached;

      const clip = await this.prisma.comedyClip.findUnique({
        where: { id: clipId },
        include: {
          comedian: true,
          likes: userId ? { where: { userId } } : false,
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!clip) {
        throw new NotFoundException('Clip not found');
      }

      await this.prisma.comedyClip.update({
        where: { id: clipId },
        data: { viewCount: { increment: 1 } },
      });

      const result = {
        success: true,
        data: {
          ...clip,
          isLiked: userId ? (clip.likes?.length ?? 0) > 0 : false,
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get clip by id: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return {
        success: false,
        error: { code: 'CLIP_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async likeClip(
    userId: string,
    clipId: string
  ): Promise<{ success: boolean; data?: { message: string; likeCount: number } }> {
    try {
      const existing = await this.prisma.clipLike.findUnique({
        where: { userId_clipId: { userId, clipId } },
      });

      if (existing) {
        await this.prisma.clipLike.delete({ where: { id: existing.id } });
        await this.prisma.comedyClip.update({
          where: { id: clipId },
          data: { likeCount: { decrement: 1 } },
        });
        await this.cache.invalidate('comedy:*');
        return { success: true, data: { message: 'Unliked', likeCount: 0 } };
      }

      await this.prisma.clipLike.create({ data: { userId, clipId } });
      const updated = await this.prisma.comedyClip.update({
        where: { id: clipId },
        data: { likeCount: { increment: 1 } },
      });

      await this.cache.invalidate('comedy:*');
      return { success: true, data: { message: 'Liked', likeCount: updated.likeCount } };
    } catch (error) {
      this.logger.error(`Failed to like clip: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'LIKE_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async commentOnClip(
    userId: string,
    clipId: string,
    text: string
  ): Promise<{ success: boolean; data?: { commentId: string; message: string } }> {
    try {
      const clip = await this.prisma.comedyClip.findUnique({ where: { id: clipId } });
      if (!clip) {
        throw new NotFoundException('Clip not found');
      }

      const comment = await this.prisma.clipComment.create({
        data: { userId, clipId, text },
      });

      await this.cache.invalidate(`comedy:clip:${clipId}`);

      return {
        success: true,
        data: { commentId: comment.id, message: 'Comment added' },
      };
    } catch (error) {
      this.logger.error(
        `Failed to comment on clip: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return {
        success: false,
        error: { code: 'COMMENT_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async getSpecials(
    page = 1,
    limit = 20,
    comedianId?: string
  ): Promise<{ success: boolean; data?: { items: unknown[]; total: number } }> {
    try {
      const where: Record<string, unknown> = {};
      if (comedianId) where.comedianId = comedianId;

      const [items, total] = await Promise.all([
        this.prisma.comedySpecial.findMany({
          where,
          include: {
            comedian: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { releaseDate: 'desc' },
        }),
        this.prisma.comedySpecial.count({ where }),
      ]);

      return {
        success: true,
        data: { items, total },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get specials: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'SPECIALS_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async getSpecialById(specialId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const special = await this.prisma.comedySpecial.findUnique({
        where: { id: specialId },
        include: {
          comedian: true,
        },
      });

      if (!special) {
        throw new NotFoundException('Special not found');
      }

      return { success: true, data: special };
    } catch (error) {
      this.logger.error(
        `Failed to get special by id: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return {
        success: false,
        error: { code: 'SPECIAL_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async likeSpecial(
    userId: string,
    specialId: string
  ): Promise<{ success: boolean; data?: { message: string } }> {
    try {
      const existing = await this.prisma.specialLike.findUnique({
        where: { userId_specialId: { userId, specialId } },
      });

      if (existing) {
        await this.prisma.specialLike.delete({ where: { id: existing.id } });
        await this.prisma.comedySpecial.update({
          where: { id: specialId },
          data: { likeCount: { decrement: 1 } },
        });
        await this.cache.invalidate('comedy:*');
        return { success: true, data: { message: 'Unliked' } };
      }

      await this.prisma.specialLike.create({ data: { userId, specialId } });
      await this.prisma.comedySpecial.update({
        where: { id: specialId },
        data: { likeCount: { increment: 1 } },
      });

      await this.cache.invalidate('comedy:*');
      return { success: true, data: { message: 'Liked' } };
    } catch (error) {
      this.logger.error(
        `Failed to like special: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'LIKE_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async getTrending(
    period = 'daily',
    limit = 20
  ): Promise<{ success: boolean; data?: { items: unknown[] } }> {
    try {
      const cacheK = cacheKey('comedy', `trending:${period}:${limit}`);
      const cached = await this.cache.get<{ success: boolean; data?: { items: unknown[] } }>(
        cacheK
      );
      if (cached) return cached;

      const clips = await this.prisma.comedyClip.findMany({
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      const result = {
        success: true,
        data: {
          items: clips.map((clip, index) => ({
            ...clip,
            trendRank: index + 1,
            trendScore: clip.viewCount + clip.likeCount * 2 + clip.shareCount * 3,
          })),
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get trending: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'TRENDING_ERROR', message: (error as Error).message },
      } as never;
    }
  }

  async recordTrend(period: string): Promise<{ success: boolean; data?: { message: string } }> {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const clips = await this.prisma.comedyClip.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, viewCount: true, likeCount: true, shareCount: true },
      });

      const scored = clips
        .map((clip) => ({
          clipId: clip.id,
          score: clip.viewCount + clip.likeCount * 2 + clip.shareCount * 3,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);

      for (let i = 0; i < scored.length; i++) {
        await this.prisma.comedyTrend.upsert({
          where: { clipId_period: { clipId: scored[i].clipId, period } },
          create: {
            clipId: scored[i].clipId,
            score: scored[i].score,
            rank: i + 1,
            period,
          },
          update: {
            score: scored[i].score,
            rank: i + 1,
          },
        });
      }

      return { success: true, data: { message: `Recorded ${scored.length} trends for ${period}` } };
    } catch (error) {
      this.logger.error(
        `Failed to record trend: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'TREND_RECORD_ERROR', message: (error as Error).message },
      } as never;
    }
  }
}
