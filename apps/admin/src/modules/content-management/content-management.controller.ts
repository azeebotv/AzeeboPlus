import { Controller, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ContentManagementService } from './content-management.service';

@Controller('admin/content')
export class ContentManagementController {
  constructor(private readonly contentService: ContentManagementService) {}

  @Get()
  async getContent(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('universe') universe?: string,
    @Query('search') search?: string
  ): Promise<unknown> {
    return this.contentService.getContent(Number(page), Number(limit), status, universe, search);
  }

  @Get('stats')
  async getContentStats(): Promise<unknown> {
    return this.contentService.getContentStats();
  }

  @Get('universes')
  async getUniverses(): Promise<unknown> {
    return this.contentService.getUniverses();
  }

  @Get(':id')
  async getContentById(@Param('id') id: string): Promise<unknown> {
    return this.contentService.getContentById(id);
  }

  @Put(':id/status')
  async updateContentStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ): Promise<unknown> {
    return this.contentService.updateContentStatus(id, body.status);
  }

  @Delete(':id')
  async deleteContent(@Param('id') id: string): Promise<unknown> {
    return this.contentService.deleteContent(id);
  }
}
