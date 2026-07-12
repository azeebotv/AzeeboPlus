import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Search Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get search service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Search service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('queries')
  @ApiOperation({ summary: 'Get paginated search query log (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated search queries' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getQueries(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.getQueries({ page, limit, startDate, endDate });
  }
}
