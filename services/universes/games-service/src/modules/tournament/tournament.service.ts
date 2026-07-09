import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import axios from 'axios';
import { randomUUID } from 'crypto';

interface Tournament {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  entryFee: number;
  prizePool: number;
  status: string;
  participantCount: number;
  prizeCount: number;
}

interface TournamentResponse {
  success: boolean;
  data?:
    | Tournament
    | Tournament[]
    | { items: Tournament[]; total: number; page: number; limit: number; totalPages: number }
    | { id: string; rank: number; score: number; prize?: number; message: string }
    | {
        leaderboard: unknown[];
        userRank?: number;
        totalParticipants: number;
        activeParticipants?: unknown;
      }
    | { message: string; finalLeaderboard: unknown[] }
    | { message: string };
  error?: { code: string; message: string };
}

@Injectable()
export class TournamentService {
  private readonly logger = new Logger(TournamentService.name);
  private readonly walletServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.walletServiceUrl = this.configService.get<string>(
      'WALLET_SERVICE_URL',
      'http://wallet-service:3002',
    );
  }

  private formatTournament(t: Record<string, unknown>): Tournament {
    return {
      id: t.id as string,
      title: t.title as string,
      description: (t.description as string) || '',
      startsAt: (t.startsAt as Date).toISOString(),
      endsAt: (t.endsAt as Date)?.toISOString() || '',
      entryFee: Number(t.entryFee),
      prizePool: Number(t.prizePool),
      status: t.status as string,
      participantCount: (t._count as { entries?: number })?.entries || 0,
      prizeCount: (t._count as { prizes?: number })?.prizes || 0,
    };
  }

  async getTournaments(page = 1, limit = 20, status?: string): Promise<TournamentResponse> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    try {
      const [items, total] = await Promise.all([
        this.prisma.tournament.findMany({
          where,
          include: {
            _count: { select: { entries: true, prizes: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { startsAt: 'asc' },
        }),
        this.prisma.tournament.count({ where }),
      ]);

      return {
        success: true,
        data: {
          items: items.map((t) => this.formatTournament(t)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch tournaments: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch tournaments' } };
    }
  }

  async getTournamentById(id: string): Promise<TournamentResponse> {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id },
        include: {
          _count: { select: { entries: true, prizes: true } },
          prizes: { orderBy: { rank: 'asc' } },
        },
      });

      if (!tournament) {
        throw new NotFoundException(`Tournament not found: ${id}`);
      }

      return { success: true, data: this.formatTournament(tournament) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch tournament ${id}: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch tournament' } };
    }
  }

  async enterTournament(
    userId: string,
    tournamentId: string,
    initialScore = 0
  ): Promise<TournamentResponse> {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      if (tournament.status !== 'active') {
        throw new BadRequestException('Tournament is not active');
      }

      const now = new Date();
      if (tournament.startsAt > now) {
        throw new BadRequestException('Tournament has not started yet');
      }
      if (tournament.endsAt && tournament.endsAt < now) {
        throw new BadRequestException('Tournament has ended');
      }

      const existing = await this.prisma.tournamentEntry.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
      });

      if (existing) {
        throw new BadRequestException('Already entered this tournament');
      }

      const entry = await this.prisma.tournamentEntry.create({
        data: {
          userId,
          tournamentId,
          score: initialScore,
        },
      });

      return {
        success: true,
        data: {
          id: entry.id,
          rank: 0,
          score: entry.score,
          message: 'Entered tournament successfully',
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to enter tournament ${tournamentId}: ${error}`);
      return { success: false, error: { code: 'ENTER_ERROR', message: 'Failed to enter tournament' } };
    }
  }

  async updateScore(
    userId: string,
    tournamentId: string,
    score: number
  ): Promise<TournamentResponse> {
    try {
      const entry = await this.prisma.tournamentEntry.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
      });

      if (!entry) {
        throw new NotFoundException('Not entered in this tournament');
      }

      const updated = await this.prisma.tournamentEntry.update({
        where: { id: entry.id },
        data: { score: { increment: score } },
      });

      return {
        success: true,
        data: {
          id: updated.id,
          score: updated.score,
          message: 'Score updated',
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update score for tournament ${tournamentId}: ${error}`);
      return { success: false, error: { code: 'SCORE_ERROR', message: 'Failed to update score' } };
    }
  }

  async getLeaderboard(tournamentId: string, page = 1, limit = 50): Promise<TournamentResponse> {
    try {
      const [entries, total, userEntry] = await Promise.all([
        this.prisma.tournamentEntry.findMany({
          where: { tournamentId },
          include: { user: { select: { id: true, displayName: true, avatar: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { score: 'desc' },
        }),
        this.prisma.tournamentEntry.count({ where: { tournamentId } }),
        this.prisma.tournamentEntry.count({ where: { tournamentId, score: { gt: 0 } } }),
      ]);

      const leaderboard = entries.map((e, index) => ({
        rank: (page - 1) * limit + index + 1,
        userId: e.userId,
        displayName: e.user.displayName,
        avatar: e.user.avatar,
        score: e.score,
        enteredAt: e.enteredAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          leaderboard,
          totalParticipants: total,
          activeParticipants: userEntry,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch leaderboard for tournament ${tournamentId}: ${error}`);
      return { success: false, error: { code: 'LEADERBOARD_ERROR', message: 'Failed to fetch leaderboard' } };
    }
  }

  async getUserRank(userId: string, tournamentId: string): Promise<TournamentResponse> {
    try {
      const entry = await this.prisma.tournamentEntry.findUnique({
        where: { userId_tournamentId: { userId, tournamentId } },
      });

      if (!entry) {
        throw new NotFoundException('Not entered in this tournament');
      }

      const higherScores = await this.prisma.tournamentEntry.count({
        where: { tournamentId, score: { gt: entry.score } },
      });

      const rank = higherScores + 1;

      let prize: number | undefined;
      const prizeTier = await this.prisma.tournamentPrize.findFirst({
        where: { tournamentId, rank },
      });
      if (prizeTier) {
        prize = Number(prizeTier.amount);
      }

      return {
        success: true,
        data: {
          id: entry.id,
          rank,
          score: entry.score,
          prize,
          message: `You are ranked #${rank}`,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get user rank for tournament ${tournamentId}: ${error}`);
      return { success: false, error: { code: 'RANK_ERROR', message: 'Failed to get user rank' } };
    }
  }

  async endTournament(tournamentId: string): Promise<TournamentResponse> {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          prizes: { orderBy: { rank: 'asc' } },
          entries: {
            orderBy: { score: 'desc' },
            take: 10,
          },
        },
      });

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'completed' },
      });

      const prizeDistribution = tournament.entries.map((entry, i) => {
        const prize = tournament.prizes[i] ? Number(tournament.prizes[i].amount) : 0;
        return { rank: i + 1, userId: entry.userId, score: entry.score, prize };
      });

      // Distribute prizes in parallel with idempotency keys for safe retry
      const prizeResults = await Promise.allSettled(
        prizeDistribution
          .filter((winner) => winner.prize > 0)
          .map((winner) =>
            axios.post(`${this.walletServiceUrl}/wallet/credit`, {
              userId: winner.userId,
              amount: winner.prize,
              description: `Tournament prize: ${tournament.title} (Rank #${winner.rank})`,
              reference: `tournament-prize-${tournamentId}-${winner.rank}`,
            }).then(() => {
              this.logger.log(
                `Credited ${winner.prize} to user ${winner.userId} for tournament ${tournamentId} rank #${winner.rank}`
              );
            })
          )
      );

      const failedPrizes = prizeResults.filter((r) => r.status === 'rejected');
      if (failedPrizes.length > 0) {
        this.logger.error(
          `${failedPrizes.length} prize credits failed for tournament ${tournamentId}. Use the idempotency reference to retry.`
        );
      }

      return {
        success: true,
        data: {
          message: 'Tournament ended and prizes distributed',
          finalLeaderboard: prizeDistribution,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to end tournament ${tournamentId}: ${error}`);
      return { success: false, error: { code: 'END_ERROR', message: 'Failed to end tournament' } };
    }
  }
}
