import {Inject,  Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalMovies, totalPremieres, totalUsers, moviesByStatus] = await Promise.all([
        this.prisma.movie.count(),
        this.prisma.premiere.count(),
        this.prisma.user.count(),
        this.prisma.movie.groupBy({ by: ['status'], _count: { status: true } }),
      ]);

      return {
        totalMovies,
        totalPremieres,
        totalUsers,
        moviesByStatus: moviesByStatus.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.status }),
          {}
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error}`);
      throw error;
    }
  }

  async getMovies(options?: { page?: number; limit?: number; status?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;
      const where = options?.status ? { status: options.status } : {};

      const [movies, total] = await Promise.all([
        this.prisma.movie.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.movie.count({ where }),
      ]);

      return { movies, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get movies: ${error}`);
      throw error;
    }
  }

  async getPremieres() {
    try {
      const premieres = await this.prisma.premiere.findMany({
        where: { startsAt: { gte: new Date() }, status: 'scheduled' },
        include: { movie: true },
        orderBy: { startsAt: 'asc' },
      });

      return premieres;
    } catch (error) {
      this.logger.error(`Failed to get premieres: ${error}`);
      throw error;
    }
  }
}
