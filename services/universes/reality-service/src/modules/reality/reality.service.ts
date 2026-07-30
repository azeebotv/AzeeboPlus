import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';
import { RealityResponse } from './interfaces/reality-response.interface.js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface VoteWithQuantity {
  contestantId: string;
  showId: string;
  quantity: number;
}

interface PremiumExtra {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  duration?: number;
}

@Injectable()
export class RealityService {
  private readonly logger = new Logger(RealityService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;
  private readonly supervoteCost: number;
  private readonly voteCost: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.supervoteCost = this.configService.get<number>('SUPERVOTE_COST', 10);
    this.voteCost = this.configService.get<number>('VOTE_COST', 1);
  }

  private async trackEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/v1/analytics/events`,
        {
          type: eventName,
          userId,
          universe: 'reality',
          metadata,
          timestamp: new Date().toISOString(),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
    }
  }

  // Premium extras loaded from config with sensible defaults
  // Prices are configurable via environment variables to avoid hardcoded values
  private getPremiumExtrasData(): PremiumExtra[] {
    return [
      {
        id: '1',
        name: 'Early Voting',
        description: 'Vote before regular voting opens',
        price: this.configService.get<number>('PREMIUM_EXTRA_EARLY_VOTING_PRICE', 5),
        type: 'feature',
        duration: this.configService.get<number>('PREMIUM_EXTRA_EARLY_VOTING_DURATION', 7),
      },
      {
        id: '2',
        name: 'Vote Multiplier',
        description: 'Your votes count double',
        price: this.configService.get<number>('PREMIUM_EXTRA_VOTE_MULTIPLIER_PRICE', 20),
        type: 'feature',
        duration: this.configService.get<number>('PREMIUM_EXTRA_VOTE_MULTIPLIER_DURATION', 3),
      },
      {
        id: '3',
        name: 'Exclusive Content',
        description: 'Access behind-the-scenes footage',
        price: this.configService.get<number>('PREMIUM_EXTRA_EXCLUSIVE_CONTENT_PRICE', 15),
        type: 'content',
        duration: this.configService.get<number>('PREMIUM_EXTRA_EXCLUSIVE_CONTENT_DURATION', 30),
      },
      {
        id: '4',
        name: 'Live Chat',
        description: 'Join exclusive live chats with contestants',
        price: this.configService.get<number>('PREMIUM_EXTRA_LIVE_CHAT_PRICE', 10),
        type: 'feature',
        duration: this.configService.get<number>('PREMIUM_EXTRA_LIVE_CHAT_DURATION', 7),
      },
    ];
  }

  async listShows(): Promise<RealityResponse> {
    const cacheK = cacheKey('reality', 'shows:list');
    const cached = await this.cache.get<{ shows: unknown }>(cacheK);
    if (cached) {
      return { success: true, data: cached };
    }

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

    const result = { shows: shows as unknown };
    await this.cache.set(cacheK, result, 30);

    return {
      success: true,
      data: result,
    };
  }

  async getShow(showId: string): Promise<RealityResponse> {
    const cacheK = cacheKey('reality', `show:${showId}`);
    const cached = await this.cache.get<{ show: unknown }>(cacheK);
    if (cached) {
      return { success: true, data: cached };
    }

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

    const result = { show: show as unknown };
    await this.cache.set(cacheK, result, 30);

    return {
      success: true,
      data: result,
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
    const cacheK = cacheKey('reality', `contestants:${showId}`);
    const cached = await this.cache.get<{ contestants: unknown }>(cacheK);
    if (cached) {
      return { success: true, data: cached };
    }

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

    const result = { contestants: contestants as unknown };
    await this.cache.set(cacheK, result, 30);

    return {
      success: true,
      data: result,
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

    const vote = await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: {
          userId_contestantId: { userId, contestantId },
        },
      });

      if (existingVote) {
        throw new ConflictException('User has already voted for this contestant');
      }

      return tx.vote.create({
        data: {
          userId,
          contestantId,
          showId,
        },
      });
    });

    await Promise.all([
      this.cache.invalidate(`reality:show:${showId}`),
      this.cache.invalidate(`reality:contestants:${showId}`),
      this.cache.invalidate('reality:shows:list'),
    ]);
    await this.trackEvent('vote_submitted', userId, {
      voteId: vote.id,
      contestantId,
      showId,
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

    const walletResponse = await axios.get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, {
      timeout: 10000,
    });
    const wallet = walletResponse.data?.wallet || walletResponse.data;
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user`);
    }

    if (Number(wallet.balance) < this.supervoteCost) {
      throw new BadRequestException('Insufficient balance');
    }

    const idempotencyKey = randomUUID();

    const debitResult = await axios
      .post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: this.supervoteCost,
          description: `Supervote for contestant ${contestantId} on show ${showId}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      )
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
        throw new ConflictException(errorMessage);
      });

    try {
      const supervote = await this.prisma.$transaction(async (tx) => {
        const existingSupervote = await tx.supervote.findUnique({
          where: {
            userId_contestantId: { userId, contestantId },
          },
        });

        if (existingSupervote) {
          throw new ConflictException('User has already supervoted for this contestant');
        }

        return tx.supervote.create({
          data: {
            userId,
            contestantId,
            showId,
            amount: this.supervoteCost,
          },
        });
      });

      await Promise.all([
        this.cache.invalidate(`reality:show:${showId}`),
        this.cache.invalidate(`reality:contestants:${showId}`),
        this.cache.invalidate('reality:shows:list'),
      ]);
      await this.trackEvent('supervote_submitted', userId, {
        supervoteId: supervote.id,
        contestantId,
        showId,
        amount: this.supervoteCost,
      });

      return {
        success: true,
        data: {
          supervoteId: supervote.id,
          balance: debitResult.data?.balance,
          message: `Supervote submitted successfully. ${this.supervoteCost} NGN has been deducted from your wallet.`,
        },
      };
    } catch (error) {
      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: wallet.id,
            amount: this.supervoteCost,
            description: `Compensation for failed supervote: ${idempotencyKey}`,
            reference: `compensate:${idempotencyKey}`,
          },
          { timeout: 10000 }
        )
        .catch((compensateError: unknown) => {
          this.logger.error(
            'Failed to compensate wallet after supervote failure:',
            compensateError
          );
        });
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to submit supervote';
      throw new ConflictException(errorMessage);
    }
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

    await this.trackEvent('prediction_placed', userId, {
      predictionId: predictionRecord.id,
      showId,
      predictionType: Object.keys(prediction)[0] || 'unknown',
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

  async listVotesForShow(showId: string, page: number, limit: number): Promise<RealityResponse> {
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        where: { showId },
        include: {
          contestant: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vote.count({ where: { showId } }),
    ]);

    return {
      success: true,
      data: {
        votes: votes as unknown,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async listPredictionsForShow(
    showId: string,
    page: number,
    limit: number
  ): Promise<RealityResponse> {
    const skip = (page - 1) * limit;

    const [predictions, total] = await Promise.all([
      this.prisma.prediction.findMany({
        where: { showId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prediction.count({ where: { showId } }),
    ]);

    return {
      success: true,
      data: {
        predictions: predictions as unknown,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getClips(showId?: string): Promise<RealityResponse> {
    const clips = await this.prisma.realityClip.findMany({
      where: showId ? { showId } : {},
      include: {
        show: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: { clips: clips as unknown },
    };
  }

  async submitVotesWithQuantity(userId: string, body: VoteWithQuantity): Promise<RealityResponse> {
    const { contestantId, showId, quantity } = body;

    if (quantity <= 0 || quantity > 10) {
      throw new BadRequestException('Vote quantity must be between 1 and 10');
    }

    const contestant = await this.prisma.contestant.findUnique({
      where: { id: contestantId },
    });

    if (!contestant) {
      throw new NotFoundException('Contestant not found');
    }

    const walletResponse = await axios.get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, {
      timeout: 10000,
    });
    const wallet = walletResponse.data?.wallet || walletResponse.data;
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const totalCost = quantity * this.voteCost;
    if (Number(wallet.balance) < totalCost) {
      throw new BadRequestException('Insufficient balance');
    }

    const idempotencyKey = randomUUID();

    const debitResult = await axios
      .post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: totalCost,
          description: `${quantity} votes for contestant ${contestantId}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      )
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
        throw new ConflictException(errorMessage);
      });

    try {
      const vote = await this.prisma.$transaction(async (tx) => {
        // Use upsert to either create a new vote or increment quantity on existing
        const result = await tx.vote.upsert({
          where: {
            userId_contestantId: { userId, contestantId },
          },
          create: {
            userId,
            contestantId,
            showId,
            quantity,
          },
          update: {
            quantity: { increment: quantity },
          },
        });

        return result;
      });

      await Promise.all([
        this.cache.invalidate(`reality:show:${showId}`),
        this.cache.invalidate(`reality:contestants:${showId}`),
        this.cache.invalidate('reality:shows:list'),
      ]);
      await this.trackEvent('vote_submitted', userId, {
        voteId: vote.id,
        contestantId,
        showId,
        voteType: 'bulk',
        quantity,
        totalCost,
      });

      return {
        success: true,
        data: {
          voteId: vote.id,
          quantity: vote.quantity,
          totalCost,
          balance: debitResult.data?.balance,
          message: `${quantity} votes submitted successfully`,
        },
      };
    } catch (error) {
      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: wallet.id,
            amount: totalCost,
            description: `Compensation for failed votes: ${idempotencyKey}`,
            reference: `compensate:${idempotencyKey}`,
          },
          { timeout: 10000 }
        )
        .catch((compensateError: unknown) => {
          this.logger.error('Failed to compensate wallet after votes failure:', compensateError);
        });
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to submit votes';
      throw new ConflictException(errorMessage);
    }
  }

  async getWalletBalance(userId: string): Promise<RealityResponse> {
    const walletResponse = await axios.get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, {
      timeout: 10000,
    });
    const wallet = walletResponse.data?.wallet || walletResponse.data;

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      success: true,
      data: {
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance,
        promoBalance: wallet.promoBalance,
        currency: wallet.currency,
        recentTransactions: wallet.transactions || [],
      },
    };
  }

  async getPricing(): Promise<RealityResponse> {
    return {
      success: true,
      data: {
        voteCost: this.voteCost,
        supervoteCost: this.supervoteCost,
        premiumExtras: this.getPremiumExtrasData(),
      },
    };
  }

  async getPremiumExtras(): Promise<RealityResponse> {
    return {
      success: true,
      data: { premiumExtras: this.getPremiumExtrasData() },
    };
  }

  async purchasePremiumExtra(userId: string, extraId: string): Promise<RealityResponse> {
    const extra = this.getPremiumExtrasData().find((e) => e.id === extraId);
    if (!extra) {
      throw new NotFoundException('Premium extra not found');
    }

    const walletResponse = await axios.get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, {
      timeout: 10000,
    });
    const wallet = walletResponse.data?.wallet || walletResponse.data;
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.balance) < extra.price) {
      throw new BadRequestException('Insufficient balance');
    }

    const idempotencyKey = randomUUID();

    try {
      await axios.post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: extra.price,
          description: `Purchase premium extra: ${extra.name}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      );

      // Create a PremiumPurchase record in the database after wallet debit
      const expiresAt = new Date();
      if (extra.duration) {
        expiresAt.setDate(expiresAt.getDate() + extra.duration);
      }

      await this.prisma.premiumPurchase.create({
        data: {
          userId,
          extraId: extra.id,
          extraName: extra.name,
          extraType: extra.type,
          price: extra.price,
          duration: extra.duration,
          purchaseId: idempotencyKey,
          purchasedAt: new Date(),
          expiresAt: extra.duration ? expiresAt : null,
          status: 'active',
        },
      });

      await this.trackEvent('premium_extra_purchased', userId, {
        purchaseId: idempotencyKey,
        extraId,
        extraName: extra.name,
        extraType: extra.type,
        price: extra.price,
        duration: extra.duration,
      });

      return {
        success: true,
        data: {
          purchaseId: idempotencyKey,
          premiumExtra: extra,
          message: `Successfully purchased ${extra.name}`,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to purchase premium extra';
      throw new ConflictException(errorMessage);
    }
  }

  async getShowAnalytics(showId: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const voteCount = await this.prisma.vote.count({ where: { showId } });
    const supervoteCount = await this.prisma.supervote.count({ where: { showId } });
    const predictionCount = await this.prisma.prediction.count({ where: { showId } });
    const clipCount = await this.prisma.realityClip.count({ where: { showId } });

    const votesByContestant = await this.prisma.vote.groupBy({
      by: ['contestantId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch recent activity events from analytics-service
    let recentActivity: unknown[] = [];
    try {
      const activityResponse = await axios.get(`${this.analyticsServiceBaseUrl}/analytics/events`, {
        params: {
          universe: 'reality',
          limit: 10,
        },
        timeout: 5000,
      });
      if (activityResponse.data?.success && activityResponse.data?.data) {
        recentActivity = activityResponse.data.data;
      }
    } catch (error) {
      this.logger.warn('Failed to fetch activity events from analytics-service:', error);
      // Return empty array on failure - non-critical
    }

    const contestantIds = votesByContestant.map((v) => v.contestantId);
    const contestants = await this.prisma.contestant.findMany({
      where: { id: { in: contestantIds } },
    });
    const contestantMap = new Map(contestants.map((c) => [c.id, c]));

    const votesByContestantWithNames = votesByContestant.map((v) => ({
      contestantId: v.contestantId,
      name: contestantMap.get(v.contestantId)?.name || 'Unknown',
      voteCount: v._count.id,
    }));

    return {
      success: true,
      data: {
        showId,
        showTitle: show.title,
        totalVotes: voteCount,
        totalSupervotes: supervoteCount,
        totalPredictions: predictionCount,
        totalClips: clipCount,
        contestants: votesByContestantWithNames,
        recentActivity,
      },
    };
  }

  async getAdminDashboard(): Promise<RealityResponse> {
    const shows = await this.prisma.realityShow.findMany({
      include: {
        _count: {
          select: { votes: true, contestants: true, episodes: true },
        },
      },
    });

    const totalVotes = await this.prisma.vote.count();
    const totalSupervotes = await this.prisma.supervote.count();
    const totalPredictions = await this.prisma.prediction.count();
    const totalShows = await this.prisma.realityShow.count();
    const totalContestants = await this.prisma.contestant.count();

    return {
      success: true,
      data: {
        overview: {
          totalVotes,
          totalSupervotes,
          totalPredictions,
          totalShows,
          totalContestants,
        },
        shows,
      },
    };
  }

  async createShow(data: {
    title: string;
    description?: string;
    thumbnail: string;
    banner?: string;
    universeId: string;
  }): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        banner: data.banner,
        universeId: data.universeId,
        status: 'draft',
      },
    });

    return {
      success: true,
      data: {
        show,
        message: 'Show created successfully',
      },
    };
  }

  async updateShow(
    showId: string,
    data: {
      title?: string;
      description?: string;
      thumbnail?: string;
      banner?: string;
      status?: string;
    }
  ): Promise<RealityResponse> {
    const existing = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!existing) {
      throw new NotFoundException('Show not found');
    }

    const updated = await this.prisma.realityShow.update({
      where: { id: showId },
      data,
    });

    await Promise.all([
      this.cache.invalidate(`reality:show:${showId}`),
      this.cache.invalidate('reality:shows:list'),
    ]);

    return {
      success: true,
      data: {
        show: updated,
        message: 'Show updated successfully',
      },
    };
  }

  async deleteShow(showId: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    await this.prisma.realityShow.delete({ where: { id: showId } });
    await Promise.all([
      this.cache.invalidate(`reality:show:${showId}`),
      this.cache.invalidate(`reality:contestants:${showId}`),
      this.cache.invalidate('reality:shows:list'),
    ]);

    return {
      success: true,
      data: { message: 'Show deleted successfully' },
    };
  }

  async createContestant(
    showId: string,
    data: {
      name: string;
      description?: string;
      thumbnail?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const contestant = await this.prisma.contestant.create({
      data: {
        showId,
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        socialLinks: data.socialLinks as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: {
        contestant,
        message: 'Contestant created successfully',
      },
    };
  }

  async updateContestant(
    contestantId: string,
    data: {
      name?: string;
      description?: string;
      thumbnail?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<RealityResponse> {
    const existing = await this.prisma.contestant.findUnique({ where: { id: contestantId } });
    if (!existing) {
      throw new NotFoundException('Contestant not found');
    }

    const updated = await this.prisma.contestant.update({
      where: { id: contestantId },
      data: {
        ...data,
        socialLinks: data.socialLinks
          ? (data.socialLinks as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return {
      success: true,
      data: {
        contestant: updated,
        message: 'Contestant updated successfully',
      },
    };
  }

  async deleteContestant(contestantId: string): Promise<RealityResponse> {
    const contestant = await this.prisma.contestant.findUnique({ where: { id: contestantId } });
    if (!contestant) {
      throw new NotFoundException('Contestant not found');
    }

    await this.prisma.contestant.delete({ where: { id: contestantId } });

    return {
      success: true,
      data: { message: 'Contestant deleted successfully' },
    };
  }

  async getContestant(contestantId: string): Promise<RealityResponse> {
    const contestant = await this.prisma.contestant.findUnique({
      where: { id: contestantId },
      include: {
        show: true,
        _count: {
          select: {
            votes: true,
            predictions: true,
          },
        },
      },
    });

    if (!contestant) {
      throw new NotFoundException('Contestant not found');
    }

    return {
      success: true,
      data: { contestant: contestant as unknown },
    };
  }

  async createEpisode(
    showId: string,
    data: {
      title: string;
      number: number;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      airedAt?: Date;
      seasonId?: string;
    }
  ): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const episode = await this.prisma.episode.create({
      data: {
        showId,
        title: data.title,
        number: data.number,
        description: data.description,
        thumbnail: data.thumbnail,
        mediaUrl: data.mediaUrl,
        airedAt: data.airedAt,
        seasonId: data.seasonId,
      },
    });

    return {
      success: true,
      data: {
        episode,
        message: 'Episode created successfully',
      },
    };
  }

  async updateEpisode(
    episodeId: string,
    data: {
      title?: string;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      airedAt?: Date;
    }
  ): Promise<RealityResponse> {
    const existing = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!existing) {
      throw new NotFoundException('Episode not found');
    }

    const updated = await this.prisma.episode.update({
      where: { id: episodeId },
      data,
    });

    return {
      success: true,
      data: {
        episode: updated,
        message: 'Episode updated successfully',
      },
    };
  }

  async deleteEpisode(episodeId: string): Promise<RealityResponse> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    await this.prisma.episode.delete({ where: { id: episodeId } });

    return {
      success: true,
      data: { message: 'Episode deleted successfully' },
    };
  }

  async getEpisode(episodeId: string): Promise<RealityResponse> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        show: true,
        _count: {
          select: {
            votes: true,
            predictions: true,
          },
        },
      },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return {
      success: true,
      data: { episode: episode as unknown },
    };
  }

  async createSeason(
    showId: string,
    data: { title: string; number: number; description?: string; startDate?: Date; endDate?: Date }
  ): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const season = await this.prisma.season.create({
      data: {
        showId,
        title: data.title,
        number: data.number,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return {
      success: true,
      data: {
        season,
        message: 'Season created successfully',
      },
    };
  }

  async confirmReward(userId: string, showId: string): Promise<RealityResponse> {
    // Reward accounting (RewardAccount / PointsLedger) is owned by reward-service and is
    // not part of reality-service's schema. Points are computed here from this service's
    // own vote/supervote records and the reward event is emitted to analytics-service.
    const votes = await this.prisma.vote.count({ where: { userId, showId } });
    const supervotes = await this.prisma.supervote.count({ where: { userId, showId } });

    const pointsEarned = votes + supervotes * 10;

    if (pointsEarned > 0) {
      await this.trackEvent('reward_earned', userId, {
        showId,
        pointsEarned,
        votes,
        supervotes,
      });
    }

    return {
      success: true,
      data: {
        pointsEarned,
        message: `Reward confirmed! You earned ${pointsEarned} points`,
      },
    };
  }

  async detectVoteFraud(showId: string): Promise<RealityResponse> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const suspiciousPatterns = await this.prisma.vote.groupBy({
      by: ['userId'],
      where: {
        showId,
        createdAt: { gte: thirtyMinutesAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 10 } } },
    });

    const concentration = await this.prisma.contestant.findMany({
      where: { showId },
      include: {
        _count: { select: { votes: true, supervotes: true } },
      },
    });

    const totalVotes = concentration.reduce((sum, c) => sum + c._count.votes, 0);
    const concentrationScores = concentration.map((c) => ({
      contestantId: c.id,
      name: c.name,
      voteShare: totalVotes > 0 ? (c._count.votes / totalVotes) * 100 : 0,
      isSuspicious: totalVotes > 10 && c._count.votes / totalVotes > 50,
    }));

    const fraudIndicators = {
      rapidVoters: suspiciousPatterns.length,
      topContestantConcentration: concentrationScores.filter((c) => c.isSuspicious).length,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    };

    if (fraudIndicators.rapidVoters > 5 || fraudIndicators.topContestantConcentration > 0) {
      fraudIndicators.riskLevel = 'high';
    } else if (fraudIndicators.rapidVoters > 0) {
      fraudIndicators.riskLevel = 'medium';
    }

    return {
      success: true,
      data: {
        fraudIndicators,
        suspiciousUsers: suspiciousPatterns.map((p) => p.userId),
        concentrationScores,
      },
    };
  }

  async detectSupervoteFraud(showId: string): Promise<RealityResponse> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const bulkSupervoters = await this.prisma.supervote.groupBy({
      by: ['userId'],
      where: {
        showId,
        createdAt: { gte: oneHourAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 3 } } },
    });

    const highValueSupervotes = await this.prisma.supervote.groupBy({
      by: ['contestantId'],
      where: {
        showId,
        createdAt: { gte: oneHourAgo },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const concentration = highValueSupervotes.map((c) => ({
      contestantId: c.contestantId,
      totalAmount: c._sum.amount || 0,
      count: c._count.id,
      averageAmount: c._count.id > 0 ? (Number(c._sum.amount) || 0) / c._count.id : 0,
    }));

    const fraudIndicators = {
      bulkSupervoters: bulkSupervoters.length,
      highValueConcentration: concentration.filter((c) => c.count > 5 && c.averageAmount > 15)
        .length,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    };

    if (fraudIndicators.bulkSupervoters > 2 || fraudIndicators.highValueConcentration > 0) {
      fraudIndicators.riskLevel = 'high';
    } else if (fraudIndicators.bulkSupervoters > 0) {
      fraudIndicators.riskLevel = 'medium';
    }

    return {
      success: true,
      data: {
        fraudIndicators,
        bulkSupervoters: bulkSupervoters.map((p) => ({ userId: p.userId, count: p._count.id })),
        concentration,
      },
    };
  }

  async detectPredictionFraud(showId: string): Promise<RealityResponse> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const coordinatedPredictions = await this.prisma.prediction.groupBy({
      by: ['prediction'],
      where: {
        showId,
        createdAt: { gte: oneDayAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 20 } } },
    });

    const userPredictionCount = await this.prisma.prediction.groupBy({
      by: ['userId'],
      where: {
        showId,
        createdAt: { gte: oneDayAgo },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 10 } } },
    });

    const fraudIndicators = {
      coordinatedPredictions: coordinatedPredictions.length,
      excessivePredictors: userPredictionCount.length,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    };

    if (fraudIndicators.coordinatedPredictions > 5 || fraudIndicators.excessivePredictors > 3) {
      fraudIndicators.riskLevel = 'high';
    } else if (
      fraudIndicators.coordinatedPredictions > 0 ||
      fraudIndicators.excessivePredictors > 0
    ) {
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
        excessiveUsers: userPredictionCount.map((p) => ({ userId: p.userId, count: p._count.id })),
      },
    };
  }

  async getOverallFraudAssessment(showId: string): Promise<RealityResponse> {
    const voteFraud = await this.detectVoteFraud(showId);
    const supervoteFraud = await this.detectSupervoteFraud(showId);
    const predictionFraud = await this.detectPredictionFraud(showId);

    const voteRisk = (voteFraud.data?.fraudIndicators as { riskLevel: string })?.riskLevel || 'low';
    const supervoteRisk =
      (supervoteFraud.data?.fraudIndicators as { riskLevel: string })?.riskLevel || 'low';
    const predictionRisk =
      (predictionFraud.data?.fraudIndicators as { riskLevel: string })?.riskLevel || 'low';

    const riskLevels = [voteRisk, supervoteRisk, predictionRisk];
    const overallRisk: 'low' | 'medium' | 'high' | 'critical' = riskLevels.includes('critical')
      ? 'critical'
      : riskLevels.includes('high')
        ? 'high'
        : riskLevels.includes('medium')
          ? 'medium'
          : 'low';

    const recommendations: string[] = [];
    if (voteRisk === 'high') recommendations.push('Consider implementing IP-based vote limits');
    if (supervoteRisk === 'high')
      recommendations.push('Review bulk supervote patterns for refund eligibility');
    if (predictionRisk === 'high')
      recommendations.push('Monitor prediction market for market manipulation');

    return {
      success: true,
      data: {
        overallRisk,
        voteFraudRisk: voteRisk,
        supervoteFraudRisk: supervoteRisk,
        predictionFraudRisk: predictionRisk,
        recommendations,
      },
    };
  }

  // Social Features

  async likeShow(userId: string, showId: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const existingLike = await this.prisma.showLike.findUnique({
      where: { userId_showId: { userId, showId } },
    });

    if (existingLike) {
      await this.prisma.showLike.delete({
        where: { id: existingLike.id },
      });

      await this.trackEvent('show_unliked', userId, { showId });

      return {
        success: true,
        data: { liked: false, message: 'Show unliked successfully' },
      };
    }

    await this.prisma.showLike.create({
      data: { userId, showId },
    });

    await this.trackEvent('show_liked', userId, { showId });

    return {
      success: true,
      data: { liked: true, message: 'Show liked successfully' },
    };
  }

  async getLikeCount(showId: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const count = await this.prisma.showLike.count({ where: { showId } });

    return {
      success: true,
      data: { showId, likeCount: count },
    };
  }

  async addComment(userId: string, showId: string, content: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const comment = await this.prisma.showComment.create({
      data: { userId, showId, content },
    });

    await this.trackEvent('comment_added', userId, {
      showId,
      commentId: comment.id,
    });

    return {
      success: true,
      data: {
        comment,
        message: 'Comment added successfully',
      },
    };
  }

  async getComments(showId: string, page: number, limit: number): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.showComment.findMany({
        where: { showId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.showComment.count({ where: { showId } }),
    ]);

    return {
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async shareShow(userId: string, showId: string, platform?: string): Promise<RealityResponse> {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show not found');
    }

    const share = await this.prisma.showShare.create({
      data: { userId, showId, platform },
    });

    await this.trackEvent('show_shared', userId, {
      showId,
      shareId: share.id,
      platform,
    });

    return {
      success: true,
      data: {
        shareId: share.id,
        message: 'Show shared successfully',
      },
    };
  }
}
