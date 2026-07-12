import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { EngagementAdminService } from './engagement-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EngagementAdminController {
  constructor(@Inject(EngagementAdminService) private readonly engagementService: EngagementAdminService) {}

  @Get('metrics')
  async getMetrics() {
    return this.engagementService.getEngagementMetrics();
  }

  @Get('trends')
  async getTrends(@Query('range') range: '7d' | '30d' | '90d' = '30d') {
    return this.engagementService.getEngagementTrends(range);
  }
}
