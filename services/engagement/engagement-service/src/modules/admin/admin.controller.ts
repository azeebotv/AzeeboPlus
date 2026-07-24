import {
  Inject,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @Get('leaderboard/export')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Export leaderboard data (admin)' })
  @ApiResponse({ status: 200, description: 'Exported leaderboard data' })
  async exportLeaderboard(
    @Query('timePeriod') timePeriod = 'weekly',
    @Query('category') category = 'all',
    @Query('format') format: 'csv' | 'json' = 'json'
  ) {
    return this.adminService.exportLeaderboard(timePeriod, category, format);
  }

  @Delete('leaderboard/:id')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a leaderboard entry (admin)' })
  @ApiResponse({ status: 200, description: 'Leaderboard entry deleted' })
  async deleteLeaderboardEntry(@Param('id') id: string) {
    return this.adminService.deleteLeaderboardEntry(id);
  }

  @Get('predictions')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated predictions (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated predictions' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPredictions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getPredictions({ page, limit });
  }

  @Get('predictions/export')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Export predictions data (admin)' })
  @ApiResponse({ status: 200, description: 'Exported predictions data' })
  async exportPredictions(
    @Query('status') status?: string,
    @Query('format') format: 'csv' | 'json' = 'json'
  ) {
    return this.adminService.exportPredictions(status, format);
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

  @Get('rankings')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get paginated rankings (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated rankings' })
  async getRankings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string
  ) {
    return this.adminService.getRankings({ page, limit, category });
  }

  @Get('rankings/history')
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Get ranking history (admin)' })
  @ApiResponse({ status: 200, description: 'Ranking history' })
  async getRankingHistory(
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('limit') limit = 50
  ) {
    return this.adminService.getRankingHistory(userId, category, Number(limit));
  }

  @Delete('rankings/:id')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a ranking (admin)' })
  @ApiResponse({ status: 200, description: 'Ranking deleted' })
  async deleteRanking(@Param('id') id: string) {
    return this.adminService.deleteRanking(id);
  }
}
