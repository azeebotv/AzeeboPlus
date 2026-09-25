import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Reality shows admin service.
 *
 * Reality shows are ContentItems belonging to the "reality" universe.
 * This service provides admin management of those shows.
 */
@Injectable()
export class RealityShowsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getShows() {
    // Find the reality universe
    const realityUniverse = await this.prisma.universe.findUnique({
      where: { name: 'reality' },
    });

    if (!realityUniverse) {
      return { items: [], total: 0 };
    }

    const shows = await this.prisma.contentItem.findMany({
      where: { universeId: realityUniverse.id },
      include: {
        creator: { select: { id: true, displayName: true, email: true } },
        mediaAsset: { select: { id: true, originalUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: shows.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        viewCount: s.viewCount,
        isExclusive: s.isExclusive,
        isPremiere: s.isPremiere,
        creator: s.creator,
        mediaUrl: s.mediaAsset?.originalUrl,
        publishedAt: s.publishedAt?.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      total: shows.length,
    };
  }

  async updateShowStatus(id: string, status: string) {
    const show = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!show) {
      throw new Error(`Show ${id} not found`);
    }

    const validStatuses = ['draft', 'published', 'archived', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: {
        status,
        ...(status === 'published' && !show.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      publishedAt: updated.publishedAt?.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /** Create a show (a ContentItem in the reality universe). */
  async createShow(data: {
    title: string;
    description?: string;
    creatorId?: string;
    thumbnail?: string;
    isExclusive?: boolean;
    isPremiere?: boolean;
  }) {
    if (!data.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    const realityUniverse = await this.prisma.universe.findUnique({
      where: { name: 'reality' },
    });
    if (!realityUniverse) {
      throw new NotFoundException('Reality universe does not exist — seed universes first');
    }
    // Creator is required by the schema; default to the seeded demo creator
    // unless an admin picks one.
    let creatorId = data.creatorId;
    if (!creatorId) {
      const anyCreator = await this.prisma.user.findFirst({ where: { role: 'creator' } });
      if (!anyCreator) {
        throw new BadRequestException('No creator exists to own the show — pass creatorId');
      }
      creatorId = anyCreator.id;
    }

    const created = await this.prisma.contentItem.create({
      data: {
        title: data.title.trim(),
        description: data.description,
        thumbnail: data.thumbnail || '/images/placeholders/thumbnails/16x9_01.png',
        universeId: realityUniverse.id,
        creatorId,
        status: 'draft',
        isExclusive: data.isExclusive ?? false,
        isPremiere: data.isPremiere ?? false,
      },
    });
    return { id: created.id, title: created.title, status: created.status };
  }

  /** Update a show's editable fields. */
  async updateShow(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
    }
  ) {
    const show = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!show) throw new NotFoundException(`Show ${id} not found`);

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) {
      if (!data.title.trim()) throw new BadRequestException('Title cannot be empty');
      patch.title = data.title.trim();
    }
    if (data.description !== undefined) patch.description = data.description;
    if (data.isExclusive !== undefined) patch.isExclusive = data.isExclusive;
    if (data.isPremiere !== undefined) patch.isPremiere = data.isPremiere;
    if (data.status !== undefined) {
      const validStatuses = ['draft', 'published', 'archived', 'suspended'];
      if (!validStatuses.includes(data.status)) {
        throw new BadRequestException(
          `Invalid status: ${data.status}. Must be one of: ${validStatuses.join(', ')}`
        );
      }
      patch.status = data.status;
      if (data.status === 'published' && !show.publishedAt) patch.publishedAt = new Date();
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No editable fields supplied');
    }

    const updated = await this.prisma.contentItem.update({ where: { id }, data: patch });
    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /** Delete a show. */
  async deleteShow(id: string) {
    const show = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!show) throw new NotFoundException(`Show ${id} not found`);
    await this.prisma.contentItem.delete({ where: { id } });
    return { success: true, id };
  }
}
