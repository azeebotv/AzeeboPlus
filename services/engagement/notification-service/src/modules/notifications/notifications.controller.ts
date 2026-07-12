import { Inject,
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
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { NotificationsService } from './notifications.service.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { SavePushTokenDto } from './dto/save-push-token.dto.js';
import { NotificationResponse } from './interfaces/notification-response.interface.js';

@ApiTags('Notifications')
@Controller('v1/notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<NotificationResponse> {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  // Push token endpoints
  @Post('push-tokens')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
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
}
