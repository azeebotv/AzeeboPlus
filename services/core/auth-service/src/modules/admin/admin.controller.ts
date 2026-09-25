import { Inject, Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';
import { Request } from 'express';

@ApiTags('Admin - Auth Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get auth service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Auth service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated user list (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string
  ) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.adminService.getUsers({ page, limit: clampedLimit, role, status });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user detail (admin)' })
  @ApiResponse({ status: 200, description: 'User detail' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (admin)' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async suspendUser(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as { user?: { sub?: string } }).user?.sub;
    return this.adminService.suspendUser(id, actorId, req.ip);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Reactivate a user (admin)' })
  @ApiResponse({ status: 200, description: 'User activated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async activateUser(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req as { user?: { sub?: string } }).user?.sub;
    return this.adminService.activateUser(id, actorId, req.ip);
  }
}
