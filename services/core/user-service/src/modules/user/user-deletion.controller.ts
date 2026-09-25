import {
  Inject,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Req,
  ForbiddenException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { Request } from 'express';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, userFlags } from '@azeebo/feature-flags';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Privacy & Data Deletion')
@Controller('privacy')
export class UserDeletionController {
  private readonly logger = new Logger('user-deletion');

  constructor(@Inject(UsersService) private readonly userService: UsersService) {}

  @Post('deletion-request')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(userFlags.deletionSoft)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Request data deletion' })
  @ApiResponse({ status: 201, description: 'Deletion request scheduled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async requestDataDeletion(
    @Body() body: { reason?: string },
    @Req() req: Request & { user: { id: string; role: string; email: string } }
  ) {
    this.logger.log('Data deletion requested', {
      userId: req.user.id,
      reason: body.reason,
      ipAddress: req.ip,
    });

    const result = await this.userService.scheduleDataDeletion(req.user.id, body.reason);

    return {
      success: true,
      data: result,
    };
  }

  @Delete('data/:userId')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(userFlags.deletionSoft)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Delete user data' })
  @ApiResponse({ status: 200, description: 'Data deletion initiated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteUserData(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string; role: string; email: string } }
  ) {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own data');
    }
    this.logger.log('User data deletion confirmed', {
      userId,
      ipAddress: req.ip,
    });

    await this.userService.deleteUserData(userId);

    return {
      success: true,
      message: 'User data deletion initiated',
    };
  }

  @Get('data/:userId/export')
  @ApiBearerAuth()
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportUserData(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string; role: string; email: string } }
  ) {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only export your own data');
    }
    this.logger.log('User data export requested', {
      userId,
      ipAddress: req.ip,
    });

    const exportData = await this.userService.exportUserData(userId);

    return {
      success: true,
      data: exportData,
    };
  }

  @Get('deletion-status/:userId')
  @ApiBearerAuth()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Check deletion status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDeletionStatus(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string; role: string; email: string } }
  ) {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only check your own deletion status');
    }
    const status = await this.userService.getDeletionStatus(userId);

    return {
      success: true,
      data: status,
    };
  }
}
