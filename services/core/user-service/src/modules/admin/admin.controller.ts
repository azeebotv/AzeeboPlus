import {
  Inject,
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';
import { Request } from 'express';
import { SuspendUserDto } from './dto/suspend-user.dto.js';
import { ModerateContentDto } from './dto/moderate-content.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';
import { VerifyCreatorDto } from './dto/verify-creator.dto.js';

class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

class UpdatePreferencesDto {
  @IsObject()
  @IsOptional()
  preferences?: Record<string, unknown>;
}

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
    email?: string;
  };
}

@ApiTags('Admin - User Service')
@Controller('v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'User service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions (admin)' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.adminService.getAllSubscriptions({ page, limit: clampedLimit, status });
  }

  @Get('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Get subscription by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSubscriptionById(@Param('subscriptionId') subscriptionId: string) {
    return this.adminService.getSubscriptionById(subscriptionId);
  }

  @Put('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Update subscription (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateData: UpdateSubscriptionDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.updateSubscription(
      subscriptionId,
      updateData as Record<string, unknown>,
      actorId,
      actorRole
    );
  }

  @Delete('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Delete subscription (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription deleted' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.deleteSubscription(subscriptionId, actorId, actorRole);
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get user preferences (admin)' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserPreferences(@Param('userId') userId: string) {
    return this.adminService.getUserPreferences(userId);
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Update user preferences (admin)' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() preferences: UpdatePreferencesDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.updateUserPreferences(
      userId,
      preferences as Record<string, unknown>,
      actorId,
      actorRole
    );
  }

  @Delete('watch-history/:userId')
  @ApiOperation({ summary: 'Delete user watch history (admin)' })
  @ApiResponse({ status: 200, description: 'Watch history deleted' })
  @ApiResponse({ status: 404, description: 'Watch history not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteWatchHistory(
    @Param('userId') userId: string,
    @Query('contentId') contentId: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.deleteWatchHistory(userId, contentId, actorId, actorRole);
  }

  @Delete('saved-items/:userId')
  @ApiOperation({ summary: 'Delete user saved items (admin)' })
  @ApiResponse({ status: 200, description: 'Saved items deleted' })
  @ApiResponse({ status: 404, description: 'Saved items not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSavedItems(
    @Param('userId') userId: string,
    @Query('contentId') contentId: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.deleteSavedItems(userId, contentId, actorId, actorRole);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (admin)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Record<string, unknown>,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.updateUser(id, updateData, actorId, actorRole);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user (admin)' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async suspendUser(
    @Param('id') id: string,
    @Body() body: SuspendUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.suspendUser(id, body.reason, actorId, actorRole);
  }

  @Patch('content/:id/moderate')
  @ApiOperation({ summary: 'Moderate content (admin)' })
  @ApiResponse({ status: 200, description: 'Content moderated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async moderateContent(
    @Param('id') id: string,
    @Body() body: ModerateContentDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.moderateContent(id, body.action, body.reason, actorId, actorRole);
  }

  @Get('moderation/reports')
  @ApiOperation({ summary: 'Get moderation reports (admin)' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getModerationReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getModerationReports(
      Number(page) || 1,
      Math.min(100, Math.max(1, Number(limit) || 20)),
      status
    );
  }

  @Patch('moderation/reports/:id')
  @ApiOperation({ summary: 'Resolve moderation report (admin)' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async resolveReport(
    @Param('id') id: string,
    @Body() body: ResolveReportDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.resolveReport(id, body.resolution, actorId, actorRole);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get admin analytics (admin)' })
  @ApiResponse({ status: 200, description: 'Admin analytics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminAnalytics() {
    return this.adminService.getUserStats();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs (admin)' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string
  ) {
    return this.adminService.getAuditLogs(
      Number(page) || 1,
      Math.min(100, Math.max(1, Number(limit) || 20)),
      userId
    );
  }

  @Get('creators/verification')
  @ApiOperation({ summary: 'Get creator verification requests (admin)' })
  @ApiResponse({ status: 200, description: 'Verification requests' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getVerificationRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getVerificationRequests(
      Number(page) || 1,
      Math.min(100, Math.max(1, Number(limit) || 20)),
      status
    );
  }

  @Patch('creators/:id/verify')
  @ApiOperation({ summary: 'Verify creator (admin)' })
  @ApiResponse({ status: 200, description: 'Creator verified' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async verifyCreator(
    @Param('id') id: string,
    @Body() body: VerifyCreatorDto,
    @Req() req: AuthenticatedRequest
  ) {
    const actorId = req.user?.sub || 'admin';
    const actorRole = req.user?.role || 'admin';
    return this.adminService.verifyCreator(id, body.status, body.notes, actorId, actorRole);
  }
}
