import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalGames, totalTournaments, totalUsers, gamesByCategory, tournamentsByStatus] =
        await Promise.all([
          this.prisma.game.count(),
          this.prisma.tournament.count(),
          this.prisma.user.count(),
          this.prisma.game.groupBy({ by: ['category'], _count: { category: true } }),
          this.prisma.tournament.groupBy({ by: ['status'], _count: { status: true } }),
        ]);

      return {
        totalGames,
        totalTournaments,
        totalUsers,
        gamesByCategory: gamesByCategory.reduce(
          (acc, c) => ({ ...acc, [c.category]: c._count.category }),
          {}
        ),
        tournamentsByStatus: tournamentsByStatus.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.status }),
          {}
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getGames(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [games, total] = await Promise.all([
        this.prisma.game.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.game.count(),
      ]);

      return { games, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get games: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getTournaments(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [tournaments, total] = await Promise.all([
        this.prisma.tournament.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.tournament.count(),
      ]);

      return { tournaments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get tournaments: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
