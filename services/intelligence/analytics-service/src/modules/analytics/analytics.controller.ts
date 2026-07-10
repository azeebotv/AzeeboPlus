import {
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { AnalyticsService } from './analytics.service';
import { AnalyticsResponse } from './interfaces/analytics-response.interface';
import { IngestEventsDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('v1/analytics')
@UseGuards(RateLimitGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user analytics summary' })
  @ApiResponse({ status: 200, description: 'User analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSummary(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getUserSummary(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(): Promise<AnalyticsResponse> {
    return this.analyticsService.getDashboard();
  }

  @Get('funnels')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get funnel metrics' })
  @ApiResponse({ status: 200, description: 'Funnel metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFunnels(@Query('name') name?: string): Promise<AnalyticsResponse> {
    return this.analyticsService.getFunnels(name);
  }

  @Get('cohorts')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get cohort metrics' })
  @ApiResponse({ status: 200, description: 'Cohort metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCohorts(@Query('period') period?: 'day' | 'week' | 'month'): Promise<AnalyticsResponse> {
    return this.analyticsService.getCohorts(period);
  }

  @Get('universe-kpis')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all universe KPIs' })
  @ApiResponse({ status: 200, description: 'Universe KPIs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUniverseKpis(): Promise<AnalyticsResponse> {
    return this.analyticsService.getAllUniverseKpis();
  }

  @Get('universe-kpis/:universeName')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get specific universe KPIs' })
  @ApiResponse({ status: 200, description: 'Universe KPIs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid universe name' })
  async getUniverseKpis(@Param('universeName') universeName: string): Promise<AnalyticsResponse> {
    return this.analyticsService.getUniverseKpis(universeName);
  }

  @Get('retention')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get retention metrics' })
  @ApiResponse({ status: 200, description: 'Retention metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRetentionMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getRetentionMetrics(period);
  }

  @Get('revenue')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRevenueMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getRevenueMetrics(period);
  }

  @Get('engagement')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get engagement metrics' })
  @ApiResponse({ status: 200, description: 'Engagement metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEngagementMetrics(
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<AnalyticsResponse> {
    return this.analyticsService.getEngagementMetrics(period);
  }

  @Get('dashboard/detailed')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get detailed dashboard' })
  @ApiResponse({ status: 200, description: 'Detailed dashboard' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDetailedDashboard(): Promise<AnalyticsResponse> {
    return this.analyticsService.getDetailedDashboard();
  }

  @Get('daily-stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get daily stats' })
  @ApiResponse({ status: 200, description: 'Daily stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyStats(@Query('date') date?: string): Promise<AnalyticsResponse> {
    const targetDate = date ? new Date(date) : undefined;
    return this.analyticsService.getDailyStats(targetDate);
  }

  @Post('track')
  @UseGuards(AuthGuard('jwt'))
  @RateLimit(100, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track single event' })
  @ApiResponse({ status: 200, description: 'Event tracked' })
  async trackEvent(
    @Request() req: { user: { sub: string; id: string } },
    @Body() body: { type: string; metadata?: Record<string, unknown> }
  ): Promise<unknown> {
    const userId = req.user?.sub;
    return this.analyticsService.trackEvent(body.type, userId, body.metadata);
  }

  @Post('track-batch')
  @UseGuards(AuthGuard('jwt'))
  @RateLimit(50, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track batch events' })
  @ApiResponse({ status: 200, description: 'Events tracked' })
  async trackBatch(
    @Request() req: { user: { sub: string; id: string } },
    @Body()
    body: {
      events: Array<{ type: string; metadata?: Record<string, unknown> }>;
    }
  ): Promise<{ success: boolean }> {
    const userId = req.user?.sub;
    const eventsWithUser = body.events.map((e) => ({ ...e, userId }));
    return this.analyticsService.trackBatch(eventsWithUser);
  }

  @Get('kpis')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get KPI metrics' })
  @ApiResponse({ status: 200, description: 'KPI metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKpis(@Query('period') period?: '7d' | '30d' | '90d'): Promise<AnalyticsResponse> {
    return this.analyticsService.getKpis(period);
  }

  @Get('realtime')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get realtime analytics' })
  @ApiResponse({ status: 200, description: 'Realtime analytics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRealtime(): Promise<AnalyticsResponse> {
    return this.analyticsService.getRealtime();
  }
}
