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

  async getLeaderboard(options?: {
    page?: number;
    limit?: number;
    category?: string;
  }) {
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
}
