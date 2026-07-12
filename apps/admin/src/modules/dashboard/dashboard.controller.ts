import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

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

  @Get('platform-overview')
  async getPlatformOverview(): Promise<unknown> {
    return this.dashboardService.getPlatformOverview();
  }
}
