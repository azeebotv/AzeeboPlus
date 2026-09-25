import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ContentReviewService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getContentReviewQueue(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { status: { in: ['draft', 'processing'] } },
        skip,
        take: limit,
        include: {
          creator: { select: { id: true, displayName: true, avatar: true } },
          universe: { select: { id: true, name: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contentItem.count({ where: { status: { in: ['draft', 'processing'] } } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async approveContent(contentId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    return this.prisma.contentItem.update({
      where: { id: contentId },
      data: { status: 'published', publishedAt: new Date() },
    });
  }

  async rejectContent(contentId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    return this.prisma.contentItem.update({
      where: { id: contentId },
      data: { status: 'archived' },
    });
  }
}
