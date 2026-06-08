import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Admin - Notification Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    @Query('status') status?: string,
  ) {
    return this.adminService.getNotifications({ page, limit, type, status });
  }

  @Post('notifications')
  @ApiOperation({ summary: 'Send system-wide notification (admin)' })
  @ApiResponse({ status: 200, description: 'System notification sent' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async sendSystemNotification(
    @Body() body: { title: string; message: string; type?: string; userIds?: string[] },
  ) {
    const result = await this.adminService.sendSystemNotification(body);
    return ApiResponseWrapper.success(result);
  }
}
