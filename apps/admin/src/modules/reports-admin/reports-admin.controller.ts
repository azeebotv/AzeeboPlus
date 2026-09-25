import {
  Inject,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsAdminService } from './reports-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest extends Request {
  user?: { id?: string };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class ReportsAdminController {
  constructor(@Inject(ReportsAdminService) private readonly reportsService: ReportsAdminService) {}

  private actor(req: AuthRequest): string | undefined {
    return (req.user as { id?: string })?.id;
  }

  @Get('reports')
  async getReports(@Query('range') range: '7d' | '30d' | '90d' | 'all' = '30d') {
    return this.reportsService.getReports(range);
  }

  @Post('reports')
  async createReport(
    @Body() body: { type: string; name: string; config?: unknown },
    @Req() req: AuthRequest
  ) {
    return this.reportsService.createReport(body, this.actor(req));
  }

  /** Path-param form, matching the client's POST /admin/reports/:id/execute. */
  @Post('reports/:id/execute')
  async executeReport(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.reportsService.executeReport(id, this.actor(req));
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.reportsService.deleteReport(id, this.actor(req));
  }
}
