import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SportsResponse } from './interfaces/sports-response.interface';

interface PredictionBody {
  eventId: string;
  prediction: Record<string, unknown>;
}

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(): Promise<SportsResponse> {
    const highlights = await this.prisma.highlight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const events = await this.prisma.sportsEvent.findMany({
      where: { status: 'upcoming' },
      orderBy: { startsAt: 'asc' },
      take: 10,
    });

    const predictions = await this.prisma.predictionMarket.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        highlights,
        events,
        predictions,
      },
    };
  }

  async getHighlights(): Promise<SportsResponse> {
    const highlights = await this.prisma.highlight.findMany({
      include: {
        event: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { highlights },
    };
  }

  async getEvents(): Promise<SportsResponse> {
    const events = await this.prisma.sportsEvent.findMany({
      include: {
        teams: true,
        _count: {
          select: { predictions: true },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 50,
    });

    return {
      success: true,
      data: { events },
    };
  }

  async getPredictions(): Promise<SportsResponse> {
    const predictions = await this.prisma.predictionMarket.findMany({
      where: { status: 'active' },
      include: {
        event: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { predictions },
    };
  }

  async submitPrediction(userId: string, body: PredictionBody): Promise<SportsResponse> {
    const event = await this.prisma.sportsEvent.findUnique({
      where: { id: body.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'upcoming') {
      throw new BadRequestException('Predictions are only allowed for upcoming events');
    }

    const prediction = await this.prisma.predictionEntry.create({
      data: {
        userId,
        eventId: body.eventId,
        prediction: body.prediction as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: {
        predictionId: prediction.id,
        message: 'Prediction submitted',
      },
    };
  }

  async getLeaderboard(): Promise<SportsResponse> {
    const leaderboard = await this.prisma.predictionEntry.groupBy({
      by: ['userId'],
      _sum: {
        points: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        },
      },
      take: 100,
    });

    return {
      success: true,
      data: { leaderboard },
    };
  }

  async getFanBoards(): Promise<SportsResponse> {
    const fanBoards = await this.prisma.fanBoard.findMany({
      include: {
        event: true,
        user: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { fanBoards },
    };
  }

  async getContests(): Promise<SportsResponse> {
    const contests = await this.prisma.contest.findMany({
      where: { status: 'active' },
      include: {
        prizes: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
    });

    return {
      success: true,
      data: { contests },
    };
  }
}
