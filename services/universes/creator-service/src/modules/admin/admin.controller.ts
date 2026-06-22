import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Creator Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get creator service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Creator service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCreatorStats() {
    return this.adminService.getCreatorStats();
  }

  @Get('creators')
  @ApiOperation({ summary: 'Get all creators (admin)' })
  @ApiResponse({ status: 200, description: 'List of creators' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllCreators(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('verified') verified?: boolean
  ) {
    return this.adminService.getAllCreators({ page, limit, verified });
  }

  @Get('creators/:creatorId')
  @ApiOperation({ summary: 'Get creator details (admin)' })
  @ApiResponse({ status: 200, description: 'Creator details' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCreatorById(@Param('creatorId') creatorId: string) {
    return this.adminService.getCreatorById(creatorId);
  }

  @Get('creators/user/:userId')
  @ApiOperation({ summary: 'Get creator by user ID (admin)' })
  @ApiResponse({ status: 200, description: 'Creator details' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCreatorByUserId(@Param('userId') userId: string) {
    return this.adminService.getCreatorByUserId(userId);
  }

  @Post('creators/:creatorId/verify')
  @ApiOperation({ summary: 'Verify creator (admin)' })
  @ApiResponse({ status: 200, description: 'Creator verified' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async verifyCreator(@Param('creatorId') creatorId: string) {
    return this.adminService.verifyCreator(creatorId);
  }

  @Post('creators/:creatorId/unverify')
  @ApiOperation({ summary: 'Unverify creator (admin)' })
  @ApiResponse({ status: 200, description: 'Creator unverified' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async unverifyCreator(@Param('creatorId') creatorId: string) {
    return this.adminService.unverifyCreator(creatorId);
  }

  @Get('creators/:creatorId/earnings')
  @ApiOperation({ summary: 'Get creator earnings (admin)' })
  @ApiResponse({ status: 200, description: 'Creator earnings' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCreatorEarnings(
    @Param('creatorId') creatorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string
  ) {
    return this.adminService.getCreatorEarnings(creatorId, { page, limit, type });
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get payout requests (admin)' })
  @ApiResponse({ status: 200, description: 'List of payout requests' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPayoutRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getPayoutRequests({ page, limit, status });
  }
}
