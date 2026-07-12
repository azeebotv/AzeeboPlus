import { Inject, Controller, Get, Post, Put, Param, Body, Query, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard, RateLimitGuard, RateLimit } from '@azeebo/security';

@ApiTags('Admin - Reward Service')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard, RateLimitGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get reward service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Reward service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('rewards')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated reward accounts (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated reward accounts' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRewards(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('levelId') levelId?: string,
    @Query('minPoints') minPoints?: number
  ) {
    return this.adminService.getRewards({ page, limit, levelId, minPoints });
  }

  @Get('rewards/:id/transactions')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get reward account transactions (admin)' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 404, description: 'Reward account not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRewardTransactions(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.adminService.getRewardTransactions(id, { page, limit });
  }

  @Get('missions')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'List active missions (admin)' })
  @ApiResponse({ status: 200, description: 'List of missions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMissions(@Query('type') type?: string, @Query('isActive') isActive?: string) {
    return this.adminService.getMissions({ type, isActive });
  }

  @Post('missions')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Create a mission (admin)' })
  @ApiResponse({ status: 201, description: 'Mission created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createMission(
    @Body()
    body: {
      title: string;
      description?: string;
      points: number;
      type: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.adminService.createMission(body);
  }

  @Put('missions/:id')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Update a mission (admin)' })
  @ApiResponse({ status: 200, description: 'Mission updated' })
  @ApiResponse({ status: 404, description: 'Mission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateMission(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      points?: number;
      type?: string;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.adminService.updateMission(id, body);
  }
}
