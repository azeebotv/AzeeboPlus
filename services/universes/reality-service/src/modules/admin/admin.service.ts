import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getAllRealityShows(options?: { page?: number; limit?: number; status?: string }) {
    try {
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
    } catch (error) {
      this.logger.error(
        `Failed to get all reality shows: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getRealityShowById(showId: string) {
    try {
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
    } catch (error) {
      this.logger.error(
        `Failed to get reality show by id: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: (error as Error).message };
    }
  }

  // TODO: add audit logging with reason parameter
  async updateRealityShowStatus(showId: string, status: string, _reason?: string) {
    try {
      const show = await this.prisma.realityShow.findUnique({ where: { id: showId } });
      if (!show) {
        throw new NotFoundException('Reality show not found');
      }

      const updated = await this.prisma.realityShow.update({
        where: { id: showId },
        data: { status },
      });

      // TODO: Add audit logging when auditLog model is added to the schema.
      // The `reason` parameter is available for future audit logging use.

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update reality show status: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: (error as Error).message };
    }
  }
}
