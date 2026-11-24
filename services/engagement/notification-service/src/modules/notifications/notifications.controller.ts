import {
  Inject,
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard, AdminGuard } from '@azeebo/security';

import { NotificationsService } from './notifications.service.js';
import { NotificationSLOService } from '../notification/notification-slo.service.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { SavePushTokenDto } from './dto/save-push-token.dto.js';
import { SendEmailDto } from './dto/send-email.dto.js';
import { NotificationResponse } from './interfaces/notification-response.interface.js';

@ApiTags('Notifications')
@UseGuards(ServiceAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
    @Inject(NotificationSLOService) private readonly sloService: NotificationSLOService
  ) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'List user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @Request() req: { user: { sub: string; id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<NotificationResponse> {
    const validPage = Math.max(1, Number(page) || 1);
    const validLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.notificationsService.getNotifications(req.user.id, validPage, validLimit);
  }

  @Patch('read-all')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Request() req: { user: { sub: string; id: string } },
    @Param('id') id: string
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Put('preferences')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @Request() req: { user: { sub: string; id: string } },
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ): Promise<NotificationResponse> {
    return this.notificationsService.updatePreferences(req.user.id, {
      ...(updatePreferencesDto.email !== undefined && { email: updatePreferencesDto.email }),
      ...(updatePreferencesDto.push !== undefined && { push: updatePreferencesDto.push }),
      ...(updatePreferencesDto.sms !== undefined && { sms: updatePreferencesDto.sms }),
      ...(updatePreferencesDto.inApp !== undefined && { inApp: updatePreferencesDto.inApp }),
    });
  }

  @Get('settings')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<NotificationResponse> {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Get('unread-count')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<NotificationResponse> {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  // Internal transactional email endpoint: other services (e.g. auth-service
  // verification links) send first-class templates through here. Guarded by
  // the class-level ServiceAuthGuard; RateLimitGuard is belt-and-braces.
  @Post('email')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Send a templated transactional email (internal)' })
  @ApiResponse({ status: 200, description: 'Email queued for delivery' })
  @ApiResponse({ status: 400, description: 'Unknown template or invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<{ success: boolean }> {
    const sent = await this.notificationsService.sendTemplatedEmail(sendEmailDto);
    return { success: sent };
  }

  // Push token endpoints
  @Post('push-tokens')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Save push notification token' })
  @ApiResponse({ status: 200, description: 'Push token saved' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async savePushToken(
    @Request() req: { user: { sub: string; id: string } },
    @Body() savePushTokenDto: SavePushTokenDto
  ): Promise<NotificationResponse> {
    return this.notificationsService.savePushToken(
      req.user.id,
      savePushTokenDto.token,
      savePushTokenDto.deviceType
    );
  }

  @Get('push-tokens')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get user push tokens' })
  @ApiResponse({ status: 200, description: 'Push tokens list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPushTokens(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<NotificationResponse> {
    return this.notificationsService.getPushTokens(req.user.id);
  }

  @Delete('push-tokens/:tokenId')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete push notification token' })
  @ApiResponse({ status: 200, description: 'Push token deleted' })
  @ApiResponse({ status: 404, description: 'Push token not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePushToken(
    @Request() req: { user: { sub: string; id: string } },
    @Param('tokenId') tokenId: string
  ): Promise<NotificationResponse> {
    return this.notificationsService.deletePushTokenById(req.user.id, tokenId);
  }

  // ========================
  // SLO monitoring endpoints
  // ========================

  @Get('slo/status')
  @UseGuards(AdminGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get notification delivery SLO status' })
  @ApiResponse({ status: 200, description: 'SLO status' })
  async getSLOStatus() {
    const status = await this.sloService.getCurrentSLOStatus();
    return { success: true, data: status };
  }

  @Get('slo/measure')
  @UseGuards(AdminGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Measure SLO for a time range' })
  @ApiResponse({ status: 200, description: 'SLO measurement' })
  async measureSLO(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const measurement = await this.sloService.measureSLO(new Date(startDate), new Date(endDate));
    return { success: true, data: measurement };
  }
}
