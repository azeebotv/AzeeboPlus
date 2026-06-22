import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Games Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Aggregate statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('games')
  @ApiOperation({ summary: 'Get paginated games (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated game list' })
  async getGames(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getGames({ page, limit });
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'Get paginated tournaments (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated tournament list' })
  async getTournaments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getTournaments({ page, limit });
  }
}
