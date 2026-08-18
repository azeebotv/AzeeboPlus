import { Injectable, Inject } from '@nestjs/common';
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
    const realityUniverse = await this.prisma.universe.findFirst({
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
}
