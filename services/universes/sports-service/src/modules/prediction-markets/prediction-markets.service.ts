import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import axios from 'axios';

@Injectable()
export class PredictionMarketsService {
  private readonly logger = new Logger(PredictionMarketsService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly userServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.userServiceBaseUrl = this.configService.getOrThrow<string>('USER_SERVICE_URL');
  }

  private async getWalletByUserId(userId: string): Promise<{ id: string; balance: number } | null> {
    try {
      const response = await axios.get(`${this.walletServiceBaseUrl}/wallet/user/${userId}`, {
        timeout: 10000,
      });
      const data = response.data?.data ?? response.data;
      return { id: data.id, balance: Number(data.balance) };
    } catch {
      return null;
    }
  }

  private async getUserById(
    userId: string
  ): Promise<{ id: string; displayName: string; avatar: string } | null> {
    try {
      const response = await axios.get(`${this.userServiceBaseUrl}/users/${userId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async getPredictionMarkets(
    page = 1,
    limit = 20,
    sport?: string,
    status?: string
  ): Promise<{ success: boolean; data?: unknown }> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (sport) {
      where.event = { sport };
    }

    try {
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
    } catch (error) {
      this.logger.error(`Failed to get prediction markets: ${error}`);
      throw error;
    }
  }

  async getMarketById(marketId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
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
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!market) {
        throw new NotFoundException('Market not found');
      }

      return { success: true, data: market };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get market by ID ${marketId}: ${error}`);
      throw error;
    }
  }

  async createPredictionMarket(
    eventId: string,
    question: string,
    options: unknown[],
    odds?: unknown
  ): Promise<{ success: boolean; data?: { marketId: string } }> {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to create prediction market: ${error}`);
      throw error;
    }
  }

  async placePrediction(
    userId: string,
    marketId: string,
    selectedOption: string,
    stake?: number
  ): Promise<{ success: boolean; data?: { entryId: string; message: string } }> {
    try {
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

      const wallet = await this.getWalletByUserId(userId);
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const stakeAmount = stake || 10;
      if (Number(wallet.balance) < stakeAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      const idempotencyKey = `prediction-${userId}-${marketId}-${Date.now()}`;

      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/debit`,
          {
            walletId: wallet.id,
            amount: stakeAmount,
            description: `Prediction market stake: ${marketId}`,
            idempotencyKey,
          },
          { timeout: 10000 }
        )
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
          throw new BadRequestException(errorMessage);
        });

      let entryId: string;
      try {
        await this.prisma.predictionMarket.update({
          where: { id: marketId },
          data: { totalPool: { increment: stakeAmount } },
        });

        const entry = await this.prisma.predictionEntry.create({
          data: {
            userId,
            eventId: market.eventId,
            prediction: { selectedOption, stake: stakeAmount } as unknown as Record<
              string,
              string | number | boolean | null
            >,
            predictionMarketId: marketId,
          },
        });
        entryId = entry.id;
      } catch (dbError) {
        // Compensate: credit wallet back if DB write fails after debit
        await axios
          .post(
            `${this.walletServiceBaseUrl}/wallet/credit`,
            {
              walletId: wallet.id,
              amount: stakeAmount,
              description: `Refund: prediction market stake failed for ${marketId}`,
              reference: `compensate:${idempotencyKey}`,
            },
            { timeout: 10000 }
          )
          .catch((compensateError: unknown) => {
            this.logger.error(
              'Failed to compensate wallet after prediction market DB failure:',
              compensateError
            );
          });
        throw dbError;
      }

      return {
        success: true,
        data: { entryId, message: 'Prediction placed successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(
        `Failed to place prediction for user ${userId} in market ${marketId}: ${error}`
      );
      throw error;
    }
  }

  async settleMarket(
    marketId: string,
    winningOption: string
  ): Promise<{ success: boolean; data?: { winners: number; totalDistributed: number } }> {
    try {
      const market = await this.prisma.predictionMarket.findUnique({
        where: { id: marketId },
        include: { entries: true },
      });

      if (!market) {
        throw new NotFoundException('Market not found');
      }

      const winners = market.entries.filter(
        (e) => (e.prediction as Record<string, unknown>)?.selectedOption === winningOption
      );

      let totalDistributed = 0;

      await this.prisma.$transaction(async (tx) => {
        await tx.predictionMarket.update({
          where: { id: marketId },
          data: { status: 'settled' },
        });

        for (const winner of winners) {
          await tx.predictionEntry.update({
            where: { id: winner.id },
            data: { points: 100 },
          });
        }
      });

      for (const winner of winners) {
        const wallet = await this.getWalletByUserId(winner.userId);
        if (wallet) {
          await axios
            .post(
              `${this.walletServiceBaseUrl}/wallet/credit`,
              {
                walletId: wallet.id,
                amount: 100,
                description: `Prediction market winning: ${marketId}`,
                reference: `prediction-win:${marketId}:${winner.userId}`,
              },
              { timeout: 10000 }
            )
            .catch((error: unknown) => {
              this.logger.error(`Failed to credit wallet for user ${winner.userId}:`, error);
            });
        }

        totalDistributed += 100;
      }

      return {
        success: true,
        data: { winners: winners.length, totalDistributed },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to settle market ${marketId}: ${error}`);
      throw error;
    }
  }

  async getUserPredictions(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data?: unknown }> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get user predictions for ${userId}: ${error}`);
      throw error;
    }
  }

  async getLeaderboard(limit = 100): Promise<{ success: boolean; data?: unknown }> {
    try {
      const entries = await this.prisma.predictionEntry.groupBy({
        by: ['userId'],
        _sum: { points: true },
        _count: true,
        orderBy: { _sum: { points: 'desc' } },
        take: limit,
      });

      const leaderboard = await Promise.all(
        entries.map(async (entry, index) => {
          const user = await this.getUserById(entry.userId);
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
    } catch (error) {
      this.logger.error(`Failed to get prediction leaderboard: ${error}`);
      throw error;
    }
  }
}
