/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { SavePushTokenDto } from './dto/save-push-token.dto';
import { NotificationResponse } from './interfaces/notification-response.interface';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(@Request() req: { user: { sub: string } }): Promise<NotificationResponse> {
    return this.notificationsService.getNotifications(req.user.sub);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(req.user.sub, id);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req: { user: { sub: string } }): Promise<NotificationResponse> {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Put('preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @Request() req: { user: { sub: string } },
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ): Promise<NotificationResponse> {
    return this.notificationsService.updatePreferences(
      req.user.sub,
      updatePreferencesDto as Record<string, boolean>
    );
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  // Push token endpoints
  @Post('push-tokens')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save push notification token' })
  @ApiResponse({ status: 200, description: 'Push token saved' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async savePushToken(
    @Request() req: { user: { sub: string } },
    @Body() savePushTokenDto: SavePushTokenDto
  ): Promise<NotificationResponse> {
    return this.notificationsService.savePushToken(
      req.user.sub,
      savePushTokenDto.token,
      savePushTokenDto.deviceType
    );
  }

  @Get('push-tokens')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user push tokens' })
  @ApiResponse({ status: 200, description: 'Push tokens list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPushTokens(@Request() req: { user: { sub: string } }): Promise<NotificationResponse> {
    return this.notificationsService.getPushTokens(req.user.sub);
  }

  @Delete('push-tokens/:token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete push notification token' })
  @ApiResponse({ status: 200, description: 'Push token deleted' })
  @ApiResponse({ status: 404, description: 'Push token not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePushToken(
    @Request() req: { user: { sub: string } },
    @Param('token') token: string
  ): Promise<NotificationResponse> {
    return this.notificationsService.deletePushToken(req.user.sub, token);
  }
}
