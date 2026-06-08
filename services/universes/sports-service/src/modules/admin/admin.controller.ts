import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Sports Service')
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

  @Get('events')
  @ApiOperation({ summary: 'Get paginated sports events (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated event list' })
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getEvents({ page, limit });
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get recent predictions (admin)' })
  @ApiResponse({ status: 200, description: 'Recent predictions' })
  async getPredictions(
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPredictions({ limit });
  }
}
