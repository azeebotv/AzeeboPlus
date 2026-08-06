import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalLeaderboardEntries, totalPredictions, totalRankings] = await Promise.all([
        this.prisma.leaderboardEntry.count(),
        this.prisma.prediction.count(),
        this.prisma.ranking.count(),
      ]);

      return ApiResponseWrapper.success({
        totalLeaderboardEntries,
        totalPredictions,
        totalRankings,
      });
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getLeaderboard(options?: { page?: number; limit?: number; category?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.category) where.category = options.category;

      const [entries, total] = await Promise.all([
        this.prisma.leaderboardEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: { score: 'desc' },
        }),
        this.prisma.leaderboardEntry.count({ where }),
      ]);

      return ApiResponseWrapper.paginated(entries, page, limit, total);
    } catch (error) {
      this.logger.error(
        `getLeaderboard failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getPredictions(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [predictions, total] = await Promise.all([
        this.prisma.prediction.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.prediction.count(),
      ]);

      return ApiResponseWrapper.paginated(predictions, page, limit, total);
    } catch (error) {
      this.logger.error(
        `getPredictions failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async resolvePrediction(predictionId: string, outcome: string) {
    try {
      const existing = await this.prisma.prediction.findUnique({
        where: { id: predictionId },
      });

      if (!existing) {
        throw new NotFoundException('Prediction not found');
      }

      const isCorrect = existing.prediction.toLowerCase() === outcome.toLowerCase();

      const updated = await this.prisma.prediction.update({
        where: { id: predictionId },
        data: {
          isCorrect,
          result: outcome,
          status: 'resolved',
        },
      });

      return ApiResponseWrapper.success(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `resolvePrediction failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async exportLeaderboard(timePeriod: string, category: string, format: 'csv' | 'json') {
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
        return ApiResponseWrapper.success({ data: header + rows, format: 'csv' });
      }

      return ApiResponseWrapper.success({
        data: entries.map((e, i) => ({
          rank: i + 1,
          id: e.id,
          userId: e.userId,
          displayName: e.displayName,
          avatar: e.avatar,
          score: e.score,
          category: e.category,
          timePeriod: e.timePeriod,
        })),
        format: 'json',
      });
    } catch (error) {
      this.logger.error(`exportLeaderboard failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async deleteLeaderboardEntry(id: string) {
    try {
      const entry = await this.prisma.leaderboardEntry.findUnique({ where: { id } });
      if (!entry) throw new NotFoundException('Leaderboard entry not found');
      await this.prisma.leaderboardEntry.delete({ where: { id } });
      return ApiResponseWrapper.success({ message: 'Leaderboard entry deleted' });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`deleteLeaderboardEntry failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async exportPredictions(status: string | undefined, format: 'csv' | 'json') {
    try {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const predictions = await this.prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (format === 'csv') {
        const header =
          'id,userId,contentId,prediction,category,status,points,isCorrect,createdAt\n';
        const rows = predictions
          .map(
            (p) =>
              `${p.id},${p.userId},${p.contentId},${p.prediction},${p.category || ''},${p.status},${p.points},${p.isCorrect ?? ''},${p.createdAt.toISOString()}`
          )
          .join('\n');
        return ApiResponseWrapper.success({ data: header + rows, format: 'csv' });
      }

      return ApiResponseWrapper.success({ data: predictions, format: 'json' });
    } catch (error) {
      this.logger.error(`exportPredictions failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getRankings(options?: { page?: number; limit?: number; category?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.category) where.category = options.category;

      const [rankings, total] = await Promise.all([
        this.prisma.ranking.findMany({ where, skip, take: limit, orderBy: { score: 'desc' } }),
        this.prisma.ranking.count({ where }),
      ]);

      return ApiResponseWrapper.paginated(rankings, page, limit, total);
    } catch (error) {
      this.logger.error(`getRankings failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getRankingHistory(userId?: string, category?: string, limit = 50) {
    try {
      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (category) where.category = category;

      const history = await this.prisma.rankingHistory.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        take: limit,
      });

      return ApiResponseWrapper.success(history);
    } catch (error) {
      this.logger.error(`getRankingHistory failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async deleteRanking(id: string) {
    try {
      const ranking = await this.prisma.ranking.findUnique({ where: { id } });
      if (!ranking) throw new NotFoundException('Ranking not found');
      await this.prisma.ranking.delete({ where: { id } });
      return ApiResponseWrapper.success({ message: 'Ranking deleted' });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`deleteRanking failed: ${(error as Error).message}`);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }
}
