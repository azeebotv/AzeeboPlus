import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalClips, totalComedians, totalSpecials, clipsByViews] = await Promise.all([
        this.prisma.comedyClip.count(),
        this.prisma.comedianProfile.count(),
        this.prisma.comedySpecial.count(),
        this.prisma.comedyClip.aggregate({ _sum: { viewCount: true } }),
      ]);

      return {
        totalClips,
        totalComedians,
        totalSpecials,
        totalClipViews: clipsByViews._sum.viewCount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getClips(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [clips, total] = await Promise.all([
        this.prisma.comedyClip.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.comedyClip.count(),
      ]);

      return { clips, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get clips: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getComedians(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [comedians, total] = await Promise.all([
        this.prisma.comedianProfile.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.comedianProfile.count(),
      ]);

      return { comedians, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get comedians: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }
}
