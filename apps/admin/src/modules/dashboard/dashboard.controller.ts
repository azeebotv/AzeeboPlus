import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(): Promise<unknown> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('revenue')
  async getRevenueData(@Query('days') days = 30): Promise<unknown> {
    return this.dashboardService.getRevenueData(Number(days));
  }

  @Get('content-trend')
  async getContentTrend(@Query('days') days = 30): Promise<unknown> {
    return this.dashboardService.getContentTrend(Number(days));
  }

  @Get('top-content')
  async getTopContent(@Query('limit') limit = 10): Promise<unknown> {
    return this.dashboardService.getTopContent(Number(limit));
  }

  @Get('top-creators')
  async getTopCreators(@Query('limit') limit = 10): Promise<unknown> {
    return this.dashboardService.getTopCreators(Number(limit));
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit = 20): Promise<unknown> {
    return this.dashboardService.getRecentActivity(Number(limit));
  }
}
