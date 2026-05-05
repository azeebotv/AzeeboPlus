import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AnalyticsService } from './analytics.service';
import { AnalyticsResponse } from './interfaces/analytics-response.interface';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingest product events' })
  @ApiResponse({ status: 200, description: 'Events ingested' })
  async ingestEvents(@Body() body: { events: unknown[] }): Promise<AnalyticsResponse> {
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
  async getUserSummary(@Request() req: { user: { sub: string } }): Promise<AnalyticsResponse> {
    return this.analyticsService.getUserSummary(req.user.sub);
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
  async getCohorts(): Promise<AnalyticsResponse> {
    return this.analyticsService.getCohorts();
  }
}
