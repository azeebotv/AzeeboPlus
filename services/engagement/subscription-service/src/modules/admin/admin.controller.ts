import {
  Inject,
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard, RateLimitGuard, RateLimit } from '@azeebo/security';

import { AdminService } from './admin.service.js';

@ApiTags('Admin - Subscriptions')
@Controller('admin')
@UseGuards(AdminGuard, RateLimitGuard)
@RateLimit(30, 60000)
@ApiBearerAuth()
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription stats (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans including inactive (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all subscription plans' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Put('plans/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async updatePlan(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; description: string; price: number; currency: string; duration: number; features: string[]; tier: string; isActive: boolean }>
  ) {
    return this.adminService.updatePlan(id, data);
  }

  @Delete('plans/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Delete a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan deleted' })
  @ApiResponse({ status: 404, description: 'Plan not found or has active subscriptions' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async deletePlan(@Param('id') id: string) {
    await this.adminService.deletePlan(id);
    return { message: 'Plan deleted successfully' };
  }
}
