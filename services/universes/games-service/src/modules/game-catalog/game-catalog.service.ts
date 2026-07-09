import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: string;
  playCount: number;
  questionCount: number;
}

interface GameResponse {
  success: boolean;
  data?:
    | Game
    | Game[]
    | { items: Game[]; total: number; page: number; limit: number; totalPages: number }
    | { sessionId: string; questions: unknown[]; message: string }
    | { message: string; score: number; correctCount: number; totalScore?: number }
    | { message: string; pointsEarned: number; correctAnswer: string }
    | {
        message: string;
        totalScore: number;
        level: number;
        totalGames: number;
        recentGames: unknown[];
      }
    | { message: string };
  error?: { code: string; message: string };
}

@Injectable()
export class GameCatalogService {
  private readonly logger = new Logger(GameCatalogService.name);
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  private formatGame(game: Record<string, unknown>): Game {
    return {
      id: game.id as string,
      title: game.title as string,
      slug: game.slug as string,
      description: (game.description as string) || '',
      thumbnail: (game.thumbnail as string) || '',
      category: game.category as string,
      difficulty: game.difficulty as string,
      playCount: game.playCount as number,
      questionCount: (game._count as { questions?: number })?.questions || 0,
    };
  }

  async getGames(
    page = 1,
    limit = 20,
    category?: string,
    difficulty?: string
  ): Promise<GameResponse> {
    try {
      const cacheK = cacheKey('games', `list:${page}:${limit}:${category || 'all'}:${difficulty || 'all'}`);
      const cached = await this.cache.get<GameResponse>(cacheK);
      if (cached) return cached;

      const where: Record<string, unknown> = { isActive: true };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const [items, total] = await Promise.all([
        this.prisma.game.findMany({
          where,
          include: { _count: { select: { questions: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { playCount: 'desc' },
        }),
        this.prisma.game.count({ where }),
      ]);

      const result: GameResponse = {
        success: true,
        data: {
          items: items.map((g) => this.formatGame(g)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheK, result, 60);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get games: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: { code: 'GAMES_ERROR', message: (error as Error).message } };
    }
  }

  async getGameBySlug(slug: string): Promise<GameResponse> {
    try {
      const cacheK = cacheKey('games', `detail:${slug}`);
      const cached = await this.cache.get<GameResponse>(cacheK);
      if (cached) return cached;

      const game = await this.prisma.game.findUnique({
        where: { slug },
        include: {
          _count: { select: { questions: true } },
          questions: { orderBy: { order: 'asc' }, take: 10 },
        },
      });

      if (!game) {
        throw new NotFoundException(`Game not found: ${slug}`);
      }

      await this.prisma.game.update({
        where: { id: game.id },
        data: { playCount: { increment: 1 } },
      });

      const result: GameResponse = { success: true, data: this.formatGame(game) };
      await this.cache.set(cacheK, result, 60);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get game by slug: ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: { code: 'GAME_ERROR', message: (error as Error).message } };
    }
  }

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      const games = await this.prisma.game.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      });

      return { success: true, data: games.map((g) => g.category) };
    } catch (error) {
      this.logger.error(`Failed to get categories: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, data: [] };
    }
  }

  async startGame(userId: string, gameId: string): Promise<GameResponse> {
    try {
      const existing = await this.prisma.gamePlaySession.findFirst({
        where: { userId, gameId, status: 'active' },
      });

      if (existing) {
        throw new NotFoundException('You have an active session. Complete or abandon it first.');
      }

      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });

      if (!game) {
        throw new NotFoundException(`Game not found: ${gameId}`);
      }

      const session = await this.prisma.gamePlaySession.create({
        data: {
          userId,
          gameId,
          status: 'active',
        },
      });

      const questions = game.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points,
        timeLimit: q.timeLimit,
      }));

      return {
        success: true,
        data: { sessionId: session.id, questions, message: 'Game started' },
      };
    } catch (error) {
      this.logger.error(`Failed to start game: ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: { code: 'GAME_START_ERROR', message: (error as Error).message } };
    }
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    answer: string,
    timeTaken: number
  ): Promise<GameResponse> {
    try {
      const session = await this.prisma.gamePlaySession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== userId) {
        throw new NotFoundException('Session not found');
      }

      if (session.status !== 'active') {
        return { success: true, data: { message: 'Session already completed' } };
      }

      const question = await this.prisma.gameQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const isCorrect = answer.toLowerCase() === question.answer.toLowerCase();
      const pointsEarned = isCorrect ? question.points : 0;

      await this.prisma.gameAnswer.create({
        data: {
          sessionId,
          questionId,
          answer,
          isCorrect,
          timeTaken,
          pointsEarned,
        },
      });

      if (isCorrect) {
        await this.prisma.gamePlaySession.update({
          where: { id: sessionId },
          data: {
            score: { increment: pointsEarned },
            correctCount: { increment: 1 },
          },
        });
      }

      await this.cache.invalidate('games:leaderboard:*');

      return {
        success: true,
        data: {
          message: isCorrect ? 'Correct!' : 'Incorrect',
          pointsEarned,
          correctAnswer: question.answer,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to submit answer: ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: { code: 'SUBMIT_ERROR', message: (error as Error).message } };
    }
  }

  async completeGame(userId: string, sessionId: string): Promise<GameResponse> {
    try {
      const session = await this.prisma.gamePlaySession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== userId) {
        throw new NotFoundException('Session not found');
      }

      if (session.status !== 'active') {
        return {
          success: true,
          data: {
            message: 'Already completed',
            score: session.score,
            correctCount: session.correctCount,
          },
        };
      }

      const updated = await this.prisma.gamePlaySession.update({
        where: { id: sessionId },
        data: { status: 'completed', completedAt: new Date() },
      });

      const scoreEntry = await this.prisma.scoreEntry.upsert({
        where: { userId },
        create: { userId, score: updated.score },
        update: { score: { increment: updated.score } },
      });

      await this.cache.invalidate('games:*');

      return {
        success: true,
        data: {
          message: 'Game completed',
          score: updated.score,
          correctCount: updated.correctCount,
          totalScore: scoreEntry.score,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to complete game: ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: { code: 'COMPLETE_ERROR', message: (error as Error).message } };
    }
  }

  async getUserStats(userId: string): Promise<GameResponse> {
    try {
      const scoreEntry = await this.prisma.scoreEntry.findUnique({
        where: { userId },
      });

      const sessions = await this.prisma.gamePlaySession.findMany({
        where: { userId, status: 'completed' },
        select: { score: true, correctCount: true, gameId: true, completedAt: true },
        orderBy: { completedAt: 'desc' },
        take: 10,
      });

      const totalGames = await this.prisma.gamePlaySession.count({
        where: { userId, status: 'completed' },
      });

      return {
        success: true,
        data: {
          message: 'User stats retrieved',
          totalScore: scoreEntry?.score || 0,
          level: scoreEntry?.level || 1,
          totalGames,
          recentGames: sessions,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get user stats: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: { code: 'USER_STATS_ERROR', message: (error as Error).message } };
    }
  }
}
