import { Inject, Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard, RateLimitGuard, RateLimit } from '@azeebo/security';

@ApiTags('Admin - Engagement Service')
@Controller('admin')
@UseGuards(AdminGuard, RateLimitGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get engagement service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Engagement service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('leaderboard')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated leaderboard entries (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated leaderboard entries' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLeaderboard(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string
  ) {
    return this.adminService.getLeaderboard({ page, limit, category });
  }

  @Get('predictions')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated predictions (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated predictions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPredictions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getPredictions({ page, limit });
  }

  @Post('predictions/:id/resolve')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Resolve a prediction (admin)' })
  @ApiResponse({ status: 200, description: 'Prediction resolved' })
  @ApiResponse({ status: 404, description: 'Prediction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async resolvePrediction(@Param('id') id: string, @Body('outcome') outcome: string) {
    return this.adminService.resolvePrediction(id, outcome);
  }
}
