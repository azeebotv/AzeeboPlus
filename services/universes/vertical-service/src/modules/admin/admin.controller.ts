import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Vertical Service')
@Controller('v1/vertical/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Aggregate statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('titles')
  @ApiOperation({ summary: 'Get paginated titles (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated title list' })
  async getTitles(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getTitles({ page, limit });
  }

  @Get('characters')
  @ApiOperation({ summary: 'Get paginated characters (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated character list' })
  async getCharacters(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getCharacters({ page, limit });
  }
}
