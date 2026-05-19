import {
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin - User Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    return this.adminService.getAllSubscriptions({ page, limit, status });
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
    @Body() updateData: Record<string, unknown>
  ) {
    return this.adminService.updateSubscription(subscriptionId, updateData);
  }

  @Delete('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Delete subscription (admin)' })
  @ApiResponse({ status: 200, description: 'Subscription deleted' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.adminService.deleteSubscription(subscriptionId);
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
    @Body() preferences: Record<string, unknown>
  ) {
    return this.adminService.updateUserPreferences(userId, preferences);
  }

  @Delete('watch-history/:userId')
  @ApiOperation({ summary: 'Delete user watch history (admin)' })
  @ApiResponse({ status: 200, description: 'Watch history deleted' })
  @ApiResponse({ status: 404, description: 'Watch history not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteWatchHistory(
    @Param('userId') userId: string,
    @Query('contentId') contentId?: string
  ) {
    return this.adminService.deleteWatchHistory(userId, contentId);
  }

  @Delete('saved-items/:userId')
  @ApiOperation({ summary: 'Delete user saved items (admin)' })
  @ApiResponse({ status: 200, description: 'Saved items deleted' })
  @ApiResponse({ status: 404, description: 'Saved items not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSavedItems(
    @Param('userId') userId: string,
    @Query('contentId') contentId?: string
  ) {
    return this.adminService.deleteSavedItems(userId, contentId);
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
    @Body() updateData: Record<string, unknown>
  ) {
    return this.adminService.updateUser(id, updateData);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user (admin)' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async suspendUser(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.adminService.suspendUser(id, body.reason);
  }

  @Patch('content/:id/moderate')
  @ApiOperation({ summary: 'Moderate content (admin)' })
  @ApiResponse({ status: 200, description: 'Content moderated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async moderateContent(
    @Param('id') id: string,
    @Body() body: { action: string; reason: string }
  ) {
    return this.adminService.moderateContent(id, body.action, body.reason);
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
    return this.adminService.getModerationReports(Number(page) || 1, Number(limit) || 20, status);
  }

  @Patch('moderation/reports/:id')
  @ApiOperation({ summary: 'Resolve moderation report (admin)' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async resolveReport(
    @Param('id') id: string,
    @Body() body: { resolution: string }
  ) {
    return this.adminService.resolveReport(id, body.resolution);
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
    return this.adminService.getAuditLogs(Number(page) || 1, Number(limit) || 20, userId);
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
    return this.adminService.getVerificationRequests(Number(page) || 1, Number(limit) || 20, status);
  }

  @Patch('creators/:id/verify')
  @ApiOperation({ summary: 'Verify creator (admin)' })
  @ApiResponse({ status: 200, description: 'Creator verified' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async verifyCreator(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.adminService.verifyCreator(id, body.status, body.notes);
  }
}