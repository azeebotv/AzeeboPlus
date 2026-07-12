import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { GameResponse } from './interfaces/game-response.interface.js';
import axios from 'axios';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly analyticsServiceBaseUrl: string;
  private readonly walletServiceBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/analytics/track`, {
        eventName,
        userId,
        universe: 'games',
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn('Failed to track analytics event:', error);
    }
  }

  async getHome(): Promise<GameResponse> {
    const dailyChallenge = await this.prisma.challenge.findFirst({
      where: { type: 'daily' },
    });

    const tournaments = await this.prisma.tournament.findMany({
      where: { status: 'active' },
      orderBy: { startsAt: 'asc' },
      take: 5,
    });

    const topPlayers = await this.prisma.scoreEntry.findMany({
      orderBy: { score: 'desc' },
      take: 10,
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

  async getDailyChallenge(userId?: string): Promise<GameResponse> {
    const challenge = await this.prisma.challenge.findFirst({
      where: { type: 'daily' },
    });

    if (!challenge) {
      throw new NotFoundException('No daily challenge available');
    }

    if (userId) {
      const userProgress = await this.prisma.gameSession.findFirst({
        where: { userId, challengeId: challenge.id, status: 'completed' },
        orderBy: { startedAt: 'desc' },
      });

      return {
        success: true,
        data: { ...challenge, userProgress },
      };
    }

    return {
      success: true,
      data: challenge,
    };
  }

  async submitDailyChallenge(userId: string, answer: string): Promise<GameResponse> {
    const challenge = await this.prisma.challenge.findFirst({
      where: { type: 'daily' },
    });

    if (!challenge) {
      throw new NotFoundException('No daily challenge available');
    }

    const existingSession = await this.prisma.gameSession.findFirst({
      where: { userId, challengeId: challenge.id, status: 'completed' },
      orderBy: { startedAt: 'desc' },
    });

    if (existingSession) {
      throw new BadRequestException('Daily challenge already completed');
    }

    const challengeQuestions = await this.prisma.question.findMany({
      where: { challengeId: challenge.id },
      orderBy: { order: 'asc' },
    });
    const firstQuestion = challengeQuestions[0] as Record<string, unknown> | undefined;
    const correctAnswer =
      (firstQuestion?.correctAnswer as string) || (firstQuestion?.answer as string);
    const isCorrect = answer === correctAnswer;

    await this.prisma.gameSession.create({
      data: {
        userId,
        challengeId: challenge.id,
        status: 'completed',
        score: isCorrect ? 100 : 0,
      },
    });

    await this.trackAnalyticsEvent('daily_challenge_submitted', userId, {
      challengeId: challenge.id,
      isCorrect,
    });

    return {
      success: true,
      data: { isCorrect, score: isCorrect ? 100 : 0 },
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

    await this.trackAnalyticsEvent('game_started', userId, {
      sessionId: session.id,
      challengeId,
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

    if (!session.questionId) {
      throw new BadRequestException('No question assigned to session');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: session.questionId },
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

      await this.trackAnalyticsEvent('game_completed', userId, {
        sessionId,
        challengeId: session.challengeId,
        score: question.points,
        isCorrect: true,
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
    });

    return {
      success: true,
      data: { leaderboard },
    };
  }

  async listTournaments(): Promise<GameResponse> {
    const tournaments = await this.prisma.tournament.findMany({
      where: { status: 'active' },
      orderBy: { startsAt: 'asc' },
    });

    return {
      success: true,
      data: { tournaments },
    };
  }

  async enterTournament(userId: string, tournamentId: string): Promise<GameResponse> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== 'active') {
      throw new BadRequestException('Tournament is not active');
    }

    const existingEntry = await this.prisma.tournamentEntry.findUnique({
      where: {
        userId_tournamentId: { userId, tournamentId },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already entered tournament');
    }

    if (tournament.entryFee && Number(tournament.entryFee) > 0) {
      const entryFeeAmount = Number(tournament.entryFee);

      await axios
        .post(
          `${this.walletServiceBaseUrl}/v1/wallet/debit`,
          {
            userId,
            amount: entryFeeAmount,
            description: `Tournament entry fee: ${tournamentId}`,
          },
          { timeout: 10000 }
        )
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? (error as Error).message : 'Failed to debit wallet';
          throw new BadRequestException(errorMessage);
        });
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
