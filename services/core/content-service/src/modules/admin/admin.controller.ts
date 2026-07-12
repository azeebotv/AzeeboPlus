import { Inject, Controller, Get, Put, Delete, Param, Body, Query, UseGuards  } from '@nestjs/common';
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
}
