import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ContentManagementService } from './content-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentManagementController {
  private readonly logger = new Logger(ContentManagementController.name);

  constructor(private readonly contentService: ContentManagementService) {}

  // ─── Content CRUD ──────────────────────────────────────────────────────────

  @Get()
  async listContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('universeId') universeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.contentService.listContent({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      universeId,
      creatorId,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('stats')
  async getStats(): Promise<unknown> {
    return this.contentService.getStats();
  }

  @Get('categories')
  async listCategories() {
    return this.contentService.listCategories();
  }

  @Get('tags')
  async listTags() {
    return this.contentService.listTags();
  }

  @Get('audit')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.contentService.getAuditLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      action,
      targetId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('versions/:id')
  async getVersionHistory(@Param('id') id: string) {
    return this.contentService.getVersionHistory(id);
  }

  @Get(':id')
  async getContentById(@Param('id') id: string) {
    return this.contentService.getContentById(id);
  }

  // ─── Content Mutations ─────────────────────────────────────────────────────

  @Post()
  async createContent(@Body() body: Record<string, unknown>) {
    this.logger.log(`Creating content: ${body.title}`);
    return this.contentService.createContent(body);
  }

  @Patch(':id')
  async updateContent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    this.logger.log(`Updating content: ${id}`);
    return this.contentService.updateContent(id, body);
  }

  @Delete(':id')
  async deleteContent(@Param('id') id: string) {
    this.logger.log(`Soft-deleting content: ${id}`);
    return this.contentService.deleteContent(id);
  }

  @Post(':id/publish')
  async publishContent(@Param('id') id: string) {
    this.logger.log(`Publishing content: ${id}`);
    return this.contentService.publishContent(id);
  }

  @Post(':id/unpublish')
  async unpublishContent(@Param('id') id: string) {
    this.logger.log(`Unpublishing content: ${id}`);
    return this.contentService.unpublishContent(id);
  }

  // ─── Bulk Operations ───────────────────────────────────────────────────────

  @Post('bulk/status')
  async bulkUpdateStatus(@Body() body: { ids: string[]; status: string }) {
    this.logger.log(`Bulk updating status for ${body.ids.length} items`);
    return this.contentService.bulkUpdateStatus(body.ids, body.status);
  }

  @Post('bulk/delete')
  async bulkDelete(@Body() body: { ids: string[] }) {
    this.logger.log(`Bulk soft-deleting ${body.ids.length} items`);
    return this.contentService.bulkDelete(body.ids);
  }

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  @Post('categories')
  async createCategory(@Body() body: Record<string, unknown>) {
    this.logger.log(`Creating category: ${body.name}`);
    return this.contentService.createCategory(body);
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    this.logger.log(`Updating category: ${id}`);
    return this.contentService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    this.logger.log(`Deleting category: ${id}`);
    return this.contentService.deleteCategory(id);
  }

  // ─── Tag CRUD ──────────────────────────────────────────────────────────────

  @Post('tags')
  async createTag(@Body() body: Record<string, unknown>) {
    this.logger.log(`Creating tag: ${body.name}`);
    return this.contentService.createTag(body);
  }

  @Delete('tags/:id')
  async deleteTag(@Param('id') id: string) {
    this.logger.log(`Deleting tag: ${id}`);
    return this.contentService.deleteTag(id);
  }
}
