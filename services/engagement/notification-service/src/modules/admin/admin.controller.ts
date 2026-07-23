import { Inject, Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Admin - Notification Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get notification service stats (admin)' })
  @ApiResponse({ status: 200, description: 'Notification service stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return ApiResponseWrapper.success(stats);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get paginated notifications (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated notifications' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getNotifications({ page, limit, type, status });
  }

  @Post('notifications')
  @ApiOperation({ summary: 'Send system-wide notification (admin)' })
  @ApiResponse({ status: 200, description: 'System notification sent' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async sendSystemNotification(
    @Body() body: { title: string; message: string; type?: string; userIds?: string[] }
  ) {
    const result = await this.adminService.sendSystemNotification(body);
    return ApiResponseWrapper.success(result);
  }

  // Template CRUD
  @Get('templates')
  async getTemplates(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getTemplates({ page, limit });
  }

  @Post('templates')
  async createTemplate(@Body() body: { key: string; channel: string; subject?: string; body: string; variables?: string[] }) {
    return this.adminService.createTemplate(body);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.adminService.deleteTemplate(id);
  }

  // Campaign CRUD
  @Get('campaigns')
  async getCampaigns(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getCampaigns({ page, limit });
  }

  @Post('campaigns')
  async createCampaign(@Body() body: { name: string; templateKey: string; channel: string; audience?: Record<string, unknown>; scheduledAt?: string }) {
    return this.adminService.createCampaign(body);
  }

  @Post('campaigns/:id/send')
  async sendCampaign(@Param('id') id: string) {
    return this.adminService.sendCampaign(id);
  }
}
