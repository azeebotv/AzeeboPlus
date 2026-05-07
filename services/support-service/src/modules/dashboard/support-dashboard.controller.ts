import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Support Dashboard')
@Controller('support/dashboard')
@ApiBearerAuth()
export class SupportDashboardController {
  @Get('stats')
  @ApiOperation({ summary: 'Get support dashboard stats (admin)' })
  async getStats() {
    return ApiResponseWrapper.success({
      openTickets: 0,
      pendingRefunds: 0,
      pendingChargebacks: 0,
      pendingAppeals: 0,
      pendingTakedowns: 0,
      pendingDisputes: 0,
      activeSuspensions: 0,
    });
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent support activity (admin)' })
  async getRecentActivity() {
    return ApiResponseWrapper.success({ activities: [] });
  }

  @Get('sla-metrics')
  @ApiOperation({ summary: 'Get SLA metrics (admin)' })
  async getSlaMetrics() {
    return ApiResponseWrapper.success({
      avgResponseTime: 0,
      avgResolutionTime: 0,
      slaCompliance: 0,
    });
  }
}
