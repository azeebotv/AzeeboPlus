import { Inject, Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AuditController {
  constructor(@Inject(AuditLogService) private readonly auditService: AuditLogService) {}

  @Get()
  async getLogs(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50
  ): Promise<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    // A comma-separated targetType (e.g. `content,category,tag`) becomes a
    // group filter — the admin UI's group chips rely on this.
    const targetTypes = targetType?.includes(',')
      ? targetType
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : targetType;
    return this.auditService.getLogs(
      {
        actorId,
        action,
        targetType: targetTypes,
        targetId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      Number(page),
      Number(limit)
    );
  }

  @Get('target/:targetType/:targetId')
  async getLogsForTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.auditService.getLogsForTarget(targetType, targetId, Number(page), Number(limit));
  }

  @Get('actor/:actorId')
  async getLogsByActor(
    @Param('actorId') actorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.auditService.getLogsByActor(actorId, Number(page), Number(limit));
  }
}
