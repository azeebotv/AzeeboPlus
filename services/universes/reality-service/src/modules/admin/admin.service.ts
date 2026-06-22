import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllRealityShows(options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where = options?.status ? { status: options.status } : {};

    const [shows, total] = await Promise.all([
      this.prisma.realityShow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.realityShow.count({ where }),
    ]);

    return {
      shows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRealityShowById(showId: string) {
    const show = await this.prisma.realityShow.findUnique({
      where: { id: showId },
      include: {
        episodes: {
          take: 10,
          orderBy: { number: 'desc' },
        },
        contestants: true,
      },
    });

    if (!show) {
      throw new NotFoundException('Reality show not found');
    }

    return show;
  }

  async updateRealityShowStatus(showId: string, status: string, reason?: string) {
    const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Reality show not found');
    }

    const updated = await this.prisma.realityShow.update({
      where: { id: showId },
      data: { status },
    });

    // Note: Audit logging would require an auditLog model in the schema
    // For now, we'll just return the updated show

    return updated;
  }
}
