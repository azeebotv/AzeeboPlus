import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NotificationAdminService } from './notification-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class NotificationAdminController {
  constructor(private readonly notificationService: NotificationAdminService) {}

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
}
