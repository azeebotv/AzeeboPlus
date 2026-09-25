import { Inject, Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { SupportDashboardService } from './support-dashboard.service';

@ApiTags('Support Dashboard')
@Controller('support/dashboard')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class SupportDashboardController {
  constructor(
    @Inject(SupportDashboardService) private readonly dashboardService: SupportDashboardService
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get support dashboard stats (admin)' })
  async getStats() {
    const stats = await this.dashboardService.getStats();
    return ApiResponseWrapper.success(stats);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent support activity (admin)' })
  async getRecentActivity() {
    const result = await this.dashboardService.getRecentActivity();
    return ApiResponseWrapper.success(result);
  }

  @Get('sla-metrics')
  @ApiOperation({ summary: 'Get SLA metrics (admin)' })
  async getSlaMetrics() {
    const metrics = await this.dashboardService.getSlaMetrics();
    return ApiResponseWrapper.success(metrics);
  }
}
