import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import { RealityResponse } from './interfaces/reality-response.interface';

@Injectable()
export class RealityService {
  constructor(private readonly prisma: PrismaService) {}

  async listShows(): Promise<RealityResponse> {
    const shows = await this.prisma.realityShow.findMany({
      include: {
        seasons: true,
        contestants: true,
        _count: {
          select: {
            episodes: true,
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { shows: shows as unknown },
    };
  }

  async getShow(showId: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({
      where: { id: showId },
      include: {
        seasons: true,
        contestants: true,
        episodes: true,
        _count: {
          select: {
            episodes: true,
            votes: true,
            predictions: true,
          },
        },
      },
    });

    if (!show) {
      throw new NotFoundException(`Show not found`);
    }

    return {
      success: true,
      data: { show: show as unknown },
    };
  }

  async listEpisodes(showId: string): Promise<RealityResponse> {
    const episodes = await this.prisma.episode.findMany({
      where: { showId },
      include: {
        show: true,
        _count: {
          select: {
            votes: true,
            predictions: true,
          },
        },
      },
      orderBy: { airedAt: 'desc' },
    });

    return {
      success: true,
      data: { episodes: episodes as unknown },
    };
  }

  async listContestants(showId: string): Promise<RealityResponse> {
    const contestants = await this.prisma.contestant.findMany({
      where: { showId },
      include: {
        show: true,
        _count: {
          select: {
            votes: true,
            predictions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: { contestants: contestants as unknown },
    };
  }

  async getLeaderboard(showId: string): Promise<RealityResponse> {
    const contestants = await this.prisma.contestant.findMany({
      where: { showId },
      include: {
        votes: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        supervotes: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ supervotes: { _count: 'desc' } }, { votes: { _count: 'desc' } }],
    });

    const leaderboard = contestants.map((c, index: number) => ({
      rank: index + 1,
      contestantId: c.id,
      name: c.name,
      votes: c.votes.length,
      supervotes: c.supervotes.length,
      totalScore: c.votes.length + c.supervotes.length * 10,
    }));

    return {
      success: true,
      data: { leaderboard },
    };
  }

  async submitVote(
    userId: string,
    body: { contestantId: string; showId: string }
  ): Promise<RealityResponse> {
    const { contestantId, showId } = body;

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_contestantId: { userId, contestantId },
      },
    });

    if (existingVote) {
      throw new ConflictException('User has already voted for this contestant');
    }

    const vote = await this.prisma.vote.create({
      data: {
        userId,
        contestantId,
        showId,
      },
    });

    return {
      success: true,
      data: {
        voteId: vote.id,
        message: 'Vote submitted successfully',
      },
    };
  }

  async submitSupervote(
    userId: string,
    body: { contestantId: string; showId: string }
  ): Promise<RealityResponse> {
    const { contestantId, showId } = body;

    const existingSupervote = await this.prisma.supervote.findUnique({
      where: {
        userId_contestantId: { userId, contestantId },
      },
    });

    if (existingSupervote) {
      throw new ConflictException('User has already supervoted for this contestant');
    }

    const supervote = await this.prisma.supervote.create({
      data: {
        userId,
        contestantId,
        showId,
      },
    });

    return {
      success: true,
      data: {
        supervoteId: supervote.id,
        message: 'Supervote submitted successfully',
      },
    };
  }

  async submitPrediction(
    userId: string,
    body: { showId: string; prediction: Record<string, unknown> }
  ): Promise<RealityResponse> {
    const { showId, prediction } = body;

    const predictionRecord = await this.prisma.prediction.create({
      data: {
        userId,
        showId,
        prediction: prediction as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: {
        predictionId: predictionRecord.id,
        message: 'Prediction submitted successfully',
      },
    };
  }

  async getPredictionDashboard(userId: string, showId: string): Promise<RealityResponse> {
    const predictions = await this.prisma.prediction.findMany({
      where: { showId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const userPrediction = await this.prisma.prediction.findFirst({
      where: { userId, showId },
    });

    return {
      success: true,
      data: {
        predictions,
        userPrediction,
      },
    };
  }

  async getClips(showId?: string): Promise<RealityResponse> {
    const clips = await this.prisma.realityClip.findMany({
      where: showId ? { showId } : {},
      include: {
        show: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { clips: clips as unknown },
    };
  }
}
