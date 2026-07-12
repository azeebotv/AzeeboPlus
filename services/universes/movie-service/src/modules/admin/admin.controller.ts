import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Movie Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Aggregate statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('movies')
  @ApiOperation({ summary: 'Get paginated movies (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated movie list' })
  async getMovies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getMovies({ page, limit, status });
  }

  @Get('premieres')
  @ApiOperation({ summary: 'Get upcoming premieres (admin)' })
  @ApiResponse({ status: 200, description: 'Upcoming premieres' })
  async getPremieres() {
    return this.adminService.getPremieres();
  }
}
