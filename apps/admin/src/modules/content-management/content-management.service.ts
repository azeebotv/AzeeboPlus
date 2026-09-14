import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ListContentOptions {
  page: number;
  limit: number;
  status?: string;
  universeId?: string;
  creatorId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ContentStats {
  total: number;
  byStatus: Record<string, number>;
  byUniverse: { universeId: string; universeName: string; count: number }[];
  createdLast7Days: number;
  createdLast30Days: number;
}

interface AuditLogFilters {
  page: number;
  limit: number;
  action?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ContentManagementService {
  private readonly logger = new Logger(ContentManagementService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  // ─── Content List ────────────────────────────────────────────────────────

  async listContent(opts: ListContentOptions) {
    const { page, limit, status, universeId, creatorId, search, startDate, endDate } = opts;
    const offset = (page - 1) * limit;

    const where: Prisma.ContentItemWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }
    if (universeId) {
      where.universeId = universeId;
    }
    if (creatorId) {
      where.creatorId = creatorId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, displayName: true, email: true } },
          universe: { select: { id: true, name: true, displayName: true } },
          categories: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        views: c.viewCount,
        creator: c.creator
          ? { id: c.creator.id, name: c.creator.displayName, email: c.creator.email }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  // ─── Content By ID ───────────────────────────────────────────────────────

  async getContentById(id: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, email: true, avatar: true } },
        universe: true,
        categories: true,
        tags: true,
        mediaAsset: true,
        relationshipsAsContent: {
          include: {
            relatedContent: { select: { id: true, title: true, thumbnail: true, status: true } },
          },
        },
        relationshipsAsRelatedContent: {
          include: {
            content: { select: { id: true, title: true, thumbnail: true, status: true } },
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with id "${id}" not found`);
    }

    return content;
  }

  // ─── Create Content ──────────────────────────────────────────────────────

  async createContent(data: Record<string, unknown>) {
    const {
      title,
      description,
      thumbnail,
      mediaUrl,
      universeId,
      creatorId,
      status,
      metadata,
      releaseDate,
      theatricalReleaseDate,
      streamingReleaseDate,
      windowEndDate,
      windowType,
      isExclusive,
      isPremiere,
      categoryIds,
      tagIds,
    } = data as {
      title: string;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      universeId: string;
      creatorId: string;
      status?: string;
      metadata?: Record<string, unknown>;
      releaseDate?: string;
      theatricalReleaseDate?: string;
      streamingReleaseDate?: string;
      windowEndDate?: string;
      windowType?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
      categoryIds?: string[];
      tagIds?: string[];
    };

    if (!title || !universeId || !creatorId) {
      throw new BadRequestException('title, universeId, and creatorId are required');
    }

    const content = await this.prisma.contentItem.create({
      data: {
        title,
        description: description ?? null,
        thumbnail: thumbnail ?? '',
        mediaUrl: mediaUrl ?? null,
        universeId,
        creatorId,
        status: status ?? 'draft',
        metadata: (metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        theatricalReleaseDate: theatricalReleaseDate ? new Date(theatricalReleaseDate) : null,
        streamingReleaseDate: streamingReleaseDate ? new Date(streamingReleaseDate) : null,
        windowEndDate: windowEndDate ? new Date(windowEndDate) : null,
        windowType: (windowType as string) ?? 'standard',
        isExclusive: isExclusive ?? false,
        isPremiere: isPremiere ?? false,
        ...(categoryIds?.length
          ? { categories: { connect: categoryIds.map((id) => ({ id })) } }
          : {}),
        ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: {
        creator: { select: { id: true, displayName: true, email: true } },
        universe: { select: { id: true, name: true, displayName: true } },
        categories: true,
        tags: true,
      },
    });

    await this.auditService.log({
      actorId: creatorId,
      action: 'create_content',
      targetType: 'content',
      targetId: content.id,
      details: { title, status: content.status, universeId },
    });

    this.logger.log(`Created content ${content.id}: ${title}`);
    return content;
  }

  // ─── Update Content ──────────────────────────────────────────────────────

  async updateContent(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Content with id "${id}" not found`);
    }

    // Store version snapshot before update
    await this.storeVersionSnapshot(existing);

    const {
      title,
      description,
      thumbnail,
      mediaUrl,
      universeId,
      status,
      metadata,
      releaseDate,
      theatricalReleaseDate,
      streamingReleaseDate,
      windowEndDate,
      windowType,
      isExclusive,
      isPremiere,
      categoryIds,
      tagIds,
      creatorId,
    } = data as {
      title?: string;
      description?: string;
      thumbnail?: string;
      mediaUrl?: string;
      universeId?: string;
      status?: string;
      metadata?: Record<string, unknown>;
      releaseDate?: string;
      theatricalReleaseDate?: string;
      streamingReleaseDate?: string;
      windowEndDate?: string;
      windowType?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
      categoryIds?: string[];
      tagIds?: string[];
      creatorId?: string;
    };

    const updateData: Prisma.ContentItemUpdateInput = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
    if (universeId !== undefined) updateData.universe = { connect: { id: universeId } };
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (metadata !== undefined) updateData.metadata = metadata as Prisma.InputJsonValue;
    if (releaseDate !== undefined)
      updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
    if (theatricalReleaseDate !== undefined)
      updateData.theatricalReleaseDate = theatricalReleaseDate
        ? new Date(theatricalReleaseDate)
        : null;
    if (streamingReleaseDate !== undefined)
      updateData.streamingReleaseDate = streamingReleaseDate
        ? new Date(streamingReleaseDate)
        : null;
    if (windowEndDate !== undefined)
      updateData.windowEndDate = windowEndDate ? new Date(windowEndDate) : null;
    if (windowType !== undefined) updateData.windowType = windowType;
    if (isExclusive !== undefined) updateData.isExclusive = isExclusive;
    if (isPremiere !== undefined) updateData.isPremiere = isPremiere;

    if (categoryIds !== undefined) {
      updateData.categories = { set: categoryIds.map((cid) => ({ id: cid })) };
    }
    if (tagIds !== undefined) {
      updateData.tags = { set: tagIds.map((tid) => ({ id: tid })) };
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, displayName: true, email: true } },
        universe: { select: { id: true, name: true, displayName: true } },
        categories: true,
        tags: true,
      },
    });

    await this.auditService.log({
      actorId: creatorId ?? existing.creatorId,
      action: 'update_content',
      targetType: 'content',
      targetId: id,
      details: {
        title: updated.title,
        previousStatus: existing.status,
        newStatus: updated.status,
        changedFields: Object.keys(updateData),
      },
    });

    this.logger.log(`Updated content ${id}`);
    return updated;
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  async deleteContent(id: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with id "${id}" not found`);
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'archived' },
    });

    await this.auditService.log({
      action: 'archive_content',
      targetType: 'content',
      targetId: id,
      details: { title: content.title, previousStatus: content.status },
    });

    this.logger.log(`Archived content ${id}`);
    return { success: true, message: 'Content archived successfully', data: updated };
  }

  // ─── Publish / Unpublish ─────────────────────────────────────────────────

  async publishContent(id: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with id "${id}" not found`);
    }
    if (content.status === 'published') {
      throw new BadRequestException('Content is already published');
    }

    await this.storeVersionSnapshot(content);

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    });

    await this.auditService.log({
      action: 'publish_content',
      targetType: 'content',
      targetId: id,
      details: { title: content.title, previousStatus: content.status },
    });

    this.logger.log(`Published content ${id}`);
    return { success: true, data: updated };
  }

  async unpublishContent(id: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with id "${id}" not found`);
    }
    if (content.status !== 'published') {
      throw new BadRequestException('Content is not currently published');
    }

    await this.storeVersionSnapshot(content);

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'draft' },
    });

    await this.auditService.log({
      action: 'unpublish_content',
      targetType: 'content',
      targetId: id,
      details: { title: content.title, previousStatus: 'published' },
    });

    this.logger.log(`Unpublished content ${id}`);
    return { success: true, data: updated };
  }

  // ─── Bulk Operations ─────────────────────────────────────────────────────

  async bulkUpdateStatus(ids: string[], status: string) {
    if (!ids.length) throw new BadRequestException('ids array is required');
    if (!status) throw new BadRequestException('status is required');

    const allowedStatuses = ['draft', 'published', 'archived'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const items = await tx.contentItem.findMany({ where: { id: { in: ids } } });

      if (items.length !== ids.length) {
        const foundIds = new Set(items.map((i) => i.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Content not found: ${missing.join(', ')}`);
      }

      const updateData: Prisma.ContentItemUpdateManyMutationInput = { status };
      if (status === 'published') {
        updateData.publishedAt = new Date();
      }

      await tx.contentItem.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });

      for (const item of items) {
        await this.auditService.log({
          action: 'bulk_update_status',
          targetType: 'content',
          targetId: item.id,
          details: { title: item.title, previousStatus: item.status, newStatus: status },
        });
      }

      return { updated: ids.length, status };
    });

    this.logger.log(`Bulk updated ${result.updated} items to status "${status}"`);
    return { success: true, ...result };
  }

  async bulkDelete(ids: string[]) {
    if (!ids.length) throw new BadRequestException('ids array is required');

    const result = await this.prisma.$transaction(async (tx) => {
      const items = await tx.contentItem.findMany({ where: { id: { in: ids } } });

      if (items.length !== ids.length) {
        const foundIds = new Set(items.map((i) => i.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Content not found: ${missing.join(', ')}`);
      }

      await tx.contentItem.updateMany({
        where: { id: { in: ids } },
        data: { status: 'archived' },
      });

      for (const item of items) {
        await this.auditService.log({
          action: 'bulk_archive_content',
          targetType: 'content',
          targetId: item.id,
          details: { title: item.title, previousStatus: item.status },
        });
      }

      return { deleted: ids.length };
    });

    this.logger.log(`Bulk archived ${result.deleted} items`);
    return { success: true, ...result };
  }

  // ─── Category CRUD ───────────────────────────────────────────────────────

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { contentItems: true } } },
    });
    return categories;
  }

  async createCategory(data: Record<string, unknown>) {
    const { name, slug, description, icon, color } = data as {
      name: string;
      slug?: string;
      description?: string;
      icon?: string;
      color?: string;
    };

    if (!name) throw new BadRequestException('name is required');

    const generatedSlug =
      slug ??
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existing = await this.prisma.category.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      throw new BadRequestException(`Category with slug "${generatedSlug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        slug: generatedSlug,
        description: description ?? null,
        icon: icon ?? null,
        color: color ?? null,
      },
    });

    await this.auditService.log({
      action: 'create_category',
      targetType: 'category',
      targetId: category.id,
      details: { name, slug: generatedSlug },
    });

    this.logger.log(`Created category ${category.id}: ${name}`);
    return category;
  }

  async updateCategory(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    const { name, slug, description, icon, color } = data as {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      color?: string;
    };

    if (slug && slug !== existing.slug) {
      const slugTaken = await this.prisma.category.findUnique({ where: { slug } });
      if (slugTaken) {
        throw new BadRequestException(`Slug "${slug}" is already taken`);
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });

    await this.auditService.log({
      action: 'update_category',
      targetType: 'category',
      targetId: id,
      details: { name: category.name, slug: category.slug },
    });

    this.logger.log(`Updated category ${id}`);
    return category;
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { contentItems: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    await this.prisma.category.delete({ where: { id } });

    await this.auditService.log({
      action: 'delete_category',
      targetType: 'category',
      targetId: id,
      details: { name: existing.name, contentCount: existing._count.contentItems },
    });

    this.logger.log(`Deleted category ${id}`);
    return { success: true, message: 'Category deleted successfully' };
  }

  // ─── Tag CRUD ────────────────────────────────────────────────────────────

  async listTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { contentItems: true } } },
    });
    return tags;
  }

  async createTag(data: Record<string, unknown>) {
    const { name, description } = data as { name: string; description?: string };

    if (!name) throw new BadRequestException('name is required');

    const existing = await this.prisma.tag.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Tag "${name}" already exists`);
    }

    const tag = await this.prisma.tag.create({
      data: {
        name,
        description: description ?? null,
      },
    });

    await this.auditService.log({
      action: 'create_tag',
      targetType: 'tag',
      targetId: tag.id,
      details: { name },
    });

    this.logger.log(`Created tag ${tag.id}: ${name}`);
    return tag;
  }

  async deleteTag(id: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { contentItems: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Tag with id "${id}" not found`);
    }

    await this.prisma.tag.delete({ where: { id } });

    await this.auditService.log({
      action: 'delete_tag',
      targetType: 'tag',
      targetId: id,
      details: { name: existing.name, contentCount: existing._count.contentItems },
    });

    this.logger.log(`Deleted tag ${id}`);
    return { success: true, message: 'Tag deleted successfully' };
  }

  // ─── Statistics ──────────────────────────────────────────────────────────

  async getStats(): Promise<ContentStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, statusCounts, universeCounts, createdLast7Days, createdLast30Days] =
      await Promise.all([
        this.prisma.contentItem.count(),
        this.prisma.contentItem.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        this.prisma.contentItem.groupBy({
          by: ['universeId'],
          _count: { id: true },
        }),
        this.prisma.contentItem.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.contentItem.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = row._count.id;
    }

    const universeIds = universeCounts.map((u) => u.universeId);
    const universes = await this.prisma.universe.findMany({
      where: { id: { in: universeIds } },
      select: { id: true, name: true },
    });
    const universeMap = new Map(universes.map((u) => [u.id, u.name]));

    const byUniverse = universeCounts.map((u) => ({
      universeId: u.universeId,
      universeName: universeMap.get(u.universeId) ?? 'Unknown',
      count: u._count.id,
    }));

    return {
      total,
      byStatus,
      byUniverse,
      createdLast7Days,
      createdLast30Days,
    };
  }

  // ─── Audit Logs ──────────────────────────────────────────────────────────

  async getAuditLogs(filters: AuditLogFilters) {
    const { page, limit, action, targetId, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) where.action = action;
    if (targetId) where.targetId = targetId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Version History ─────────────────────────────────────────────────────

  async getVersionHistory(contentId: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException(`Content with id "${contentId}" not found`);
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        targetType: 'content',
        targetId: contentId,
        action: {
          in: [
            'create_content',
            'update_content',
            'publish_content',
            'unpublish_content',
            'archive_content',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      contentId,
      title: content.title,
      versions: logs.map((log) => ({
        action: log.action,
        details: log.details,
        actorId: log.actorId,
        timestamp: log.createdAt,
      })),
    };
  }

  // ─── Internal: Version Snapshot ──────────────────────────────────────────

  private async storeVersionSnapshot(content: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    universeId: string;
    creatorId: string;
    metadata: Prisma.JsonValue;
    updatedAt: Date;
  }) {
    await this.auditService.log({
      actorId: content.creatorId,
      action: 'version_snapshot',
      targetType: 'content',
      targetId: content.id,
      details: {
        snapshot: {
          title: content.title,
          description: content.description,
          status: content.status,
          universeId: content.universeId,
          metadata: content.metadata,
          capturedAt: content.updatedAt.toISOString(),
        },
      },
    });
  }
}
