import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Content Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get content service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Content service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getContentStats() {
    return this.adminService.getContentStats();
  }

  @Get('content')
  @ApiOperation({ summary: 'Get all content (admin)' })
  @ApiResponse({ status: 200, description: 'List of content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllContent(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('universeId') universeId?: string
  ) {
    return this.adminService.getAllContent({ page, limit, status, universeId });
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get content details (admin)' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getContentById(@Param('contentId') contentId: string) {
    return this.adminService.getContentById(contentId);
  }

  @Put('content/:contentId/status')
  @ApiOperation({ summary: 'Update content status (admin)' })
  @ApiResponse({ status: 200, description: 'Content status updated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateContentStatus(
    @Param('contentId') contentId: string,
    @Body() body: { status: string }
  ) {
    return this.adminService.updateContentStatus(contentId, body.status);
  }

  @Delete('content/:contentId')
  @ApiOperation({ summary: 'Delete content (admin)' })
  @ApiResponse({ status: 200, description: 'Content deleted' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteContent(@Param('contentId') contentId: string) {
    return this.adminService.deleteContent(contentId);
  }

  @Get('universes')
  @ApiOperation({ summary: 'Get all universes (admin)' })
  @ApiResponse({ status: 200, description: 'List of universes' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUniverses() {
    return this.adminService.getUniverses();
  }

  @Get('content/:contentId/comments')
  @ApiOperation({ summary: 'Get comments for content (admin)' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getContentComments(
    @Param('contentId') contentId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.adminService.getCommentsByContentId(contentId, { page, limit });
  }

  // --- Feature Flags ---

  @Get('feature-flags')
  @ApiOperation({ summary: 'List all feature flags (admin)' })
  @ApiResponse({ status: 200, description: 'List of feature flags' })
  async listFeatureFlags() {
    return this.adminService.listFeatureFlags();
  }

  @Post('feature-flags')
  @ApiOperation({ summary: 'Create a feature flag (admin)' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  async createFeatureFlag(
    @Body()
    body: {
      key: string;
      enabled?: boolean;
      description?: string;
      rolloutPercentage?: number;
      userIds?: string[];
    }
  ) {
    return this.adminService.createFeatureFlag(body);
  }

  @Put('feature-flags/:key')
  @ApiOperation({ summary: 'Update a feature flag (admin)' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body()
    body: {
      enabled?: boolean;
      description?: string;
      rolloutPercentage?: number;
      userIds?: string[];
    }
  ) {
    return this.adminService.updateFeatureFlag(key, body);
  }

  @Delete('feature-flags/:key')
  @ApiOperation({ summary: 'Delete a feature flag (admin)' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async deleteFeatureFlag(@Param('key') key: string) {
    return this.adminService.deleteFeatureFlag(key);
  }

  @Post('feature-flags/:key/toggle')
  @ApiOperation({ summary: 'Toggle a feature flag (admin)' })
  @ApiResponse({ status: 200, description: 'Feature flag toggled' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async toggleFeatureFlag(@Param('key') key: string) {
    return this.adminService.toggleFeatureFlag(key);
  }

  // --- Universe Feature Flags ---

  @Get('universes/:universeId/flags')
  @ApiOperation({ summary: 'Get feature flags for a universe (admin)' })
  @ApiResponse({ status: 200, description: 'Universe feature flags' })
  async getUniverseFlags(@Param('universeId') universeId: string) {
    return this.adminService.getUniverseFlags(universeId);
  }

  @Put('universes/:universeId/flags/:featureKey')
  @ApiOperation({ summary: 'Update a universe feature flag (admin)' })
  @ApiResponse({ status: 200, description: 'Flag updated' })
  async updateUniverseFlag(
    @Param('universeId') universeId: string,
    @Param('featureKey') featureKey: string,
    @Body() body: { isEnabled?: boolean; metadata?: Record<string, unknown> }
  ) {
    return this.adminService.updateUniverseFlag(universeId, featureKey, body);
  }

  // --- Geo Restrictions ---

  @Get('geo-restrictions')
  @ApiOperation({ summary: 'List geo restrictions (admin)' })
  async listGeoRestrictions() {
    return this.adminService.listGeoRestrictions();
  }

  @Post('geo-restrictions')
  @ApiOperation({ summary: 'Create geo restriction (admin)' })
  async createGeoRestriction(
    @Body()
    body: {
      countryCode: string;
      countryName: string;
      blockedContent?: string[];
      notes?: string;
    }
  ) {
    return this.adminService.createGeoRestriction(body);
  }

  @Put('geo-restrictions/:id')
  @ApiOperation({ summary: 'Update geo restriction (admin)' })
  async updateGeoRestriction(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; blockedContent?: string[]; notes?: string }
  ) {
    return this.adminService.updateGeoRestriction(id, body);
  }

  @Delete('geo-restrictions/:id')
  @ApiOperation({ summary: 'Delete geo restriction (admin)' })
  async deleteGeoRestriction(@Param('id') id: string) {
    return this.adminService.deleteGeoRestriction(id);
  }

  @Put('content/:contentId/geo')
  @ApiOperation({ summary: 'Update content geo restrictions (admin)' })
  async updateContentGeo(
    @Param('contentId') contentId: string,
    @Body()
    body: {
      allowedCountries?: string[];
      blockedCountries?: string[];
      contentRating?: string;
      minAge?: number;
    }
  ) {
    return this.adminService.updateContentGeo(contentId, body);
  }
}
