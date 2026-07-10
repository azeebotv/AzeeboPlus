import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FanContestsService {
  private readonly logger = new Logger(FanContestsService.name);
  constructor(private prisma: PrismaService) {}

  async getContests(
    page = 1,
    limit = 20,
    eventId?: string,
    status?: string
  ): Promise<{ success: boolean; data?: unknown }> {
    const where: Record<string, unknown> = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    try {
      const [items, total] = await Promise.all([
        this.prisma.contest.findMany({
          where,
          include: {
            event: true,
            prizes: { orderBy: { rank: 'asc' } },
            _count: { select: { entries: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { startsAt: 'asc' },
        }),
        this.prisma.contest.count({ where }),
      ]);

      return {
        success: true,
        data: { items, page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error(`Failed to get contests: ${error}`);
      throw error;
    }
  }

  async getContestById(contestId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const contest = await this.prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          event: true,
          prizes: { orderBy: { rank: 'asc' } },
          entries: {
            orderBy: { score: 'desc' },
            take: 50,
          },
        },
      });

      if (!contest) {
        throw new NotFoundException('Contest not found');
      }

      return { success: true, data: contest };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get contest by ID ${contestId}: ${error}`);
      throw error;
    }
  }

  async enterContest(
    userId: string,
    contestId: string,
    entryData: Record<string, unknown>
  ): Promise<{ success: boolean; data?: { entryId: string; message: string } }> {
    try {
      const contest = await this.prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new NotFoundException('Contest not found');
      }

      if (contest.status !== 'active') {
        throw new BadRequestException('Contest is not active');
      }

      const now = new Date();
      if (contest.startsAt > now) {
        throw new BadRequestException('Contest has not started yet');
      }
      if (contest.endsAt && contest.endsAt < now) {
        throw new BadRequestException('Contest has ended');
      }

      const existing = await this.prisma.contestEntry.findUnique({
        where: { contestId_userId: { contestId, userId } },
      });

      if (existing) {
        throw new BadRequestException('Already entered this contest');
      }

      const entry = await this.prisma.contestEntry.create({
        data: {
          contestId,
          userId,
          entryData: entryData as unknown as Record<string, string | number | boolean | null>,
        },
      });

      return {
        success: true,
        data: { entryId: entry.id, message: 'Entered contest successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to enter contest ${contestId} for user ${userId}: ${error}`);
      throw error;
    }
  }

  async updateEntryScore(
    userId: string,
    contestId: string,
    score: number
  ): Promise<{ success: boolean; data?: { message: string; score: number } }> {
    try {
      const entry = await this.prisma.contestEntry.findUnique({
        where: { contestId_userId: { contestId, userId } },
      });

      if (!entry) {
        throw new NotFoundException('Entry not found');
      }

      const updated = await this.prisma.contestEntry.update({
        where: { id: entry.id },
        data: { score: { increment: score } },
      });

      return { success: true, data: { message: 'Score updated', score: updated.score } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to update entry score for user ${userId} in contest ${contestId}: ${error}`
      );
      throw error;
    }
  }

  async getLeaderboard(
    contestId: string,
    page = 1,
    limit = 50
  ): Promise<{ success: boolean; data?: unknown }> {
    try {
      const [entries, total] = await Promise.all([
        this.prisma.contestEntry.findMany({
          where: { contestId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { score: 'desc' },
        }),
        this.prisma.contestEntry.count({ where: { contestId } }),
      ]);

      const leaderboard = entries.map((e, i) => ({
        rank: (page - 1) * limit + i + 1,
        userId: e.userId,
        score: e.score,
        enteredAt: e.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          leaderboard,
          totalParticipants: total,
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get leaderboard for contest ${contestId}: ${error}`);
      throw error;
    }
  }

  async getUserRank(
    userId: string,
    contestId: string
  ): Promise<{ success: boolean; data?: unknown }> {
    try {
      const entry = await this.prisma.contestEntry.findUnique({
        where: { contestId_userId: { contestId, userId } },
      });

      if (!entry) {
        throw new NotFoundException('Not entered in this contest');
      }

      const higherScores = await this.prisma.contestEntry.count({
        where: { contestId, score: { gt: entry.score } },
      });

      const rank = higherScores + 1;

      let prize: number | undefined;
      const prizeTier = await this.prisma.contestPrize.findFirst({
        where: { contestId, rank },
      });
      if (prizeTier) {
        prize = Number(prizeTier.amount);
      }

      return {
        success: true,
        data: {
          entryId: entry.id,
          rank,
          score: entry.score,
          prize,
          message: `You are ranked #${rank}`,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to get user rank for user ${userId} in contest ${contestId}: ${error}`
      );
      throw error;
    }
  }

  async endContest(contestId: string): Promise<{ success: boolean; data?: { message: string } }> {
    try {
      await this.prisma.contest.update({
        where: { id: contestId },
        data: { status: 'completed' },
      });

      return { success: true, data: { message: 'Contest ended' } };
    } catch (error) {
      this.logger.error(`Failed to end contest ${contestId}: ${error}`);
      throw error;
    }
  }
}
