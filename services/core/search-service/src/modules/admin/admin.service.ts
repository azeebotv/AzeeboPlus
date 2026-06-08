import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalSearchesToday, uniqueSearchers, topQueries] = await Promise.all([
      this.prisma.userSearch.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.userSearch.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: todayStart } },
      }).then((groups) => groups.length),
      this.prisma.searchQueryLog.findMany({
        orderBy: { count: 'desc' },
        take: 10,
      }),
    ]);

    return ApiResponseWrapper.success({
      totalSearchesToday,
      uniqueSearchers,
      topQueries,
    });
  }

  async getQueries(options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
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
        orderBy: { lastSearchAt: 'desc' },
      }),
      this.prisma.searchQueryLog.count({ where }),
    ]);

    return ApiResponseWrapper.paginated(queries, page, limit, total);
  }
}
