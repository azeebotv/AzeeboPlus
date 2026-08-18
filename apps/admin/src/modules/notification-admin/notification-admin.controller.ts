import { Inject, Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationAdminService } from './notification-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class NotificationAdminController {
  constructor(
    @Inject(NotificationAdminService) private readonly notificationService: NotificationAdminService
  ) {}

  @Get('notifications/stats')
  async getStats() {
    return this.notificationService.getNotificationStats();
  }

  @Get('notifications')
  async getNotifications(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string
  ) {
    return this.notificationService.getNotifications(Number(page), Number(limit), type);
  }

  @Get('notification-templates')
  async getTemplates() {
    return this.notificationService.getTemplates();
  }

  @Post('notification-templates')
  async createTemplate(@Body() body: { name: string; type: string; body: string }) {
    return this.notificationService.createTemplate(body);
  }

  @Put('notification-templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; type?: string; body?: string }
  ) {
    return this.notificationService.updateTemplate(id, body);
  }
}
