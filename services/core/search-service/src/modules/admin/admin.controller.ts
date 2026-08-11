import { Inject, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { IndexRepairService } from '../repair/index-repair.service.js';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Search Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(IndexRepairService) private readonly indexRepairService: IndexRepairService
  ) {}

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

  @Post('indexes/repair')
  @ApiOperation({
    summary: 'Recreate missing GIN trigram indexes (self-heal)',
    description:
      'Verifies the SearchPgTrgmIndexesMissing condition (pg_trgm present, migration GIN indexes absent) and recreates the indexes when needed. Idempotent — safe to call anytime, including as the Alertmanager webhook target for the SearchPgTrgmIndexesMissing alert.',
  })
  @ApiResponse({ status: 201, description: 'Repair attempt summary' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async repairIndexes() {
    return this.indexRepairService.repairMissingIndexes('manual');
  }
}
