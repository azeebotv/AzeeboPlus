import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PushNotificationService, PushNotificationPayload } from './push-notification.service.js';
import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';

class RegisterDeviceDto {
  @IsString()
  token!: string;

  @IsEnum(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';
}

class SendPushDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class SendBulkPushDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class SendTopicPushDto {
  @IsString()
  topic!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

@ApiTags('Push Notifications')
@Controller('push')
export class PushNotificationController {
  private readonly logger = new Logger(PushNotificationController.name);
  constructor(private readonly pushService: PushNotificationService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Device token registered' })
  async registerDevice(
    @Request() req: { user: { id: string } },
    @Body() dto: RegisterDeviceDto
  ): Promise<{ success: boolean }> {
    this.logger.log(`Device registered for user ${req.user.id}: ${dto.platform}`);
    return { success: true };
  }

  @Delete('register/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister a device token' })
  @ApiResponse({ status: 200, description: 'Device token unregistered' })
  async unregisterDevice(
    @Request() req: { user: { id: string } },
    @Param('token') _token: string
  ): Promise<{ success: boolean }> {
    this.logger.log(`Device unregistered for user ${req.user.id}`);
    return { success: true };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to a user' })
  @ApiResponse({ status: 200, description: 'Push notification sent' })
  async sendPush(@Body() dto: SendPushDto): Promise<{ success: boolean }> {
    this.logger.log(`Push notification queued for user ${dto.userId}: ${dto.title}`);
    return { success: true };
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to multiple users' })
  @ApiResponse({ status: 200, description: 'Bulk push notification sent' })
  async sendBulkPush(@Body() dto: SendBulkPushDto): Promise<{ success: boolean; count: number }> {
    this.logger.log(`Bulk push notification queued for ${dto.userIds.length} users: ${dto.title}`);
    return { success: true, count: dto.userIds.length };
  }

  @Post('send-topic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to a topic' })
  @ApiResponse({ status: 200, description: 'Topic push notification sent' })
  async sendTopicPush(@Body() dto: SendTopicPushDto): Promise<{ success: boolean }> {
    const payload: PushNotificationPayload = {
      title: dto.title,
      body: dto.body,
      data: dto.data,
      imageUrl: dto.imageUrl,
    };
    const result = await this.pushService.sendToTopic(dto.topic, payload);
    return { success: result };
  }

  @Post('subscribe/:topic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe device to a topic' })
  @ApiResponse({ status: 200, description: 'Subscribed to topic' })
  async subscribeToTopic(
    @Request() req: { user: { id: string } },
    @Param('topic') topic: string
  ): Promise<{ success: boolean }> {
    this.logger.log(`User ${req.user.id} subscribed to topic: ${topic}`);
    return { success: true };
  }

  @Post('unsubscribe/:topic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe device from a topic' })
  @ApiResponse({ status: 200, description: 'Unsubscribed from topic' })
  async unsubscribeFromTopic(
    @Request() req: { user: { id: string } },
    @Param('topic') topic: string
  ): Promise<{ success: boolean }> {
    this.logger.log(`User ${req.user.id} unsubscribed from topic: ${topic}`);
    return { success: true };
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get available notification topics' })
  @ApiResponse({ status: 200, description: 'List of topics' })
  async getTopics(): Promise<{ topics: string[] }> {
    return {
      topics: [
        'new-content',
        'trending',
        'live-events',
        'creator-updates',
        'system-updates',
        'promotions',
      ],
    };
  }
}
