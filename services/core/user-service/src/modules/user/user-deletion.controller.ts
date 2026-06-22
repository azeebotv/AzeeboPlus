import { Controller, Delete, Get, Param, Post, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { Request } from 'express';
import { z } from 'zod';
import { createLogger } from '@azeebo/logger';

const DeletionRequestSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

@Controller('privacy')
@UseGuards(AuthGuard('jwt'))
export class UserDeletionController {
  private readonly logger = createLogger('user-deletion');

  constructor(private readonly userService: UserService) {}

  @Post('deletion-request')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async requestDataDeletion(@Body() body: { userId: string; reason?: string }, @Req() req: Request & { user: { id: string; role: string } }) {
    const validated = DeletionRequestSchema.parse(body);

    if (req.user.id !== validated.userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only request deletion for your own account');
    }

    this.logger.log('Data deletion requested', {
      userId: validated.userId,
      reason: validated.reason,
      ipAddress: req.ip,
    });

    const result = await this.userService.scheduleDataDeletion(validated.userId, validated.reason);

    return {
      success: true,
      data: result,
    };
  }

  @Delete('data/:userId')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async deleteUserData(@Param('userId') userId: string, @Req() req: Request & { user: { id: string; role: string } }) {
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async exportUserData(@Param('userId') userId: string, @Req() req: Request & { user: { id: string; role: string } }) {
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getDeletionStatus(@Param('userId') userId: string, @Req() req: Request & { user: { id: string; role: string } }) {
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