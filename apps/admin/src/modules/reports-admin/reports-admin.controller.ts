import {
  Inject,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsAdminService } from './reports-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class ReportsAdminController {
  constructor(@Inject(ReportsAdminService) private readonly reportsService: ReportsAdminService) {}

  @Get('reports')
  async getReports(@Query('range') range: '7d' | '30d' | '90d' | 'all' = '30d') {
    return this.reportsService.getReports(range);
  }

  @Post('reports')
  async createReport(@Body() body: { type: string; name: string; config: unknown }) {
    return this.reportsService.createReport(body);
  }

  @Post('reports/execute')
  async executeReport(@Body() body: { reportId: string }) {
    return this.reportsService.executeReport(body.reportId);
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.deleteReport(id);
  }
}
