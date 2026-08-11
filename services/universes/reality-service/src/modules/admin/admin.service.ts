import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  /**
   * reality_auto_elimination: eliminates the lowest-voted active contestant of
   * a show. Non-destructive — the verdict is recorded in the show's metadata
   * (`lastElimination`) so ops can roll back or audit it.
   */
  async autoEliminate(showId: string) {
    const show = await this.prisma.realityShow.findUnique({
      where: { id: showId },
      include: { contestants: { include: { votes: { select: { quantity: true } } } } },
    });
    if (!show) {
      throw new NotFoundException('Show not found');
    }
    if (show.contestants.length < 2) {
      throw new BadRequestException('A show needs at least 2 contestants to eliminate');
    }

    const totals = show.contestants.map((c) => ({
      id: c.id,
      name: c.name,
      totalVotes: c.votes.reduce((sum, v) => sum + (v.quantity || 1), 0),
    }));
    const lowest = [...totals].sort((a, b) => a.totalVotes - b.totalVotes)[0];

    const metadata = (show.metadata as Record<string, unknown>) || {};
    const round = ((metadata as { eliminationRound?: number }).eliminationRound ?? 0) + 1;
    const elimination = {
      round,
      contestantId: lowest.id,
      contestantName: lowest.name,
      voteCount: lowest.totalVotes,
      eliminatedAt: new Date().toISOString(),
    };

    await this.prisma.realityShow.update({
      where: { id: showId },
      data: {
        metadata: {
          ...metadata,
          lastElimination: elimination,
          eliminationRound: round,
        } as Prisma.InputJsonValue,
      },
    });

    return { success: true, data: elimination };
  }

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
