import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Admin - Analytics Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get analytics service stats (admin)' })
  @ApiResponse({ status: 200, description: 'Analytics service stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return ApiResponseWrapper.success(stats);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get paginated events (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'eventName', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated events' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('eventName') eventName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getEvents({ page, limit, eventName, startDate, endDate });
  }

  @Get('event-names')
  @ApiOperation({ summary: 'List unique event names (admin)' })
  @ApiResponse({ status: 200, description: 'Unique event names' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getEventNames() {
    const names = await this.adminService.getEventNames();
    return ApiResponseWrapper.success(names);
  }
}
