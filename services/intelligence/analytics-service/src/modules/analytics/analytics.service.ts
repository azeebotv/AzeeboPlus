import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { AnalyticsResponse } from './interfaces/analytics-response.interface.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { FeatureFlagService, analyticsFlags } from '@azeebo/feature-flags';
import axios from 'axios';

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
  'payment_provider_failover',
  'refund_initiated',
  'refund_completed',
  'reward_earned',
  'reward_redeemed',
  'media_upload',
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
  'content_search_correction_shown',
  'content_search_correction_accepted',
  'flag_stale_enabled',
];

const REQUIRED_METADATA_FIELDS = ['session_id', 'platform', 'timestamp'];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly userServiceUrl: string;
  private readonly contentServiceUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.userServiceUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service:3001'
    );
    this.contentServiceUrl = this.configService.get<string>(
      'CONTENT_SERVICE_URL',
      'http://content-service:3004'
    );
  }

  /**
   * Resolves the effective sampling rate (0–100) from `analytics_sampling_rate`.
   * 100 (default) means every event is kept; lower values drop events.
   */
  private async getSamplingRate(): Promise<number> {
    const value = await this.featureFlagService.getValue(analyticsFlags.samplingRate);
    if (typeof value !== 'number' || Number.isNaN(value)) return 100;
    return Math.min(100, Math.max(0, Math.round(value)));
  }

  /** Deterministic per-entity sampling so a user/entity is fully kept or fully dropped. */
  private isSampled(entity: string | undefined, rate: number): boolean {
    if (rate >= 100) return true;
    if (rate <= 0) return false;
    const seed = entity ?? 'anonymous';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash % 100 < rate;
  }

  /**
   * Client-side sampling config for the analytics-sdk: when the
   * `analytics_client_sampling` flag is on, clients pre-sample events using the
   * same rate before shipping them, cutting server-side dropped traffic.
   */
  async getClientSamplingConfig(): Promise<{
    enabled: boolean;
    samplingRate: number;
  }> {
    const enabled = await this.featureFlagService.isEnabled(analyticsFlags.clientSampling);
    const samplingRate = await this.getSamplingRate();
    return { enabled, samplingRate };
  }

  /** Shared ingest write path: batch (createMany) or per-event writes. */
  private async writeEvents(rows: Array<Record<string, unknown>>): Promise<void> {
    if (rows.length === 0) return; // everything was sampled out
    const batchIngest = await this.featureFlagService.isEnabled(analyticsFlags.batchIngest);
    if (batchIngest) {
      await this.prisma.productEvent.createMany({
        data: rows as Prisma.ProductEventCreateManyInput[],
      });
    } else {
      for (const row of rows) {
        await this.prisma.productEvent.create({ data: row as Prisma.ProductEventCreateInput });
      }
    }
  }

  private async getUserCount(): Promise<number> {
    try {
      const res = await axios.get<{ data?: { total?: number }; total?: number }>(
        `${this.userServiceUrl}/users`,
        {
          params: { limit: 1 },
          timeout: 5000,
          headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
        }
      );
      return res.data?.total ?? res.data?.data?.total ?? 0;
    } catch {
      return 0;
    }
  }

  private async getContentCount(): Promise<number> {
    try {
      const res = await axios.get<{ data?: { total?: number }; total?: number }>(
        `${this.contentServiceUrl}/content`,
        {
          params: { limit: 1 },
          timeout: 5000,
          headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
        }
      );
      return res.data?.total ?? res.data?.data?.total ?? 0;
    } catch {
      return 0;
    }
  }

  private async getSubscriptionCount(userId: string): Promise<number> {
    try {
      const baseUrl = this.configService.get<string>('SUBSCRIPTION_SERVICE_URL');
      if (!baseUrl) return 0;
      const params: Record<string, string | number> = { limit: 1 };
      if (userId) {
        params.userId = userId;
      }
      const res = await axios.get<{ pagination?: { total?: number } }>(
        `${baseUrl}/v1/subscription/history`,
        {
          params,
          timeout: 5000,
          headers: {
            'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', ''),
          },
        }
      );
      return res.data?.pagination?.total ?? 0;
    } catch {
      return 0;
    }
  }

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

    try {
      const samplingRate = await this.getSamplingRate();
      const sampled = validEvents.filter((event) =>
        this.isSampled(event.userId ?? event.sessionId, samplingRate)
      );

      await this.writeEvents(
        sampled.map((event) => ({
          eventName: event.type,
          userId: event.userId,
          sessionId: event.sessionId,
          metadata: (event.metadata || undefined) as Prisma.InputJsonValue,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        }))
      );

      await this.cache.invalidate('analytics:*');

      return {
        success: true,
        data: {
          ingested: sampled.length,
          sampled: validEvents.length - sampled.length,
          rejected: validationErrors.length,
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`ingestEvents failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getUserSummary(userId: string): Promise<AnalyticsResponse> {
    try {
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
    } catch (error) {
      this.logger.error(
        `getUserSummary failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getDashboard(): Promise<AnalyticsResponse> {
    try {
      const cacheK = cacheKey('analytics', 'reports:dashboard');
      const cached = await this.cache.get<AnalyticsResponse>(cacheK);
      if (cached) return cached;

      const totalUsers = await this.getUserCount();
      const totalContent = await this.getContentCount();
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

      const result: AnalyticsResponse = {
        success: true,
        data: {
          totalUsers,
          totalContent,
          totalViews,
          dailyActiveUsers: dailyActiveUsers.length,
          dailyViews,
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getDashboard failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getFunnels(name?: string): Promise<AnalyticsResponse> {
    // Cache funnel results for 5 minutes to avoid sequential queries
    const cacheK = cacheKey('analytics', `funnels:${name || 'all'}`);
    const cached = await this.cache.get<AnalyticsResponse>(cacheK);
    if (cached) return cached;

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

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const funnelResults: Record<
        string,
        { step: string; users: number; conversionRate: number }[]
      > = {};

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

      const result = {
        success: true,
        data: { funnels: funnelResults },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getFunnels failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getCohorts(period: 'day' | 'week' | 'month' = 'week'): Promise<AnalyticsResponse> {
    const truncUnit = period === 'day' ? 'day' : period === 'week' ? 'week' : 'month';
    const periodsBack = period === 'day' ? 30 : period === 'week' ? 12 : 6;

    try {
      const cohorts = await this.prisma.$queryRaw`
        WITH cohort_data AS (
          SELECT 
            u.id as user_id,
            DATE_TRUNC(${truncUnit}::text, u."createdAt") as cohort_date,
            COUNT(pe.id) as event_count,
            MAX(EXTRACT(EPOCH FROM (NOW() - pe.timestamp))) as recency_seconds
          FROM "users" u
          LEFT JOIN "product_events" pe ON pe."userId" = u.id
          GROUP BY u.id, DATE_TRUNC(${truncUnit}::text, u."createdAt")
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
    } catch (error) {
      this.logger.error(`getCohorts failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async trackEvent(
    type: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    if (!ALLOWED_EVENT_NAMES.includes(type) && !type.startsWith('custom_')) {
      throw new BadRequestException(`Invalid event name: ${type}`);
    }
    try {
      // Sampling: drop the event before write when the effective rate excludes it.
      const samplingRate = await this.getSamplingRate();
      if (!this.isSampled(userId, samplingRate)) {
        return { success: true, data: { sampled: true } };
      }

      const result = await this.prisma.productEvent.create({
        data: {
          eventName: type,
          userId,
          metadata: (metadata || undefined) as Prisma.InputJsonValue,
          timestamp: new Date(),
        },
      });

      await this.cache.invalidate('analytics:*');

      return result;
    } catch (error) {
      this.logger.error(`trackEvent failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async trackBatch(
    events: Array<{ type: string; userId?: string; metadata?: Record<string, unknown> }>
  ): Promise<{ success: boolean }> {
    if (events.length > 1000) {
      throw new BadRequestException('Maximum 1000 events per batch');
    }

    const invalidEvents = events.filter(
      (e) => !ALLOWED_EVENT_NAMES.includes(e.type) && !e.type.startsWith('custom_')
    );
    if (invalidEvents.length > 0) {
      throw new BadRequestException(
        `Invalid event names: ${invalidEvents.map((e) => e.type).join(', ')}`
      );
    }
    try {
      const samplingRate = await this.getSamplingRate();
      const sampled = events.filter((event) =>
        this.isSampled(event.userId, samplingRate)
      );

      await this.writeEvents(
        sampled.map((event) => ({
          eventName: event.type,
          userId: event.userId,
          metadata: (event.metadata || undefined) as Prisma.InputJsonValue,
          timestamp: new Date(),
        }))
      );

      await this.cache.invalidate('analytics:*');

      return { success: true };
    } catch (error) {
      this.logger.error(`trackBatch failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false };
    }
  }

  async getDailyStats(date?: Date): Promise<AnalyticsResponse> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
      const totalUsers = await this.getUserCount();

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
    } catch (error) {
      this.logger.error(
        `getDailyStats failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  /**
   * Search correction acceptance: daily counts of 'did you mean' suggestions
   * shown vs accepted, plus the acceptance rate — the raw material for the
   * admin Search Analytics panel. `days` is clamped to [1, 90] server-side.
   */
  async getSearchCorrections(days = 30): Promise<AnalyticsResponse> {
    const safeDays = Math.min(Math.max(1, Math.floor(days)), 90);
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - (safeDays - 1));

    try {
      const rows = (await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', pe."timestamp")::date AS day,
          COUNT(*) FILTER (WHERE pe."eventName" = 'content_search_correction_shown') AS shown,
          COUNT(*) FILTER (WHERE pe."eventName" = 'content_search_correction_accepted') AS accepted
        FROM "product_events" pe
        WHERE pe."eventName" IN (
          'content_search_correction_shown',
          'content_search_correction_accepted'
        )
          AND pe."timestamp" >= ${startDate}
        GROUP BY 1
        ORDER BY 1
      `) as { day: Date; shown: bigint | number; accepted: bigint | number }[];

      const byDay = new Map<string, { shown: number; accepted: number }>();
      for (const row of rows) {
        const key = new Date(row.day).toISOString().slice(0, 10);
        byDay.set(key, {
          shown: Number(row.shown ?? 0),
          accepted: Number(row.accepted ?? 0),
        });
      }

      // Fill the contiguous range so the chart never has holes.
      const series: { date: string; shown: number; accepted: number; rate: number }[] = [];
      let totalShown = 0;
      let totalAccepted = 0;
      const cursor = new Date(startDate);
      for (let i = 0; i < safeDays; i++) {
        const key = cursor.toISOString().slice(0, 10);
        const day = byDay.get(key) || { shown: 0, accepted: 0 };
        totalShown += day.shown;
        totalAccepted += day.accepted;
        series.push({
          date: key,
          shown: day.shown,
          accepted: day.accepted,
          rate: day.shown > 0 ? day.accepted / day.shown : 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return {
        success: true,
        data: {
          days: safeDays,
          overall: {
            shown: totalShown,
            accepted: totalAccepted,
            rate: totalShown > 0 ? totalAccepted / totalShown : 0,
          },
          series,
        },
      };
    } catch (error) {
      this.logger.error(
        `getSearchCorrections failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getUniverseKpis(universeName: string): Promise<AnalyticsResponse> {
    try {
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
    } catch (error) {
      this.logger.error(
        `getUniverseKpis failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getAllUniverseKpis(): Promise<AnalyticsResponse> {
    try {
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
    } catch (error) {
      this.logger.error(
        `getAllUniverseKpis failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getRetentionMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    try {
      const newUsers = await this.getUserCount();

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
    } catch (error) {
      this.logger.error(
        `getRetentionMetrics failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getRevenueMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    try {
      const payments = await this.prisma.paymentIntent.count({
        where: { status: 'completed', createdAt: { gte: periodAgo } },
      });

      const totalRevenue = await this.prisma.paymentIntent.aggregate({
        _sum: { amount: true },
        where: { status: 'completed', createdAt: { gte: periodAgo } },
      });

      const avgOrderValue =
        payments > 0 ? Math.round(Number(totalRevenue._sum.amount || 0) / payments) : 0;

      const subscriptions = await this.getSubscriptionCount('');

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
    } catch (error) {
      this.logger.error(
        `getRevenueMetrics failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getEngagementMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);

    try {
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
    } catch (error) {
      this.logger.error(
        `getEngagementMetrics failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getDetailedDashboard(): Promise<AnalyticsResponse> {
    // Cache detailed dashboard for 5 minutes
    const cacheK = cacheKey('analytics', 'detailed-dashboard');
    const cached = await this.cache.get<AnalyticsResponse>(cacheK);
    if (cached) return cached;

    try {
      const [dailyStats, weeklyRetention, monthlyRevenue, engagement, universeKpis] =
        await Promise.all([
          this.getDailyStats(),
          this.getRetentionMetrics('7d'),
          this.getRevenueMetrics('30d'),
          this.getEngagementMetrics('30d'),
          this.getAllUniverseKpis(),
        ]);

      const result = {
        success: true,
        data: {
          today: dailyStats.data,
          retention: weeklyRetention.data,
          revenue: monthlyRevenue.data,
          engagement: engagement.data,
          universes: universeKpis.data,
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(
        `getDetailedDashboard failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getKpis(period?: '7d' | '30d' | '90d'): Promise<AnalyticsResponse> {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      const cacheK = cacheKey('analytics', `metrics:kpis:${period || '30d'}`);
      const cached = await this.cache.get<AnalyticsResponse>(cacheK);
      if (cached) return cached;

      const results = await Promise.all([
        this.prisma.productEvent.count({ where: { timestamp: { gte: startDate } } }),
        this.prisma.productEvent.groupBy({
          by: ['userId'],
          where: { timestamp: { gte: startDate }, userId: { not: null } },
          _count: { id: true },
        }),
        this.prisma.productEvent.groupBy({
          by: ['sessionId'],
          where: { timestamp: { gte: startDate }, sessionId: { not: null } },
          _count: { id: true },
        }),
      ]);
      const [totalEvents, uniqueUsers, totalSessions] = results;

      const topEvents = await this.prisma.productEvent.groupBy({
        by: ['eventName'],
        where: { timestamp: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const result: AnalyticsResponse = {
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

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getKpis failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }

  async getRealtime(): Promise<AnalyticsResponse> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Use ProductEvent instead of analyticsEvent (model doesn't exist in schema)
      const [eventsLast5Min, eventsLastHour, activeUsersLast5Min, eventsByTypeLastHour] =
        await Promise.all([
          this.prisma.productEvent.count({ where: { timestamp: { gte: fiveMinutesAgo } } }),
          this.prisma.productEvent.count({ where: { timestamp: { gte: oneHourAgo } } }),
          this.prisma.productEvent.groupBy({
            by: ['userId'],
            where: { timestamp: { gte: fiveMinutesAgo }, userId: { not: null } },
            _count: { id: true },
          }),
          this.prisma.productEvent.groupBy({
            by: ['eventName'],
            where: { timestamp: { gte: oneHourAgo } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
          }),
        ]);

      const recentEvents = await this.prisma.productEvent.findMany({
        where: { timestamp: { gte: fiveMinutesAgo } },
        orderBy: { timestamp: 'desc' },
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
    } catch (error) {
      this.logger.error(`getRealtime failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message },
      };
    }
  }
}
