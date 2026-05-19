import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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
    | { leaderboard: unknown[]; userRank?: number; totalParticipants: number; activeParticipants?: unknown }
    | { message: string; finalLeaderboard: unknown[] }
    | { message: string };
  error?: { code: string; message: string };
}

@Injectable()
export class TournamentService {
  constructor(private prisma: PrismaService) {}

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
  }

  async getTournamentById(id: string): Promise<TournamentResponse> {
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
  }

  async enterTournament(
    userId: string,
    tournamentId: string,
    initialScore = 0
  ): Promise<TournamentResponse> {
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
  }

  async updateScore(
    userId: string,
    tournamentId: string,
    score: number
  ): Promise<TournamentResponse> {
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
  }

  async getLeaderboard(tournamentId: string, page = 1, limit = 50): Promise<TournamentResponse> {
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
  }

  async getUserRank(userId: string, tournamentId: string): Promise<TournamentResponse> {
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
  }

  async endTournament(tournamentId: string): Promise<TournamentResponse> {
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

    return {
      success: true,
      data: {
        message: 'Tournament ended',
        finalLeaderboard: tournament.entries.map((e, i) => ({
          rank: i + 1,
          userId: e.userId,
          score: e.score,
          prize: tournament.prizes[i] ? Number(tournament.prizes[i].amount) : 0,
        })),
      },
    };
  }
}
