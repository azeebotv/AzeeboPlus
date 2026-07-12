import {Inject,  Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [totalRequests, recommendationsToday] = await Promise.all([
        this.prisma.recommendationLog.count(),
        this.prisma.recommendationLog.count({
          where: { timestamp: { gte: todayStart } },
        }),
      ]);

      return ApiResponseWrapper.success({
        totalRequests,
        recommendationsToday,
      });
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getModels() {
    // Models can be configured via RECOMMENDATION_MODELS env var (JSON array)
    const envModels = process.env.RECOMMENDATION_MODELS;
    if (envModels) {
      try {
        const parsed = JSON.parse(envModels) as Array<{ id: string; name: string; description: string; active: boolean }>;
        return ApiResponseWrapper.success(parsed);
      } catch {
        // Fall back to defaults if JSON is invalid
      }
    }

    const models = [
      {
        id: 'content-based',
        name: 'Content-Based Filtering',
        description: 'Recommends items similar to what the user has interacted with',
        active: true,
      },
      {
        id: 'collaborative',
        name: 'Collaborative Filtering',
        description: 'Recommends items based on similar user behavior',
        active: true,
      },
      {
        id: 'cross-universe',
        name: 'Cross-Universe Discovery',
        description: 'Recommends content across different universes',
        active: true,
      },
      {
        id: 'trending',
        name: 'Trending Content',
        description: 'Recommends currently popular content',
        active: true,
      },
      {
        id: 'engagement-based',
        name: 'Engagement-Based',
        description: 'Recommends based on predicted user engagement',
        active: false,
      },
    ];

    return ApiResponseWrapper.success(models);
  }
}
