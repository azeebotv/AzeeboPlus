import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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
    | { message: string; totalScore: number; level: number; totalGames: number; recentGames: unknown[] }
    | { message: string };
  error?: { code: string; message: string };
}

@Injectable()
export class GameCatalogService {
  constructor(private prisma: PrismaService) {}

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

    return {
      success: true,
      data: {
        items: items.map((g) => this.formatGame(g)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGameBySlug(slug: string): Promise<GameResponse> {
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

    return { success: true, data: this.formatGame(game) };
  }

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    const games = await this.prisma.game.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return { success: true, data: games.map((g) => g.category) };
  }

  async startGame(userId: string, gameId: string): Promise<GameResponse> {
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
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    answer: string,
    timeTaken: number
  ): Promise<GameResponse> {
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

    return {
      success: true,
      data: {
        message: isCorrect ? 'Correct!' : 'Incorrect',
        pointsEarned,
        correctAnswer: question.answer,
      },
    };
  }

  async completeGame(userId: string, sessionId: string): Promise<GameResponse> {
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

    return {
      success: true,
      data: {
        message: 'Game completed',
        score: updated.score,
        correctCount: updated.correctCount,
        totalScore: scoreEntry.score,
      },
    };
  }

  async getUserStats(userId: string): Promise<GameResponse> {
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
  }
}
