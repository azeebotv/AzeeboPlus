import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const eventsProcessed = await this.prisma.productEvent.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventsToday = await this.prisma.productEvent.count({
      where: { createdAt: { gte: today } },
    });

    const avgSizeResult = await this.prisma.$queryRaw<
      { avg: number | null }[]
    >`
      SELECT AVG(LENGTH(COALESCE("metadata"::text, ''))) as avg
      FROM "product_events"
    `;
    const avgMetadataSize = Array.isArray(avgSizeResult) && avgSizeResult.length > 0
      ? Number(avgSizeResult[0].avg || 0)
      : 0;

    const uniqueUsers = await this.prisma.productEvent.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { id: true },
    });

    const eventNameBreakdown = await this.prisma.productEvent.groupBy({
      by: ['eventName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      eventsProcessed,
      eventsToday,
      estimatedStorageBytes: Math.round(eventsProcessed * (avgMetadataSize + 200)),
      uniqueUsers: uniqueUsers.length,
      topEvents: eventNameBreakdown.map((e) => ({
        eventName: e.eventName,
        count: e._count.id,
      })),
    };
  }

  async getEvents(options?: {
    page?: number;
    limit?: number;
    eventName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.eventName) {
      where.eventName = options.eventName;
    }

    const dateFilter: Record<string, Date> = {};
    if (options?.startDate) {
      dateFilter.gte = new Date(options.startDate);
    }
    if (options?.endDate) {
      dateFilter.lte = new Date(options.endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const [events, total] = await Promise.all([
      this.prisma.productEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      this.prisma.productEvent.count({ where }),
    ]);

    return {
      events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventNames() {
    const results = await this.prisma.productEvent.groupBy({
      by: ['eventName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return results.map((r) => ({
      name: r.eventName,
      count: r._count.id,
    }));
  }
}
