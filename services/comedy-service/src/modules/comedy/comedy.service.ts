import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ComedyResponse } from './interfaces/comedy-response.interface';
import axios from 'axios';

interface ChallengeBody {
  challengeId: string;
  clipUrl: string;
}

@Injectable()
export class ComedyService {
  private readonly logger = new Logger(ComedyService.name);
  private readonly analyticsServiceBaseUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';

  constructor(private readonly prisma: PrismaService) {}

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/analytics/track`, {
        eventName,
        userId,
        universe: 'comedy',
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn('Failed to track analytics event:', error);
    }
  }

  async getClips(): Promise<ComedyResponse> {
    const clips = await this.prisma.comedyClip.findMany({
      include: {
        comedian: true,
        creator: true,
        _count: {
          select: { shares: true, likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { clips },
    };
  }

  async getComedians(): Promise<ComedyResponse> {
    const comedians = await this.prisma.comedianProfile.findMany({
      include: {
        user: true,
        _count: {
          select: { clips: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { comedians },
    };
  }

  async getSeries(): Promise<ComedyResponse> {
    const series = await this.prisma.comedySeries.findMany({
      include: {
        episodes: true,
        _count: {
          select: { episodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: { series },
    };
  }

  async submitChallenge(userId: string, body: ChallengeBody): Promise<ComedyResponse> {
    const challenge = await this.prisma.comedyChallenge.findUnique({
      where: { id: body.challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    const existingEntry = await this.prisma.comedyChallengeEntry.findUnique({
      where: {
        userId_challengeId: { userId, challengeId: body.challengeId },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already submitted to this challenge');
    }

    const entry = await this.prisma.comedyChallengeEntry.create({
      data: {
        userId,
        challengeId: body.challengeId,
        clipUrl: body.clipUrl,
      },
    });

    await this.trackAnalyticsEvent('challenge_participated', userId, {
      challengeId: body.challengeId,
      entryId: entry.id,
    });

    return {
      success: true,
      data: {
        entryId: entry.id,
        message: 'Challenge entry submitted',
      },
    };
  }

  async getChallenges(): Promise<ComedyResponse> {
    const challenges = await this.prisma.comedyChallenge.findMany({
      where: { status: 'active' },
      include: {
        prizes: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    return {
      success: true,
      data: { challenges },
    };
  }

  async shareClip(userId: string, clipId: string): Promise<ComedyResponse> {
    const clip = await this.prisma.comedyClip.findUnique({
      where: { id: clipId },
    });

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    await this.prisma.clipShare.create({
      data: {
        userId,
        clipId,
      },
    });

    await this.prisma.comedyClip.update({
      where: { id: clipId },
      data: { shareCount: { increment: 1 } },
    });

    return {
      success: true,
      data: { message: 'Clip shared' },
    };
  }

  async getTrending(): Promise<ComedyResponse> {
    const clips = await this.prisma.comedyClip.findMany({
      include: {
        comedian: true,
        creator: true,
        _count: {
          select: { shares: true, likes: true, comments: true },
        },
      },
      orderBy: [{ shareCount: 'desc' }, { viewCount: 'desc' }],
      take: 20,
    });

    return {
      success: true,
      data: { clips: clips as unknown[] },
    };
  }
}
