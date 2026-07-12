import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { ReportsAdminService } from './reports-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReportsAdminController {
  constructor(@Inject(ReportsAdminService) private readonly reportsService: ReportsAdminService) {}

  @Get('reports')
  async getReports(@Query('range') range: '7d' | '30d' | '90d' | 'all' = '30d') {
    return this.reportsService.getReports(range);
  }
}
