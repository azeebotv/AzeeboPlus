import { Controller, Delete, Get, Param, Post, Body, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { z } from 'zod';
import { createLogger } from '@azeebo/logger';

const DeletionRequestSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

@Controller('privacy')
export class UserDeletionController {
  private readonly logger = createLogger('user-deletion');

  constructor(private readonly userService: UserService) {}

  @Post('deletion-request')
  async requestDataDeletion(@Body() body: { userId: string; reason?: string }, @Req() req: Request) {
    const validated = DeletionRequestSchema.parse(body);

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
  async deleteUserData(@Param('userId') userId: string, @Req() req: Request) {
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
  async exportUserData(@Param('userId') userId: string, @Req() req: Request) {
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
  async getDeletionStatus(@Param('userId') userId: string) {
    const status = await this.userService.getDeletionStatus(userId);

    return {
      success: true,
      data: status,
    };
  }
}