import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GameResponse } from './interfaces/game-response.interface';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(): Promise<GameResponse> {
    const dailyChallenge = await this.prisma.challenge.findFirst({
      where: { type: 'daily' },
      include: {
        questions: true,
      },
    });

    const tournaments = await this.prisma.tournament.findMany({
      where: { status: 'active' },
      orderBy: { startsAt: 'asc' },
      take: 5,
    });

    const topPlayers = await this.prisma.scoreEntry.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: { user: true },
    });

    return {
      success: true,
      data: {
        dailyChallenge,
        tournaments,
        topPlayers,
      },
    };
  }

  async getDailyChallenge(): Promise<GameResponse> {
    const challenge = await this.prisma.challenge.findFirst({
      where: { type: 'daily' },
      include: {
        questions: true,
      },
    });

    if (!challenge) {
      throw new NotFoundException('No daily challenge available');
    }

    return {
      success: true,
      data: challenge,
    };
  }

  async startSession(userId: string, challengeId: string): Promise<GameResponse> {
    const existingSession = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        challengeId,
        status: 'active',
      },
    });

    if (existingSession) {
      throw new BadRequestException('User already has an active session');
    }

    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        challengeId,
        status: 'active',
      },
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        message: 'Session started',
      },
    };
  }

  async submitAnswer(userId: string, sessionId: string, answer: string): Promise<GameResponse> {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to user');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: session.questionId! },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = question.answer
      ? answer.toLowerCase() === question.answer.toLowerCase()
      : false;

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: isCorrect ? 'completed' : 'failed',
        score: isCorrect ? question.points : 0,
      },
    });

    if (isCorrect) {
      await this.prisma.scoreEntry.upsert({
        where: { userId },
        create: {
          userId,
          score: question.points,
        },
        update: {
          score: { increment: question.points },
        },
      });
    }

    return {
      success: true,
      data: {
        isCorrect,
        score: isCorrect ? question.points : 0,
        message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
      },
    };
  }

  async getLeaderboard(): Promise<GameResponse> {
    const leaderboard = await this.prisma.scoreEntry.findMany({
      orderBy: { score: 'desc' },
      take: 100,
      include: { user: true },
    });

    return {
      success: true,
      data: { leaderboard },
    };
  }

  async listTournaments(): Promise<GameResponse> {
    const tournaments = await this.prisma.tournament.findMany({
      where: { status: 'active' },
      include: {
        prizes: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    return {
      success: true,
      data: { tournaments },
    };
  }

  async enterTournament(userId: string, tournamentId: string): Promise<GameResponse> {
    const existingEntry = await this.prisma.tournamentEntry.findUnique({
      where: {
        userId_tournamentId: { userId, tournamentId },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already entered tournament');
    }

    const entry = await this.prisma.tournamentEntry.create({
      data: {
        userId,
        tournamentId,
      },
    });

    return {
      success: true,
      data: {
        entryId: entry.id,
        message: 'Entered tournament',
      },
    };
  }
}
