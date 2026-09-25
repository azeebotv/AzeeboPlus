import { Inject, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Lifestyle Service')
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

  @Get('content')
  @ApiOperation({ summary: 'Get paginated stories and events (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated content list' })
  async getContent(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getContent({ page, limit });
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated users (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUsers({ page, limit });
  }
}
