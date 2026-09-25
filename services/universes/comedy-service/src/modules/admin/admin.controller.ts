import { Inject, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Comedy Service')
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

  @Get('clips')
  @ApiOperation({ summary: 'Get paginated comedy clips (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated clip list' })
  async getClips(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getClips({ page, limit });
  }

  @Get('comedians')
  @ApiOperation({ summary: 'Get paginated comedians (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated comedian list' })
  async getComedians(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getComedians({ page, limit });
  }
}
