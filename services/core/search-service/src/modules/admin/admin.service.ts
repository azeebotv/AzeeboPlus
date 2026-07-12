import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [totalSearchesToday, uniqueSearchers, topQueries] = await Promise.all([
        this.prisma.userSearch.count({
          where: { createdAt: { gte: todayStart } },
        }),
        this.prisma.userSearch
          .groupBy({
            by: ['userId'],
            where: { createdAt: { gte: todayStart } },
          })
          .then((groups) => groups.length),
        this.prisma.searchQueryLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return ApiResponseWrapper.success({
        totalSearchesToday,
        uniqueSearchers,
        topQueries,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to get search stats: ${error}`);
      return {
        success: false,
        error: { code: 'GET_STATS_FAILED', message: 'Failed to retrieve search stats' },
      };
    }
  }

  async getQueries(options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.startDate || options?.endDate) {
        const lastSearchAt: Record<string, Date> = {};
        if (options?.startDate) lastSearchAt.gte = new Date(options.startDate);
        if (options?.endDate) lastSearchAt.lte = new Date(options.endDate);
        where.lastSearchAt = lastSearchAt;
      }

      const [queries, total] = await Promise.all([
        this.prisma.searchQueryLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.searchQueryLog.count({ where }),
      ]);

      return ApiResponseWrapper.paginated(queries, page, limit, total);
    } catch (error: unknown) {
      this.logger.error(`Failed to get search queries: ${error}`);
      return {
        success: false,
        error: { code: 'GET_QUERIES_FAILED', message: 'Failed to retrieve search queries' },
      };
    }
  }
}
