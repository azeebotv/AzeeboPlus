import { Inject, Controller, Get, Post, Put, Param, Query, Body, UseGuards, Req  } from '@nestjs/common';
import { Request } from 'express';
import { ModerationService } from './moderation.service';
import { AuditLogService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ModerationController {
  constructor(
    @Inject(ModerationService) private readonly moderationService: ModerationService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  @Get('reports')
  async getReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('type') type?: string
  ): Promise<unknown> {
    return this.moderationService.getReports(Number(page), Number(limit), status, type);
  }

  @Get('reports/stats')
  async getModerationStats(): Promise<unknown> {
    return this.moderationService.getModerationStats();
  }

  @Get('reports/types')
  async getReportTypes(): Promise<unknown> {
    return this.moderationService.getReportTypes();
  }

  @Get('reports/:id')
  async getReportById(@Param('id') id: string): Promise<unknown> {
    return this.moderationService.getReportById(id);
  }

  @Put('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { action: string; reason: string }
  ): Promise<unknown> {
    const adminId = req.user.id;
    const result = await this.moderationService.resolveReport(
      id,
      body.action,
      body.reason,
      adminId
    );
    await this.auditLogService.log({
      actorId: adminId,
      action: 'moderation.report.resolved',
      targetType: 'report',
      targetId: id,
      details: { action: body.action, reason: body.reason },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put('reports/:id/dismiss')
  async dismissReport(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { reason: string }
  ): Promise<unknown> {
    const adminId = req.user.id;
    const result = await this.moderationService.dismissReport(id, body.reason, adminId);
    await this.auditLogService.log({
      actorId: adminId,
      action: 'moderation.report.dismissed',
      targetType: 'report',
      targetId: id,
      details: { reason: body.reason },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('safety-action')
  async takeSafetyAction(
    @Req() req: AuthRequest,
    @Body()
    body: {
      targetId: string;
      targetType: string;
      actionType: string;
      reason: string;
      duration?: string;
    }
  ): Promise<unknown> {
    const adminId = req.user.id;
    const result = await this.moderationService.takeSafetyAction(
      body.targetId,
      body.targetType,
      body.actionType,
      body.reason,
      adminId,
      body.duration
    );
    await this.auditLogService.log({
      actorId: adminId,
      action: 'moderation.safety_action.taken',
      targetType: body.targetType,
      targetId: body.targetId,
      details: { actionType: body.actionType, reason: body.reason, duration: body.duration },
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('safety-actions')
  async getSafetyActions(@Query('targetId') targetId?: string): Promise<unknown> {
    return this.moderationService.getSafetyActions(targetId);
  }
}
