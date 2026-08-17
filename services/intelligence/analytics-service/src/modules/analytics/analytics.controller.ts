import {
  Inject,
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { AnalyticsService } from './analytics.service.js';
import { AnalyticsResponse } from './interfaces/analytics-response.interface.js';
import { IngestEventsDto } from './dto/analytics.dto.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(RateLimitGuard)
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get('bootstrap')
  @RateLimit(120, 60000)
  @ApiOperation({ summary: 'Get client-side sampling config for the analytics-sdk' })
  @ApiResponse({ status: 200, description: 'Sampling config' })
  async getBootstrap(): Promise<{
    success: boolean;
    data: { enabled: boolean; samplingRate: number };
  }> {
    const data = await this.analyticsService.getClientSamplingConfig();
    return { success: true, data };
  }

  @Post('events')
  @RateLimit(100, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingest product events' })
  @ApiResponse({ status: 200, description: 'Events ingested' })
  async ingestEvents(@Body() body: IngestEventsDto): Promise<AnalyticsResponse> {
    return this.analyticsService.ingestEvents(
      body.events as unknown as {
        type: string;
        userId?: string;
        sessionId?: string;
        metadata?: Record<string, unknown>;
        timestamp?: string;
      }[]
    );
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'Get user analytics summary' })
  @ApiResponse({ status: 200, description: 'User analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSummary(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getUserSummary(req.user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(): Promise<AnalyticsResponse> {
    return this.analyticsService.getDashboard();
  }

  @Get('funnels')
  @ApiOperation({ summary: 'Get funnel metrics' })
  @ApiResponse({ status: 200, description: 'Funnel metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFunnels(@Query('name') name?: string): Promise<AnalyticsResponse> {
    return this.analyticsService.getFunnels(name);
  }

  @Get('cohorts')
  @ApiOperation({ summary: 'Get cohort metrics' })
  @ApiResponse({ status: 200, description: 'Cohort metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCohorts(@Query('period') period?: 'day' | 'week' | 'month'): Promise<AnalyticsResponse> {
    return this.analyticsService.getCohorts(period);
  }

  @Get('universe-kpis')
  @ApiOperation({ summary: 'Get all universe KPIs' })
  @ApiResponse({ status: 200, description: 'Universe KPIs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUniverseKpis(): Promise<AnalyticsResponse> {
    return this.analyticsService.getAllUniverseKpis();
  }

  @Get('universe-kpis/:universeName')
  @ApiOperation({ summary: 'Get specific universe KPIs' })
  @ApiResponse({ status: 200, description: 'Universe KPIs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid universe name' })
  async getUniverseKpis(@Param('universeName') universeName: string): Promise<AnalyticsResponse> {
    return this.analyticsService.getUniverseKpis(universeName);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get retention metrics' })
  @ApiResponse({ status: 200, description: 'Retention metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRetentionMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getRetentionMetrics(period);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRevenueMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getRevenueMetrics(period);
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Get engagement metrics' })
  @ApiResponse({ status: 200, description: 'Engagement metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEngagementMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getEngagementMetrics(period);
  }

  @Get('dashboard/detailed')
  @ApiOperation({ summary: 'Get detailed dashboard' })
  @ApiResponse({ status: 200, description: 'Detailed dashboard' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDetailedDashboard(): Promise<AnalyticsResponse> {
    return this.analyticsService.getDetailedDashboard();
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Get daily stats' })
  @ApiResponse({ status: 200, description: 'Daily stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyStats(@Query('date') date?: string): Promise<AnalyticsResponse> {
    const targetDate = date ? new Date(date) : undefined;
    return this.analyticsService.getDailyStats(targetDate);
  }

  @Get('search/corrections')
  @ApiOperation({ summary: 'Search correction acceptance (shown vs accepted over time)' })
  @ApiResponse({ status: 200, description: 'Daily correction acceptance series' })
  async getSearchCorrections(@Query('days') days?: string): Promise<AnalyticsResponse> {
    const parsedDays = days ? Number(days) : 30;
    return this.analyticsService.getSearchCorrections(
      Number.isFinite(parsedDays) ? parsedDays : 30
    );
  }

  @Post('track')
  @RateLimit(100, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track single event' })
  @ApiResponse({ status: 200, description: 'Event tracked' })
  async trackEvent(
    @Request() req: { user: { sub: string; id: string } },
    @Body()
    body: { eventName?: string; type?: string; userId?: string; metadata?: Record<string, unknown> }
  ): Promise<unknown> {
    // Services emit the canonical EventPayload shape ({ eventName }); the
    // legacy { type } alias is still accepted for old clients.
    const eventName = body.eventName ?? body.type;
    if (!eventName) {
      throw new BadRequestException('Event name is required (eventName or type)');
    }
    const userId = body.userId ?? req.user?.sub;
    return this.analyticsService.trackEvent(eventName, userId, body.metadata);
  }

  @Post('track-batch')
  @RateLimit(50, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track batch events' })
  @ApiResponse({ status: 200, description: 'Events tracked' })
  async trackBatch(
    @Request() req: { user: { sub: string; id: string } },
    @Body()
    body: {
      events: Array<{
        eventName?: string;
        type?: string;
        userId?: string;
        metadata?: Record<string, unknown>;
      }>;
    }
  ): Promise<{ success: boolean }> {
    const userId = req.user?.sub;
    const eventsWithUser = body.events.map((e) => {
      // Canonical EventPayload shape first; legacy { type } alias accepted.
      const eventName = e.eventName ?? e.type;
      return {
        type: eventName ?? '',
        userId: e.userId ?? userId,
        metadata: e.metadata,
      };
    });
    return this.analyticsService.trackBatch(eventsWithUser);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPI metrics' })
  @ApiResponse({ status: 200, description: 'KPI metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKpis(@Query('period') period?: '7d' | '30d' | '90d'): Promise<AnalyticsResponse> {
    return this.analyticsService.getKpis(period);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get realtime analytics' })
  @ApiResponse({ status: 200, description: 'Realtime analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRealtime(): Promise<AnalyticsResponse> {
    return this.analyticsService.getRealtime();
  }
}
