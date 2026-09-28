import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { ComedyResponse } from './interfaces/comedy-response.interface.js';
import axios from 'axios';
import { RedisService } from '@azeebo/shared-services';
import { SubmitChallengeDto } from './dto/submit-challenge.dto.js';

@Injectable()
export class ComedyService {
  private readonly logger = new Logger(ComedyService.name);
  private readonly analyticsServiceBaseUrl: string;
  private readonly cachePrefix = 'comedy';

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService
  ) {
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
  }

  private async trackEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/v1/analytics/events`, {
        type: eventName,
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
    const cacheKey = `${this.cachePrefix}:clips:list`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }

    const clips = await this.prisma.comedyClip.findMany({
      include: {
        comedian: true,
        _count: {
          select: { shares: true, likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    await this.redisService.set(cacheKey, JSON.stringify({ clips }), 300);

    return {
      success: true,
      data: { clips },
    };
  }

  async getComedians(): Promise<ComedyResponse> {
    const comedians = await this.prisma.comedianProfile.findMany({
      include: {
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

  async getComedian(id: string): Promise<ComedyResponse> {
    const comedian = await this.prisma.comedianProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clips: true },
        },
      },
    });
    if (!comedian) throw new NotFoundException(`Comedian ${id} not found`);

    return {
      success: true,
      data: { comedian },
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

  async submitChallenge(userId: string, body: SubmitChallengeDto): Promise<ComedyResponse> {
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

    await this.trackEvent('challenge_participated', userId, {
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

  async viewClip(userId: string, clipId: string): Promise<ComedyResponse> {
    const clip = await this.prisma.comedyClip.findUnique({
      where: { id: clipId },
    });

    if (!clip) {
      throw new NotFoundException('Clip not found');
    }

    await this.prisma.comedyClip.update({
      where: { id: clipId },
      data: { viewCount: { increment: 1 } },
    });

    await this.trackEvent('content_view', userId, {
      clipId,
      comedianId: clip.comedianId,
      type: 'comedy_clip',
    });

    return {
      success: true,
      data: { message: 'Clip view tracked' },
    };
  }
}
