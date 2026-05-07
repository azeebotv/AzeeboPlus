import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AnalyticsResponse } from './interfaces/analytics-response.interface';

interface Event {
  type: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestEvents(events: Event[]): Promise<AnalyticsResponse> {
    if (!events || events.length === 0) {
      throw new BadRequestException('No events provided');
    }

    for (const event of events) {
      if (!event.type) {
        throw new BadRequestException('Event type is required');
      }
    }

    const insertedEvents = await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.productEvent.create({
          data: {
            type: event.type,
            userId: event.userId,
            sessionId: event.sessionId,
            metadata: (event.metadata || {}) as Record<string, string | number | boolean | null>,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          },
        })
      )
    );

    return {
      success: true,
      data: {
        ingested: insertedEvents.length,
        events: insertedEvents,
      },
    };
  }

  async getUserSummary(userId: string): Promise<AnalyticsResponse> {
    const totalViews = await this.prisma.productEvent.count({
      where: { userId, type: 'content_view' },
    });

    const totalWatchTime = await this.prisma.productEvent.count({
      where: { userId, type: 'play_complete' },
    });

    const recentActivity = await this.prisma.productEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: {
        userId,
        totalViews,
        totalWatchTime,
        recentActivity,
      },
    };
  }

  async getDashboard(): Promise<AnalyticsResponse> {
    const totalUsers = await this.prisma.user.count();
    const totalContent = await this.prisma.contentItem.count();
    const totalViews = await this.prisma.productEvent.count({
      where: { type: 'content_view' },
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dailyActiveUsers = await this.prisma.productEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: yesterday },
      },
      _count: true,
    });

    const dailyViews = await this.prisma.productEvent.count({
      where: {
        type: 'content_view',
        timestamp: { gte: yesterday },
      },
    });

    return {
      success: true,
      data: {
        totalUsers,
        totalContent,
        totalViews,
        dailyActiveUsers: dailyActiveUsers.length,
        dailyViews,
      },
    };
  }

  async getFunnels(name?: string): Promise<AnalyticsResponse> {
    const funnels = {
      signup: {
        steps: ['signup_viewed', 'signup_submitted', 'signup_completed'],
      },
      payment: {
        steps: ['payment_viewed', 'payment_submitted', 'payment_completed'],
      },
      content: {
        steps: ['content_viewed', 'play_start', 'play_complete'],
      },
    };

    if (name && !funnels[name as keyof typeof funnels]) {
      throw new BadRequestException(`Unknown funnel: ${name}`);
    }

    const selectedFunnels = name ? { [name]: funnels[name as keyof typeof funnels] } : funnels;

    return {
      success: true,
      data: selectedFunnels,
    };
  }

  async getCohorts(): Promise<AnalyticsResponse> {
    const cohorts = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', "createdAt") as week,
        COUNT(*) as users,
        AVG(EXTRACT(EPOCH FROM (NOW() - "createdAt"))) as avg_age_seconds
      FROM "users"
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY week DESC
      LIMIT 12
    `;

    return {
      success: true,
      data: { cohorts: cohorts as unknown[] },
    };
  }

  async trackEvent(
    type: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    return this.prisma.productEvent.create({
      data: {
        type,
        userId,
        metadata: (metadata || {}) as Record<string, string | number | boolean | null>,
        timestamp: new Date(),
      },
    });
  }

  async getUniverseKpis(universeName: string): Promise<AnalyticsResponse> {
    const universe = await this.prisma.universe.findUnique({
      where: { name: universeName },
    });

    if (!universe) {
      throw new BadRequestException(`Unknown universe: ${universeName}`);
    }

    const contentCount = await this.prisma.contentItem.count({
      where: { universeId: universe.id },
    });

    const views = await this.prisma.productEvent.count({
      where: {
        type: 'content_view',
        metadata: { path: ['universe'], equals: universeName },
      },
    });

    return {
      success: true,
      data: {
        universe: universe.displayName,
        contentCount,
        views,
      },
    };
  }
}
