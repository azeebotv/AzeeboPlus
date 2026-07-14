import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { SportsResponse } from './interfaces/sports-response.interface.js';
import axios from 'axios';
import { randomUUID } from 'crypto';

interface PredictionBody {
  eventId: string;
  prediction: Record<string, unknown>;
}

@Injectable()
export class SportsService {
  private readonly logger = new Logger(SportsService.name);
  private readonly analyticsServiceBaseUrl: string;
  private readonly walletServiceBaseUrl: string;
  private readonly predictionFee: number;
  private readonly contestEntryFee: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.predictionFee = this.configService.get<number>('PREDICTION_FEE', 10);
    this.contestEntryFee = this.configService.get<number>('CONTEST_ENTRY_FEE', 50);
  }

  private async getWalletByUserId(userId: string): Promise<{ id: string; balance: number } | null> {
    try {
      const response = await axios.get(`${this.walletServiceBaseUrl}/wallet/user/${userId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        {
          eventName,
          userId,
          universe: 'sports',
          metadata,
          timestamp: new Date().toISOString(),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn('Failed to track analytics event:', error);
    }
  }

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

  async getEventById(id: string): Promise<SportsResponse> {
    const event = await this.prisma.sportsEvent.findUnique({
      where: { id },
      include: {
        teams: true,
        _count: {
          select: { predictions: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      success: true,
      data: { event },
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

    if (event.startsAt && new Date(event.startsAt) < new Date()) {
      throw new BadRequestException('Event has already started');
    }

    const existingEntry = await this.prisma.predictionEntry.findFirst({
      where: { userId, eventId: body.eventId },
    });

    if (existingEntry) {
      return {
        success: true,
        data: {
          predictionId: existingEntry.id,
          message: 'Prediction already submitted (idempotent request)',
          idempotent: true,
        },
      };
    }

    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }

    if (Number(wallet.balance) < this.predictionFee) {
      throw new BadRequestException('Insufficient balance for prediction fee');
    }

    const idempotencyKey = randomUUID();

    const debitResult = await axios
      .post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: this.predictionFee,
          description: `Prediction fee for event ${body.eventId}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      )
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
        throw new BadRequestException(errorMessage);
      });

    try {
      const prediction = await this.prisma.predictionEntry.create({
        data: {
          userId,
          eventId: body.eventId,
          prediction: body.prediction as unknown as Record<
            string,
            string | number | boolean | null
          >,
        },
      });

      await this.trackAnalyticsEvent('prediction_placed', userId, {
        predictionId: prediction.id,
        eventId: body.eventId,
        fee: this.predictionFee,
      });

      return {
        success: true,
        data: {
          predictionId: prediction.id,
          fee: this.predictionFee,
          balance: debitResult.data?.balance,
          message: 'Prediction submitted',
          idempotent: false,
        },
      };
    } catch (error) {
      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: wallet.id,
            amount: this.predictionFee,
            description: `Compensation for failed prediction: ${idempotencyKey}`,
            reference: `compensate:${idempotencyKey}`,
          },
          { timeout: 10000 }
        )
        .catch((compensateError: unknown) => {
          this.logger.error(
            'Failed to compensate wallet after prediction failure:',
            compensateError
          );
        });
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to submit prediction';
      throw new BadRequestException(errorMessage);
    }
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

  async enterFanContest(userId: string, body: { contestId: string }): Promise<SportsResponse> {
    return this.enterContest(userId, body.contestId);
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

  async enterContest(userId: string, contestId: string): Promise<SportsResponse> {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    if (contest.status !== 'active') {
      throw new BadRequestException('Contest is not active');
    }

    if (contest.endsAt && new Date(contest.endsAt) < new Date()) {
      throw new BadRequestException('Contest has already ended');
    }

    const existingEntry = await this.prisma.contestEntry.findFirst({
      where: {
        userId,
        contestId,
      },
    });

    if (existingEntry) {
      return {
        success: true,
        data: {
          entryId: existingEntry.id,
          message: 'Already entered contest (idempotent)',
          idempotent: true,
        },
      };
    }

    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }

    if (Number(wallet.balance) < this.contestEntryFee) {
      throw new BadRequestException('Insufficient balance for contest entry fee');
    }

    const idempotencyKey = randomUUID();

    const debitResult = await axios
      .post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: this.contestEntryFee,
          description: `Contest entry fee for contest ${contestId}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      )
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
        throw new BadRequestException(errorMessage);
      });

    try {
      const entry = await this.prisma.contestEntry.create({
        data: {
          userId,
          contestId,
          entryData: { fee: this.contestEntryFee },
        },
      });

      await this.trackAnalyticsEvent('contest_entered', userId, {
        contestId,
        entryId: entry.id,
        fee: this.contestEntryFee,
      });

      return {
        success: true,
        data: {
          entryId: entry.id,
          fee: this.contestEntryFee,
          balance: debitResult.data?.balance,
          message: 'Entered contest successfully',
          idempotent: false,
        },
      };
    } catch (error) {
      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: wallet.id,
            amount: this.contestEntryFee,
            description: `Compensation for failed contest entry: ${idempotencyKey}`,
            reference: `compensate:${idempotencyKey}`,
          },
          { timeout: 10000 }
        )
        .catch((compensateError: unknown) => {
          this.logger.error('Failed to compensate wallet:', compensateError);
        });
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to enter contest';
      throw new BadRequestException(errorMessage);
    }
  }

  async resolveEventPredictions(
    eventId: string,
    correctPrediction: Record<string, unknown>
  ): Promise<SportsResponse> {
    const event = await this.prisma.sportsEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'completed') {
      throw new BadRequestException('Event must be completed before resolving predictions');
    }

    await this.prisma.sportsEvent.update({
      where: { id: eventId },
      data: { status: 'resolved' },
    });

    const predictions = await this.prisma.predictionEntry.findMany({
      where: { eventId },
    });

    const correctPredictions = predictions.filter(
      (p) => JSON.stringify(p.prediction) === JSON.stringify(correctPrediction)
    );
    const incorrectPredictions = predictions.filter(
      (p) => JSON.stringify(p.prediction) !== JSON.stringify(correctPrediction)
    );

    await this.prisma.$transaction([
      ...correctPredictions.map((p) =>
        this.prisma.predictionEntry.update({
          where: { id: p.id },
          data: { points: 100 },
        })
      ),
      ...incorrectPredictions.map((p) =>
        this.prisma.predictionEntry.update({
          where: { id: p.id },
          data: { points: 0 },
        })
      ),
    ]);

    const walletUserIds = correctPredictions.map((p) => p.userId);
    const walletResults = await Promise.all(
      walletUserIds.map(async (userId) => {
        const wallet = await this.getWalletByUserId(userId);
        return wallet ? { userId, wallet } : null;
      })
    );
    const walletMap = new Map(
      walletResults
        .filter((r): r is { userId: string; wallet: { id: string; balance: number } } => r !== null)
        .map((r) => [r.userId, r.wallet])
    );

    // Cap total payout pool to prevent catastrophic financial loss
    const MAX_REWARD_PER_USER = 100;
    const MAX_TOTAL_POOL = 10000;
    const baseReward = MAX_REWARD_PER_USER;
    const totalPool = Math.min(baseReward * correctPredictions.length, MAX_TOTAL_POOL);
    const rewardPerUser = correctPredictions.length > 0
      ? Math.floor(totalPool / correctPredictions.length)
      : 0;

    if (rewardPerUser <= 0) {
      this.logger.warn(`No rewards distributed for event ${eventId}: ${correctPredictions.length} correct predictions exceed pool`);
    }

    await Promise.all(
      correctPredictions.map(async (prediction) => {
        const wallet = walletMap.get(prediction.userId);
        if (wallet && rewardPerUser > 0) {
          await axios
            .post(
              `${this.walletServiceBaseUrl}/wallet/credit`,
              {
                walletId: wallet.id,
                amount: rewardPerUser,
                description: `Correct prediction reward for event ${eventId}`,
              },
              { timeout: 10000 }
            )
            .catch((error: unknown) => {
              this.logger.error(`Failed to credit reward to user ${prediction.userId}:`, error);
            });
        }

        await this.trackAnalyticsEvent('prediction_correct', prediction.userId, {
          predictionId: prediction.id,
          eventId,
          reward: rewardPerUser,
        });
      })
    );

    return {
      success: true,
      data: {
        eventId,
        totalPredictions: predictions.length,
        correctCount: correctPredictions.length,
        incorrectCount: incorrectPredictions.length,
        message: `Event resolved: ${correctPredictions.length} correct, ${incorrectPredictions.length} incorrect`,
      },
    };
  }

  async detectPredictionFraud(eventId: string): Promise<SportsResponse> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const coordinatedPredictions = await this.prisma.predictionEntry.groupBy({
      by: ['prediction'],
      where: {
        eventId,
        createdAt: { gte: oneDayAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 10 } } },
    });

    const excessivePredictors = await this.prisma.predictionEntry.groupBy({
      by: ['userId'],
      where: {
        eventId,
        createdAt: { gte: oneDayAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 5 } } },
    });

    const fraudIndicators = {
      coordinatedPatterns: coordinatedPredictions.length,
      excessivePredictors: excessivePredictors.length,
      riskLevel: 'low' as 'low' | 'medium' | 'high',
    };

    if (fraudIndicators.coordinatedPatterns > 3 || fraudIndicators.excessivePredictors > 2) {
      fraudIndicators.riskLevel = 'high';
    } else if (fraudIndicators.coordinatedPatterns > 0 || fraudIndicators.excessivePredictors > 0) {
      fraudIndicators.riskLevel = 'medium';
    }

    return {
      success: true,
      data: {
        fraudIndicators,
        coordinatedPatterns: coordinatedPredictions.map((p) => ({
          prediction: p.prediction,
          count: p._count.id,
        })),
        excessiveUsers: excessivePredictors.map((p) => ({ userId: p.userId, count: p._count.id })),
      },
    };
  }
}
