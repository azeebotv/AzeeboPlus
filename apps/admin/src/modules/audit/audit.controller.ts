import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit.service';

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditLogService) {}

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
    return this.auditService.getLogs(
      {
        actorId,
        action,
        targetType,
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
    @Query('targetType') _targetType: string,
    @Query('targetId') _targetId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.auditService.getLogsForTarget(_targetType, _targetId, Number(page), Number(limit));
  }

  @Get('actor/:actorId')
  async getLogsByActor(
    @Query('actorId') _actorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.auditService.getLogsByActor(_actorId, Number(page), Number(limit));
  }
}
