import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  async getFeed(page = 1, limit = 20, type?: string): Promise<FeedResponse> {
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
        creator: { select: { id: true, displayName: true, avatar: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
    });

    const _recentClips = await this.prisma.comedyClip.findMany({
      include: {
        creator: { select: { id: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
        creator: clip.creator,
        createdAt: clip.createdAt.toISOString(),
      })),
    ];

    const total = items.length;
    return {
      success: true,
      data: {
        items: items.slice(0, limit),
        page,
        limit,
        total,
      },
    };
  }

  async getClipById(
    clipId: string,
    userId?: string
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    const clip = await this.prisma.comedyClip.findUnique({
      where: { id: clipId },
      include: {
        creator: { select: { id: true, displayName: true, avatar: true } },
        comedian: true,
        likes: userId ? { where: { userId } } : false,
        comments: {
          include: { user: { select: { id: true, displayName: true, avatar: true } } },
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

    return {
      success: true,
      data: {
        ...clip,
        isLiked: userId ? clip.likes.length > 0 : false,
      },
    };
  }

  async likeClip(
    userId: string,
    clipId: string
  ): Promise<{ success: boolean; data?: { message: string; likeCount: number } }> {
    const existing = await this.prisma.clipLike.findUnique({
      where: { userId_clipId: { userId, clipId } },
    });

    if (existing) {
      await this.prisma.clipLike.delete({ where: { id: existing.id } });
      await this.prisma.comedyClip.update({
        where: { id: clipId },
        data: { likeCount: { decrement: 1 } },
      });
      return { success: true, data: { message: 'Unliked', likeCount: 0 } };
    }

    await this.prisma.clipLike.create({ data: { userId, clipId } });
    const updated = await this.prisma.comedyClip.update({
      where: { id: clipId },
      data: { likeCount: { increment: 1 } },
    });

    return { success: true, data: { message: 'Liked', likeCount: updated.likeCount } };
  }

  async commentOnClip(
    userId: string,
    clipId: string,
    text: string
  ): Promise<{ success: boolean; data?: { commentId: string; message: string } }> {
    const clip = await this.prisma.comedyClip.findUnique({ where: { id: clipId } });
    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    const comment = await this.prisma.clipComment.create({
      data: { userId, clipId, text },
    });

    return {
      success: true,
      data: { commentId: comment.id, message: 'Comment added' },
    };
  }

  async getSpecials(
    page = 1,
    limit = 20,
    comedianId?: string
  ): Promise<{ success: boolean; data?: { items: unknown[]; total: number } }> {
    const where: Record<string, unknown> = {};
    if (comedianId) where.comedianId = comedianId;

    const [items, total] = await Promise.all([
      this.prisma.comedySpecial.findMany({
        where,
        include: {
          comedian: { include: { user: { select: { displayName: true, avatar: true } } } },
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
  }

  async getSpecialById(specialId: string): Promise<{ success: boolean; data?: unknown }> {
    const special = await this.prisma.comedySpecial.findUnique({
      where: { id: specialId },
      include: {
        comedian: { include: { user: { select: { displayName: true, avatar: true } } } },
      },
    });

    if (!special) {
      throw new NotFoundException('Special not found');
    }

    return { success: true, data: special };
  }

  async likeSpecial(
    userId: string,
    specialId: string
  ): Promise<{ success: boolean; data?: { message: string } }> {
    const existing = await this.prisma.specialLike.findUnique({
      where: { userId_specialId: { userId, specialId } },
    });

    if (existing) {
      await this.prisma.specialLike.delete({ where: { id: existing.id } });
      await this.prisma.comedySpecial.update({
        where: { id: specialId },
        data: { likeCount: { decrement: 1 } },
      });
      return { success: true, data: { message: 'Unliked' } };
    }

    await this.prisma.specialLike.create({ data: { userId, specialId } });
    await this.prisma.comedySpecial.update({
      where: { id: specialId },
      data: { likeCount: { increment: 1 } },
    });

    return { success: true, data: { message: 'Liked' } };
  }

  async getTrending(
    _period = 'daily',
    limit = 20
  ): Promise<{ success: boolean; data?: { items: unknown[] } }> {
    const clips = await this.prisma.comedyClip.findMany({
      include: {
        creator: { select: { id: true, displayName: true, avatar: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: {
        items: clips.map((clip, index) => ({
          ...clip,
          trendRank: index + 1,
          trendScore: clip.viewCount + clip.likeCount * 2 + clip.shareCount * 3,
        })),
      },
    };
  }

  async recordTrend(period: string): Promise<{ success: boolean; data?: { message: string } }> {
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
  }
}
