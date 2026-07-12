import { Inject, Controller, Get, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Recommendation Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get recommendation service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Recommendation statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('models')
  @ApiOperation({ summary: 'List recommendation models/strategies (admin)' })
  @ApiResponse({ status: 200, description: 'List of recommendation models' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getModels() {
    return this.adminService.getModels();
  }
}
