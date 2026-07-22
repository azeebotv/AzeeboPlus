import { Inject, Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard, RateLimitGuard, RateLimit } from '@azeebo/security';

@ApiTags('Admin - Referral Service')
@Controller('admin')
@UseGuards(AdminGuard, RateLimitGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get referral service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Referral service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('referrals')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated referrals (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated referrals' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getReferrals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getReferrals(Number(page) || 1, Number(limit) || 20);
  }

  @Get('config')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get referral config (admin)' })
  @ApiResponse({ status: 200, description: 'Referral configuration' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getReferralConfig() {
    return this.adminService.getReferralConfig();
  }

  @Put('config')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Update referral config (admin)' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Config key not found' })
  async updateReferralConfig(
    @Body() dto: { key: string; value?: number; description?: string; isActive?: boolean },
  ) {
    return this.adminService.updateReferralConfig(dto);
  }
}
