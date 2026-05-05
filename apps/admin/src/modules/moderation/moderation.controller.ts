import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

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
    @Body() body: { action: string; reason: string; adminId: string }
  ): Promise<unknown> {
    return this.moderationService.resolveReport(id, body.action, body.reason, body.adminId);
  }

  @Put('reports/:id/dismiss')
  async dismissReport(
    @Param('id') id: string,
    @Body() body: { reason: string; adminId: string }
  ): Promise<unknown> {
    return this.moderationService.dismissReport(id, body.reason, body.adminId);
  }

  @Post('safety-action')
  async takeSafetyAction(
    @Body()
    body: {
      targetId: string;
      targetType: string;
      actionType: string;
      reason: string;
      adminId: string;
      duration?: string;
    }
  ): Promise<unknown> {
    return this.moderationService.takeSafetyAction(
      body.targetId,
      body.targetType,
      body.actionType,
      body.reason,
      body.adminId,
      body.duration
    );
  }

  @Get('safety-actions')
  async getSafetyActions(@Query('targetId') targetId?: string): Promise<unknown> {
    return this.moderationService.getSafetyActions(targetId);
  }
}
