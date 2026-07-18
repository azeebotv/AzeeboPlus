import { Inject, Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Admin - Media Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get media service stats (admin)' })
  @ApiResponse({ status: 200, description: 'Media service stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return ApiResponseWrapper.success(stats);
  }

  @Get('uploads')
  @ApiOperation({ summary: 'Get paginated uploads (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated uploads' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUploads(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUploads({ page, limit });
  }

  @Delete('uploads/:id')
  @ApiOperation({ summary: 'Delete upload by id (admin)' })
  @ApiResponse({ status: 200, description: 'Upload deleted' })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteUpload(@Param('id') id: string) {
    const result = await this.adminService.deleteUpload(id);
    return ApiResponseWrapper.success(result);
  }
}
