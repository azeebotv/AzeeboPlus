import { Inject,
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
  Req,
  Logger,
 } from '@nestjs/common';
import { Request } from 'express';
import { ContentManagementService } from './content-management.service';
import { AuditLogService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateContentDto, UpdateContentDto } from './dto/create-content.dto';
import { resolveActorId } from '../../common/resolve-actor-id';

interface AuthRequest extends Request {
  user: { id?: string; sub?: string; email: string; role: string };
}

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class ContentManagementController {
  private readonly logger = new Logger(ContentManagementController.name);

  constructor(
    @Inject(ContentManagementService) private readonly contentService: ContentManagementService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

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
    @Query('endDate') endDate?: string
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
    @Query('endDate') endDate?: string
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
  async createContent(@Req() req: AuthRequest, @Body() body: CreateContentDto) {
    this.logger.log(`Creating content: ${body.title}`);
    const result = await this.contentService.createContent(body as unknown as Record<string, unknown>);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.created',
      targetType: 'content',
      details: { title: body.title },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(':id')
  async updateContent(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: UpdateContentDto
  ) {
    this.logger.log(`Updating content: ${id}`);
    const result = await this.contentService.updateContent(id, body as unknown as Record<string, unknown>);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.updated',
      targetType: 'content',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(':id')
  async deleteContent(@Param('id') id: string, @Req() req: AuthRequest) {
    this.logger.log(`Soft-deleting content: ${id}`);
    const result = await this.contentService.deleteContent(id);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.deleted',
      targetType: 'content',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(':id/publish')
  async publishContent(@Param('id') id: string, @Req() req: AuthRequest) {
    this.logger.log(`Publishing content: ${id}`);
    const result = await this.contentService.publishContent(id);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.published',
      targetType: 'content',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(':id/unpublish')
  async unpublishContent(@Param('id') id: string, @Req() req: AuthRequest) {
    this.logger.log(`Unpublishing content: ${id}`);
    const result = await this.contentService.unpublishContent(id);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.unpublished',
      targetType: 'content',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  // ─── Bulk Operations ───────────────────────────────────────────────────────

  @Post('bulk/status')
  async bulkUpdateStatus(@Req() req: AuthRequest, @Body() body: { ids: string[]; status: string }) {
    this.logger.log(`Bulk updating status for ${body.ids.length} items`);
    const result = await this.contentService.bulkUpdateStatus(body.ids, body.status);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.bulk_status_updated',
      targetType: 'content',
      details: { count: body.ids.length, status: body.status },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('bulk/delete')
  async bulkDelete(@Req() req: AuthRequest, @Body() body: { ids: string[] }) {
    this.logger.log(`Bulk soft-deleting ${body.ids.length} items`);
    const result = await this.contentService.bulkDelete(body.ids);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.bulk_deleted',
      targetType: 'content',
      details: { count: body.ids.length },
      ipAddress: req.ip,
    });
    return result;
  }

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  @Post('categories')
  async createCategory(@Req() req: AuthRequest, @Body() body: Record<string, unknown>) {
    this.logger.log(`Creating category: ${body.name}`);
    const result = await this.contentService.createCategory(body);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.category.created',
      targetType: 'category',
      details: { name: body.name },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: Record<string, unknown>
  ) {
    this.logger.log(`Updating category: ${id}`);
    const result = await this.contentService.updateCategory(id, body);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.category.updated',
      targetType: 'category',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @Req() req: AuthRequest) {
    this.logger.log(`Deleting category: ${id}`);
    const result = await this.contentService.deleteCategory(id);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.category.deleted',
      targetType: 'category',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  // ─── Tag CRUD ──────────────────────────────────────────────────────────────

  @Post('tags')
  async createTag(@Req() req: AuthRequest, @Body() body: Record<string, unknown>) {
    this.logger.log(`Creating tag: ${body.name}`);
    const result = await this.contentService.createTag(body);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.tag.created',
      targetType: 'tag',
      details: { name: body.name },
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete('tags/:id')
  async deleteTag(@Param('id') id: string, @Req() req: AuthRequest) {
    this.logger.log(`Deleting tag: ${id}`);
    const result = await this.contentService.deleteTag(id);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'content.tag.deleted',
      targetType: 'tag',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }
}
