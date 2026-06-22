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

const ALLOWED_EVENT_NAMES = [
  'screen_view',
  'content_impression',
  'content_click',
  'play_start',
  'play_complete',
  'login',
  'login_success',
  'login_failed',
  'signup',
  'signup_completed',
  'vote_submitted',
  'vote_initiated',
  'supervote_submitted',
  'prediction_placed',
  'prediction_submitted',
  'prediction_correct',
  'payment_success',
  'payment_failed',
  'payment_initiated',
  'refund_initiated',
  'refund_completed',
  'reward_earned',
  'reward_redeemed',
  'creator_follow',
  'creator_followed',
  'creator_tip_sent',
  'creator_tipped',
  'subscription_created',
  'subscription_cancelled',
  'game_started',
  'game_completed',
  'challenge_created',
  'challenge_participated',
  'daily_challenge_submitted',
  'contest_entered',
  'share',
  'share_initiated',
  'notification_received',
  'notification_clicked',
  'notification_opened',
  'content_view',
  'content_uploaded',
  'search_query',
  'filter_applied',
  'video_buffering',
  'error_occurred',
  'signup_started',
  'onboarding_completed',
  'creator_onboarded',
  'channel_created',
  'payout_requested',
  'premium_extra_purchased',
  'tip_received',
  'verification_approved',
  'verification_submitted',
];

const REQUIRED_METADATA_FIELDS = ['session_id', 'platform', 'timestamp'];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateEventEnvelope(event: Event): { valid: boolean; error?: string } {
    if (!event.type || typeof event.type !== 'string') {
      return { valid: false, error: 'Event type is required and must be a string' };
    }

    if (!ALLOWED_EVENT_NAMES.includes(event.type) && !event.type.startsWith('custom_')) {
      return { valid: false, error: `Invalid event name: ${event.type}` };
    }

    if (event.metadata) {
      if (typeof event.metadata !== 'object') {
        return { valid: false, error: 'Metadata must be an object' };
      }

      for (const field of REQUIRED_METADATA_FIELDS) {
        if (!(field in event.metadata)) {
          return { valid: false, error: `Missing required metadata field: ${field}` };
        }
      }

      if (event.metadata.timestamp && typeof event.metadata.timestamp !== 'string') {
        return { valid: false, error: 'Timestamp must be an ISO string' };
      }

      if (
        event.metadata.platform &&
        !['mobile', 'web', 'admin'].includes(event.metadata.platform as string)
      ) {
        return { valid: false, error: 'Invalid platform value' };
      }
    }

    return { valid: true };
  }

  async ingestEvents(events: Event[]): Promise<AnalyticsResponse> {
    if (!events || events.length === 0) {
      throw new BadRequestException('No events provided');
    }

    if (events.length > 100) {
      throw new BadRequestException('Maximum 100 events per batch');
    }

    const validationErrors: string[] = [];
    const validEvents: Event[] = [];

    for (let i = 0; i < events.length; i++) {
      const validation = this.validateEventEnvelope(events[i]);
      if (!validation.valid) {
        validationErrors.push(`Event[${i}]: ${validation.error}`);
      } else {
        validEvents.push(events[i]);
      }
    }

    if (validationErrors.length > 0 && validEvents.length === 0) {
      throw new BadRequestException(`All events failed validation: ${validationErrors.join('; ')}`);
    }

    const insertedEvents = await this.prisma.$transaction(
      validEvents.map((event) =>
        this.prisma.productEvent.create({
          data: {
            eventName: event.type,
            userId: event.userId,
            sessionId: event.sessionId,
            metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          },
        })
      )
    );

    return {
      success: true,
      data: {
        ingested: insertedEvents.length,
        rejected: validationErrors.length,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        events: insertedEvents,
      },
    };
  }

  async getUserSummary(userId: string): Promise<AnalyticsResponse> {
    const totalViews = await this.prisma.productEvent.count({
      where: { userId, eventName: 'content_view' },
    });

    const totalWatchTime = await this.prisma.productEvent.count({
      where: { userId, eventName: 'play_complete' },
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
      where: { eventName: 'content_view' },
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
        eventName: 'content_view',
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
    const funnelDefinitions = {
      signup: {
        steps: ['screen_view', 'signup_started', 'signup_completed'],
        conversionThreshold: 3,
      },
      payment: {
        steps: ['screen_view', 'payment_success'],
        conversionThreshold: 2,
      },
      content_engagement: {
        steps: ['screen_view', 'content_impression', 'play_start', 'play_complete'],
        conversionThreshold: 4,
      },
      creator_journey: {
        steps: ['screen_view', 'creator_follow', 'creator_tip_sent', 'subscription_created'],
        conversionThreshold: 4,
      },
      game_engagement: {
        steps: ['screen_view', 'game_started', 'game_completed'],
        conversionThreshold: 3,
      },
    };

    if (name && !funnelDefinitions[name as keyof typeof funnelDefinitions]) {
      throw new BadRequestException(`Unknown funnel: ${name}`);
    }

    const selectedFunnels = name
      ? { [name]: funnelDefinitions[name as keyof typeof funnelDefinitions] }
      : funnelDefinitions;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const funnelResults: Record<string, { step: string; users: number; conversionRate: number }[]> =
      {};

    for (const [funnelName, config] of Object.entries(selectedFunnels)) {
      const steps = config.steps;
      const stepMetrics: { step: string; users: number; conversionRate: number }[] = [];

      for (let i = 0; i < steps.length; i++) {
        const stepEvents = await this.prisma.productEvent.groupBy({
          by: ['userId'],
          where: {
            eventName: steps[i],
            timestamp: { gte: thirtyDaysAgo },
          },
          _count: true,
        });

        const usersAtStep = stepEvents.length;
        const prevUsers = i === 0 ? usersAtStep : stepMetrics[i - 1].users;
        const conversionRate = prevUsers > 0 ? (usersAtStep / prevUsers) * 100 : 0;

        stepMetrics.push({
          step: steps[i],
          users: usersAtStep,
          conversionRate: Math.round(conversionRate * 100) / 100,
        });
      }

      funnelResults[funnelName] = stepMetrics;
    }

    return {
      success: true,
      data: { funnels: funnelResults },
    };
  }

  async getCohorts(period: 'day' | 'week' | 'month' = 'week'): Promise<AnalyticsResponse> {
    const truncUnit = period === 'day' ? 'day' : period === 'week' ? 'week' : 'month';
    const periodsBack = period === 'day' ? 30 : period === 'week' ? 12 : 6;

    const cohorts = await this.prisma.$queryRaw`
      WITH cohort_data AS (
        SELECT 
          u.id as user_id,
          DATE_TRUNC(${truncUnit}, u."createdAt") as cohort_date,
          COUNT(pe.id) as event_count,
          MAX(EXTRACT(EPOCH FROM (NOW() - pe.timestamp))) as recency_seconds
        FROM "users" u
        LEFT JOIN "product_events" pe ON pe."userId" = u.id
        GROUP BY u.id, DATE_TRUNC(${truncUnit}, u."createdAt")
      )
      SELECT 
        cohort_date,
        COUNT(*) as total_users,
        AVG(event_count) as avg_events,
        AVG(recency_seconds) as avg_recency_days
      FROM cohort_data
      GROUP BY cohort_date
      ORDER BY cohort_date DESC
      LIMIT ${periodsBack}
    `;

    return {
      success: true,
      data: {
        cohorts: (cohorts as Record<string, unknown>[]).map((c: Record<string, unknown>) => ({
          cohort_date: c.cohort_date,
          total_users: c.total_users,
          avg_events: c.avg_events,
          avg_recency_days: c.avg_recency_days
            ? Math.round(Number(c.avg_recency_days) / 86400)
            : null,
        })),
        period,
      },
    };
  }

  async trackEvent(
    type: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    return this.prisma.productEvent.create({
      data: {
        eventName: type,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        timestamp: new Date(),
      },
    });
  }

  async trackBatch(
    events: Array<{ type: string; userId?: string; metadata?: Record<string, unknown> }>
  ): Promise<{ success: boolean }> {
    await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.productEvent.create({
          data: {
            eventName: event.type,
            userId: event.userId,
            metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
            timestamp: new Date(),
          },
        })
      )
    );

    return { success: true };
  }

  async getDailyStats(date?: Date): Promise<AnalyticsResponse> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const totalUsers = await this.prisma.user.count();

    const dailyViews = await this.prisma.productEvent.count({
      where: {
        eventName: 'content_view',
        timestamp: { gte: startOfDay, lt: endOfDay },
      },
    });

    const dailyWatchTime = await this.prisma.productEvent.count({
      where: {
        eventName: 'play_complete',
        timestamp: { gte: startOfDay, lt: endOfDay },
      },
    });

    const activeUsers = await this.prisma.productEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startOfDay, lt: endOfDay },
      },
      _count: true,
    });

    return {
      success: true,
      data: {
        date: targetDate,
        totalUsers,
        totalViews: dailyViews,
        totalWatchTime: dailyWatchTime,
        activeUsers: activeUsers.length,
      },
    };
  }

  async getUniverseKpis(universeName: string): Promise<AnalyticsResponse> {
    const universe = await this.prisma.universe.findUnique({
      where: { name: universeName },
    });

    if (!universe) {
      throw new BadRequestException(`Unknown universe: ${universeName}`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contentCount = await this.prisma.contentItem.count({
      where: { universeId: universe.id },
    });

    const newContent = await this.prisma.contentItem.count({
      where: { universeId: universe.id, createdAt: { gte: thirtyDaysAgo } },
    });

    const views = await this.prisma.productEvent.count({
      where: {
        eventName: 'content_view',
        metadata: { path: ['universe'], equals: universeName },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const plays = await this.prisma.productEvent.count({
      where: {
        eventName: 'play_start',
        metadata: { path: ['universe'], equals: universeName },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const completions = await this.prisma.productEvent.count({
      where: {
        eventName: 'play_complete',
        metadata: { path: ['universe'], equals: universeName },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const uniqueUsers = await this.prisma.productEvent.groupBy({
      by: ['userId'],
      where: {
        metadata: { path: ['universe'], equals: universeName },
        timestamp: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    const engagementRate = plays > 0 ? Math.round((completions / plays) * 10000) / 100 : 0;

    return {
      success: true,
      data: {
        universe: universe.displayName,
        universeId: universe.id,
        contentCount,
        newContent,
        totalViews: views,
        totalPlays: plays,
        completions,
        engagementRate,
        uniqueUsers: uniqueUsers.length,
        period: '30d',
      },
    };
  }

  async getAllUniverseKpis(): Promise<AnalyticsResponse> {
    const universes = await this.prisma.universe.findMany();
    const results = await Promise.all(universes.map((u) => this.getUniverseKpis(u.name)));

    const aggregated = results.reduce(
      (
        acc: {
          totalContent: number;
          totalViews: number;
          totalPlays: number;
          totalCompletions: number;
          totalUniqueUsers: number;
        },
        result: AnalyticsResponse
      ) => {
        if (result?.data) {
          acc.totalContent +=
            ((result.data as Record<string, unknown>).contentCount as number) || 0;
          acc.totalViews += ((result.data as Record<string, unknown>).totalViews as number) || 0;
          acc.totalPlays += ((result.data as Record<string, unknown>).totalPlays as number) || 0;
          acc.totalCompletions +=
            ((result.data as Record<string, unknown>).completions as number) || 0;
          acc.totalUniqueUsers +=
            ((result.data as Record<string, unknown>).uniqueUsers as number) || 0;
        }
        return acc;
      },
      {
        totalContent: 0,
        totalViews: 0,
        totalPlays: 0,
        totalCompletions: 0,
        totalUniqueUsers: 0,
      }
    );

    return {
      success: true,
      data: {
        universes: results.map((r: AnalyticsResponse) => r.data).filter(Boolean),
        aggregated,
      },
    };
  }

  async getRetentionMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: periodAgo } },
    });

    const returningUsers = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT pe."userId") as count
      FROM "product_events" pe
      JOIN "users" u ON pe."userId" = u.id
      WHERE u."createdAt" >= ${periodAgo}
        AND pe."timestamp" >= ${periodAgo}
        AND pe."timestamp" < NOW()
    `;

    const returnCount =
      Array.isArray(returningUsers) && returningUsers.length > 0
        ? Number((returningUsers[0] as Record<string, unknown>).count || 0)
        : 0;
    const retentionRate = newUsers > 0 ? Math.round((returnCount / newUsers) * 10000) / 100 : 0;

    return {
      success: true,
      data: {
        period,
        newUsers,
        returningUsers: returnCount,
        retentionRate,
      },
    };
  }

  async getRevenueMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    const payments = await this.prisma.paymentIntent.count({
      where: { status: 'completed', createdAt: { gte: periodAgo } },
    });

    const totalRevenue = await this.prisma.paymentIntent.aggregate({
      _sum: { amount: true },
      where: { status: 'completed', createdAt: { gte: periodAgo } },
    });

    const avgOrderValue =
      payments > 0 ? Math.round(Number(totalRevenue._sum.amount || 0) / payments) : 0;

    // Subscription model not available in analytics-service schema
    const subscriptions = 0;

    return {
      success: true,
      data: {
        period,
        totalPayments: payments,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        avgOrderValue,
        newSubscriptions: subscriptions,
      },
    };
  }

  async getEngagementMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    const totalViews = await this.prisma.productEvent.count({
      where: { eventName: 'content_view', timestamp: { gte: periodAgo } },
    });

    const totalPlays = await this.prisma.productEvent.count({
      where: { eventName: 'play_start', timestamp: { gte: periodAgo } },
    });

    const totalCompletions = await this.prisma.productEvent.count({
      where: { eventName: 'play_complete', timestamp: { gte: periodAgo } },
    });

    const activeUsers = await this.prisma.productEvent.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: periodAgo } },
      _count: true,
    });

    const avgSessionDuration = await this.prisma.$queryRaw`
      SELECT AVG(session_duration) as avg_duration
      FROM (
        SELECT "sessionId", EXTRACT(EPOCH FROM (MAX("timestamp") - MIN("timestamp"))) as session_duration
        FROM "product_events"
        WHERE "timestamp" >= ${periodAgo}
          AND "sessionId" IS NOT NULL
        GROUP BY "sessionId"
      ) as sessions
    `;

    const avgDuration =
      Array.isArray(avgSessionDuration) && avgSessionDuration.length > 0
        ? Math.round(
            Number((avgSessionDuration[0] as Record<string, unknown>).avg_duration || 0) / 60
          )
        : 0;

    const engagementRate =
      totalPlays > 0 ? Math.round((totalCompletions / totalPlays) * 10000) / 100 : 0;

    return {
      success: true,
      data: {
        period,
        totalViews,
        totalPlays,
        totalCompletions,
        activeUsers: activeUsers.length,
        avgSessionDurationMinutes: avgDuration,
        engagementRate,
      },
    };
  }

  async getDetailedDashboard(): Promise<AnalyticsResponse> {
    const [dailyStats, weeklyRetention, monthlyRevenue, engagement, universeKpis] =
      await Promise.all([
        this.getDailyStats(),
        this.getRetentionMetrics('7d'),
        this.getRevenueMetrics('30d'),
        this.getEngagementMetrics('30d'),
        this.getAllUniverseKpis(),
      ]);

    return {
      success: true,
      data: {
        today: dailyStats.data,
        retention: weeklyRetention.data,
        revenue: monthlyRevenue.data,
        engagement: engagement.data,
        universes: universeKpis.data,
      },
    };
  }

  async getKpis(period?: '7d' | '30d' | '90d'): Promise<AnalyticsResponse> {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [totalEvents, uniqueUsers, totalSessions, avgEventsPerUser] = await Promise.all([
      this.prisma.productEvent.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.productEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate }, userId: { not: null } },
        _count: { id: true },
      }),
      this.prisma.productEvent.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: startDate }, sessionId: { not: null } },
        _count: { id: true },
      }),
      this.prisma.productEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate }, userId: { not: null } },
        _count: { id: true },
      }),
    ]);

    const topEvents = await this.prisma.productEvent.groupBy({
      by: ['eventName'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      success: true,
      data: {
        period,
        totalEvents,
        uniqueUsers: uniqueUsers.length,
        totalSessions: totalSessions.length,
        avgEventsPerUser:
          uniqueUsers.length > 0 ? Math.round((totalEvents / uniqueUsers.length) * 100) / 100 : 0,
        topEvents: topEvents.map((e: { eventName: string; _count: { id: number } }) => ({
          event: e.eventName,
          count: e._count.id,
        })),
      },
    };
  }

  async getRealtime(): Promise<AnalyticsResponse> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Use ProductEvent instead of analyticsEvent (model doesn't exist in schema)
    const [eventsLast5Min, eventsLastHour, activeUsersLast5Min, eventsByTypeLastHour] =
      await Promise.all([
        this.prisma.productEvent.count({ where: { createdAt: { gte: fiveMinutesAgo } } }),
        this.prisma.productEvent.count({ where: { createdAt: { gte: oneHourAgo } } }),
        this.prisma.productEvent.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: fiveMinutesAgo }, userId: { not: null } },
          _count: { id: true },
        }),
        this.prisma.productEvent.groupBy({
          by: ['eventName'],
          where: { createdAt: { gte: oneHourAgo } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ]);

    const recentEvents = await this.prisma.productEvent.findMany({
      where: { createdAt: { gte: fiveMinutesAgo } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { eventName: true, userId: true, createdAt: true },
    });

    return {
      success: true,
      data: {
        eventsLast5Minutes: eventsLast5Min,
        eventsLastHour: eventsLastHour,
        activeUsersLast5Minutes: activeUsersLast5Min.length,
        topEventsLastHour: eventsByTypeLastHour.map(
          (e: { eventName: string; _count: { id: number } }) => ({
            event: e.eventName,
            count: e._count.id,
          })
        ),
        recentEvents,
      },
    };
  }
}
