import { Inject, Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, realityFlags } from '@azeebo/feature-flags';

@ApiTags('Admin - Reality Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('reality-shows')
  @ApiOperation({ summary: 'Get all reality shows (admin)' })
  @ApiResponse({ status: 200, description: 'List of reality shows' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllRealityShows(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getAllRealityShows({ page, limit, status });
  }

  @Put('reality-shows/:showId/status')
  @ApiOperation({ summary: 'Update reality show status (admin)' })
  @ApiResponse({ status: 200, description: 'Reality show status updated' })
  @ApiResponse({ status: 404, description: 'Show not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateRealityShowStatus(
    @Param('showId') showId: string,
    @Body() body: { status: string; reason?: string }
  ) {
    return this.adminService.updateRealityShowStatus(showId, body.status, body.reason);
  }

  @Get('reality-shows/:showId')
  @ApiOperation({ summary: 'Get reality show details (admin)' })
  @ApiResponse({ status: 200, description: 'Reality show details' })
  @ApiResponse({ status: 404, description: 'Show not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRealityShowById(@Param('showId') showId: string) {
    return this.adminService.getRealityShowById(showId);
  }

  @Post('reality-shows/:showId/auto-eliminate')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(realityFlags.autoElimination)
  @ApiOperation({
    summary: 'Eliminate the lowest-voted contestant (admin; reality_auto_elimination)',
  })
  @ApiResponse({ status: 201, description: 'Contestant eliminated' })
  @ApiResponse({ status: 400, description: 'Show has fewer than 2 contestants' })
  @ApiResponse({ status: 403, description: 'Flag off, or forbidden' })
  async autoEliminate(@Param('showId') showId: string) {
    return this.adminService.autoEliminate(showId);
  }
}
