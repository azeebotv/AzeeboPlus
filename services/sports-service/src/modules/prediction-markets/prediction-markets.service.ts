import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PredictionMarketsService {
  constructor(private prisma: PrismaService) {}

  async getPredictionMarkets(
    page = 1,
    limit = 20,
    sport?: string,
    status?: string
  ): Promise<{ success: boolean; data?: unknown }> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.predictionMarket.findMany({
        where,
        include: {
          event: {
            include: {
              teams: true,
              PredictionMarket: true,
            },
          },
          _count: { select: { entries: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.predictionMarket.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMarketById(marketId: string): Promise<{ success: boolean; data?: unknown }> {
    const market = await this.prisma.predictionMarket.findUnique({
      where: { id: marketId },
      include: {
        event: {
          include: {
            teams: true,
            fixtureMetadata: true,
          },
        },
        entries: {
          include: { user: { select: { id: true, displayName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    return { success: true, data: market };
  }

  async createPredictionMarket(
    eventId: string,
    question: string,
    options: unknown[],
    odds?: unknown
  ): Promise<{ success: boolean; data?: { marketId: string } }> {
    const event = await this.prisma.sportsEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.predictionMarket.findUnique({ where: { eventId } });
    if (existing) {
      throw new BadRequestException('Market already exists for this event');
    }

    const market = await this.prisma.predictionMarket.create({
      data: {
        eventId,
        question,
        options: JSON.parse(JSON.stringify(options)),
        odds: odds ? JSON.parse(JSON.stringify(odds)) : undefined,
      },
    });

    return { success: true, data: { marketId: market.id } };
  }

  async placePrediction(
    userId: string,
    marketId: string,
    selectedOption: string,
    stake?: number
  ): Promise<{ success: boolean; data?: { entryId: string; message: string } }> {
    const market = await this.prisma.predictionMarket.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    if (market.status !== 'active') {
      throw new BadRequestException('Market is not active');
    }

    const event = await this.prisma.sportsEvent.findUnique({
      where: { id: market.eventId },
    });

    if (event && event.status !== 'upcoming') {
      throw new BadRequestException('Event has already started');
    }

    const existing = await this.prisma.predictionEntry.findFirst({
      where: { userId, predictionMarketId: marketId },
    });

    if (existing) {
      throw new BadRequestException('Already placed a prediction in this market');
    }

    const entry = await this.prisma.predictionEntry.create({
      data: {
        userId,
        eventId: market.eventId,
        prediction: { selectedOption, stake } as unknown as Record<
          string,
          string | number | boolean | null
        >,
        predictionMarketId: marketId,
      },
    });

    return {
      success: true,
      data: { entryId: entry.id, message: 'Prediction placed successfully' },
    };
  }

  async settleMarket(
    marketId: string,
    winningOption: string
  ): Promise<{ success: boolean; data?: { winners: number; totalDistributed: number } }> {
    const market = await this.prisma.predictionMarket.findUnique({
      where: { id: marketId },
      include: { entries: true },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    await this.prisma.predictionMarket.update({
      where: { id: marketId },
      data: { status: 'settled' },
    });

    const winners = market.entries.filter(
      (e) => (e.prediction as Record<string, unknown>)?.selectedOption === winningOption
    );

    let totalDistributed = 0;
    for (const winner of winners) {
      await this.prisma.predictionEntry.update({
        where: { id: winner.id },
        data: { points: 100 },
      });
      totalDistributed += 100;
    }

    return {
      success: true,
      data: { winners: winners.length, totalDistributed },
    };
  }

  async getUserPredictions(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data?: unknown }> {
    const [items, total] = await Promise.all([
      this.prisma.predictionEntry.findMany({
        where: { userId },
        include: {
          event: { include: { teams: true } },
          PredictionMarket: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.predictionEntry.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: { items, page, limit, total },
    };
  }

  async getLeaderboard(limit = 100): Promise<{ success: boolean; data?: unknown }> {
    const entries = await this.prisma.predictionEntry.groupBy({
      by: ['userId'],
      _sum: { points: true },
      _count: true,
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });

    const leaderboard = await Promise.all(
      entries.map(async (entry, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: entry.userId },
          select: { id: true, displayName: true, avatar: true },
        });
        return {
          rank: index + 1,
          userId: entry.userId,
          displayName: user?.displayName,
          avatar: user?.avatar,
          totalPoints: entry._sum.points || 0,
          predictionCount: entry._count,
        };
      })
    );

    return { success: true, data: leaderboard };
  }
}
