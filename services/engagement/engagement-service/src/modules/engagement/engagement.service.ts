import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { Prisma } from '@prisma/client';
import axios from 'axios';

const ALLOWED_TIME_PERIODS = ['daily', 'weekly', 'monthly', 'allTime'] as const;
const ALLOWED_CATEGORIES = ['all', 'gaming', 'content', 'social', 'predictions'] as const;

interface LeaderboardEntryData {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  rank: number;
  category: string;
  timePeriod: string;
}

interface PredictionData {
  id: string;
  userId: string;
  contentId: string;
  prediction: string;
  points: number;
  isCorrect: boolean | null;
  result: string | null;
  createdAt: Date;
}

interface RankingData {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  rank: number;
  category: string;
}

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

  async getLeaderboard(timePeriod = 'weekly', category = 'all', limit = 50) {
    if (!(ALLOWED_TIME_PERIODS as readonly string[]).includes(timePeriod)) {
      throw new BadRequestException(
        `Invalid timePeriod. Allowed: ${ALLOWED_TIME_PERIODS.join(', ')}`
      );
    }
    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
      throw new BadRequestException(`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    try {
      const cacheK = cacheKey('engagement', `leaderboard:${timePeriod}:${category}:${limit}`);
      const cached = await this.cache.get<{
        success: boolean;
        data: Array<{
          id: string;
          userId: string;
          displayName: string;
          avatar: string;
          score: number;
          rank: number;
          category: string;
          timePeriod: string;
        }>;
      }>(cacheK);
      if (cached) return cached;

      const entries = await this.prisma.leaderboardEntry.findMany({
        where: {
          timePeriod,
          category,
        },
        orderBy: {
          score: 'desc',
        },
        take: limit,
      });

      const result = {
        success: true,
        data: entries.map((entry: LeaderboardEntryData, index: number) => ({
          id: entry.id,
          userId: entry.userId,
          displayName: entry.displayName,
          avatar: entry.avatar,
          score: entry.score,
          rank: index + 1,
          category: entry.category,
          timePeriod: entry.timePeriod,
        })),
      };

      await this.cache.set(cacheK, result, 60);
      this.trackAnalyticsEvent('leaderboard_viewed', 'anonymous', { category });
      return result;
    } catch (error) {
      this.logger.error(
        `getLeaderboard failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getRankings() {
    try {
      const categories = ['all', 'gaming', 'content', 'social', 'predictions'];
      // Single grouped query instead of N+1 per category
      const allEntries = await this.prisma.ranking.findMany({
        where: { category: { in: categories } },
        orderBy: { score: 'desc' },
      });

      const grouped = new Map<string, typeof allEntries>();
      for (const cat of categories) grouped.set(cat, []);
      for (const entry of allEntries) {
        const list = grouped.get(entry.category);
        if (list && list.length < 10) list.push(entry);
      }

      const rankings = categories.map((category) => ({
        category,
        rankings: (grouped.get(category) || []).map((entry: RankingData, index: number) => ({
          id: entry.id,
          userId: entry.userId,
          displayName: entry.displayName,
          avatar: entry.avatar,
          score: entry.score,
          rank: index + 1,
        })),
      }));

      return {
        success: true,
        data: rankings,
      };
    } catch (error) {
      this.logger.error(`getRankings failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getPredictionResults(userId: string, contentId: string) {
    try {
      const predictions = await this.prisma.prediction.findMany({
        where: {
          userId,
          contentId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalPoints = predictions.reduce(
        (sum: number, p: PredictionData) => sum + (p.points || 0),
        0
      );
      const correctCount = predictions.filter((p: PredictionData) => p.isCorrect).length;

      return {
        success: true,
        data: {
          predictions: predictions.map((p: PredictionData) => ({
            id: p.id,
            prediction: p.prediction,
            points: p.points,
            isCorrect: p.isCorrect,
            result: p.result,
            createdAt: p.createdAt.toISOString(),
          })),
          summary: {
            totalPredictions: predictions.length,
            correctPredictions: correctCount,
            accuracy: predictions.length > 0 ? (correctCount / predictions.length) * 100 : 0,
            totalPoints,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `getPredictionResults failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async submitPrediction(userId: string, contentId: string, prediction: string) {
    const existing = await this.prisma.prediction.findFirst({
      where: { userId, contentId },
    });
    if (existing) {
      throw new BadRequestException('Prediction already submitted');
    }

    try {
      const serverPoints = 10;

      const newPrediction = await this.prisma.prediction.create({
        data: {
          userId,
          contentId,
          prediction,
          points: serverPoints,
        },
      });

      await this.cache.invalidate(`engagement:predictions:${userId}`);

      this.logger.log(`Prediction submitted by user ${userId} for content ${contentId}`);
      this.trackAnalyticsEvent('prediction_submitted', userId, { contentId });

      return {
        success: true,
        data: {
          id: newPrediction.id,
          prediction: newPrediction.prediction,
          points: newPrediction.points,
          createdAt: newPrediction.createdAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `submitPrediction failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  /**
   * Internal-only method. Should not be called directly by external consumers.
   * Only used by reward-service and engagement orchestration.
   */
  async updateLeaderboard(
    userId: string,
    displayName: string,
    avatar: string | null,
    score: number,
    category: string,
    timePeriod: string
  ) {
    try {
      const existing = await this.prisma.leaderboardEntry.findUnique({
        where: {
          userId_category_timePeriod: {
            userId,
            category,
            timePeriod,
          },
        },
      });

      if (existing) {
        await this.prisma.leaderboardEntry.update({
          where: { id: existing.id },
          data: {
            score: { increment: score },
            displayName,
            avatar,
          },
        });
      } else {
        await this.prisma.leaderboardEntry.create({
          data: {
            userId,
            displayName,
            avatar,
            score,
            category,
            timePeriod,
          },
        });
      }

      await this.cache.invalidate(`engagement:leaderboard:*`);

      return { success: true, message: 'Leaderboard updated' };
    } catch (error) {
      this.logger.error(
        `updateLeaderboard failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Prediction Management ---

  async deletePrediction(userId: string, predictionId: string) {
    try {
      const prediction = await this.prisma.prediction.findUnique({ where: { id: predictionId } });
      if (!prediction) return { success: false, error: 'Prediction not found' };
      if (prediction.userId !== userId) return { success: false, error: 'Unauthorized' };
      if (prediction.status !== 'active')
        return { success: false, error: 'Only active predictions can be deleted' };

      await this.prisma.prediction.update({
        where: { id: predictionId },
        data: { status: 'cancelled' },
      });

      this.trackAnalyticsEvent('prediction_deleted', userId, { predictionId });
      return { success: true, message: 'Prediction deleted' };
    } catch (error) {
      this.logger.error(`deletePrediction failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async updatePrediction(
    userId: string,
    predictionId: string,
    data: { prediction?: string; category?: string; metadata?: Record<string, unknown> }
  ) {
    try {
      const prediction = await this.prisma.prediction.findUnique({ where: { id: predictionId } });
      if (!prediction) return { success: false, error: 'Prediction not found' };
      if (prediction.userId !== userId) return { success: false, error: 'Unauthorized' };
      if (prediction.status !== 'active')
        return { success: false, error: 'Only active predictions can be updated' };

      const updated = await this.prisma.prediction.update({
        where: { id: predictionId },
        data: {
          ...(data.prediction !== undefined && { prediction: data.prediction }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.metadata !== undefined && {
            metadata: data.metadata as Prisma.InputJsonValue,
          }),
        },
      });

      return { success: true, data: updated };
    } catch (error) {
      this.logger.error(`updatePrediction failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async getPredictionHistory(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [predictions, total] = await Promise.all([
        this.prisma.prediction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.prediction.count({ where: { userId } }),
      ]);

      return {
        success: true,
        data: predictions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error(`getPredictionHistory failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async bulkSubmitPredictions(
    userId: string,
    predictions: Array<{ contentId: string; prediction: string; category?: string }>
  ) {
    try {
      const results = await Promise.all(
        predictions.map((p) => this.submitPrediction(userId, p.contentId, p.prediction))
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return {
        success: true,
        data: { successful, failed, total: predictions.length },
      };
    } catch (error) {
      this.logger.error(`bulkSubmitPredictions failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Ranking Management ---

  async createOrUpdateRanking(
    userId: string,
    displayName: string,
    avatar: string | null,
    category: string,
    score: number
  ) {
    try {
      const existing = await this.prisma.ranking.findUnique({
        where: { userId_category_period: { userId, category, period: 'all' } },
      });

      if (existing) {
        const updated = await this.prisma.ranking.update({
          where: { id: existing.id },
          data: { score: { increment: score }, displayName, avatar },
        });

        // Record history
        await this.prisma.rankingHistory.create({
          data: { userId, category, score: updated.score, rank: updated.rank || 0, period: 'all' },
        });

        return { success: true, data: updated };
      }

      const created = await this.prisma.ranking.create({
        data: { userId, displayName, avatar, category, score, period: 'all' },
      });

      // Record history
      await this.prisma.rankingHistory.create({
        data: { userId, category, score, rank: 0, period: 'all' },
      });

      return { success: true, data: created };
    } catch (error) {
      this.logger.error(`createOrUpdateRanking failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteRanking(userId: string, category: string) {
    try {
      const ranking = await this.prisma.ranking.findUnique({
        where: { userId_category_period: { userId, category, period: 'all' } },
      });

      if (!ranking) return { success: false, error: 'Ranking not found' };

      await this.prisma.ranking.delete({ where: { id: ranking.id } });
      return { success: true, message: 'Ranking deleted' };
    } catch (error) {
      this.logger.error(`deleteRanking failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async getRankingHistory(userId: string, category?: string, limit = 50) {
    try {
      const where: Record<string, unknown> = { userId };
      if (category) where.category = category;

      const history = await this.prisma.rankingHistory.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        take: limit,
      });

      return { success: true, data: history };
    } catch (error) {
      this.logger.error(`getRankingHistory failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Leaderboard Export ---

  async exportLeaderboard(
    timePeriod = 'weekly',
    category = 'all',
    format: 'csv' | 'json' = 'json'
  ) {
    try {
      const entries = await this.prisma.leaderboardEntry.findMany({
        where: { timePeriod, category },
        orderBy: { score: 'desc' },
      });

      if (format === 'csv') {
        const header = 'rank,userId,displayName,score,category,timePeriod\n';
        const rows = entries
          .map(
            (e, i) =>
              `${i + 1},${e.userId},${e.displayName},${e.score},${e.category},${e.timePeriod}`
          )
          .join('\n');
        return { success: true, data: header + rows, format: 'csv' };
      }

      return {
        success: true,
        data: entries.map((e, i) => {
          const { rank: _, ...rest } = e as LeaderboardEntryData;
          return { rank: i + 1, ...rest };
        }),
        format: 'json',
      };
    } catch (error) {
      this.logger.error(`exportLeaderboard failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Batch Ranking Update ---

  async batchUpdateRankings(
    updates: Array<{
      userId: string;
      displayName: string;
      avatar: string | null;
      category: string;
      score: number;
    }>
  ) {
    try {
      const results = await Promise.all(
        updates.map((u) =>
          this.createOrUpdateRanking(u.userId, u.displayName, u.avatar, u.category, u.score)
        )
      );

      const successful = results.filter((r) => r.success).length;
      return { success: true, data: { successful, total: updates.length } };
    } catch (error) {
      this.logger.error(`batchUpdateRankings failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}
