import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateQuizDto, QuizQuestionDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getQuizzes(page = 1, limit = 20, category?: string, difficulty?: string) {
    try {
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = { status: 'published' };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const [quizzes, total] = await Promise.all([
        this.prisma.quiz.findMany({
          where,
          orderBy: { playCount: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.quiz.count({ where }),
      ]);

      return {
        success: true,
        data: {
          quizzes,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch quizzes: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch quizzes' } };
    }
  }

  async getQuiz(id: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      const { questions: _rawQuestions, ...quizWithoutQuestions } = quiz;

      return {
        success: true,
        data: {
          quiz: quizWithoutQuestions,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch quiz ${id}: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch quiz' } };
    }
  }

  async createQuiz(userId: string, data: CreateQuizDto) {
    try {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const quiz = await this.prisma.quiz.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          coverImage: data.coverImage,
          category: data.category,
          difficulty: data.difficulty || 'easy',
          timeLimit: data.timeLimit,
          status: data.status || 'draft',
          createdById: userId,
          questions: {
            create: data.questions.map((q: QuizQuestionDto, index: number) => ({
              question: q.question,
              options: q.options,
              correctAnswer: parseInt(q.correctAnswer),
              explanation: q.explanation,
              points: q.points || 10,
              order: index,
            })),
          },
        },
        include: { questions: true },
      });

      return { success: true, data: { quiz } };
    } catch (error) {
      this.logger.error(`Failed to create quiz: ${error}`);
      return { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create quiz' } };
    }
  }

  async startQuiz(quizId: string, userId: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      if (quiz.status !== 'published') {
        throw new BadRequestException('Quiz is not available');
      }

      const attempt = await this.prisma.quizAttempt.create({
        data: {
          quizId,
          userId,
          totalQuestions: quiz.questions.length,
        },
      });

      const sanitizedQuestions = quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        order: q.order,
        points: q.points,
      }));

      return {
        success: true,
        data: {
          attemptId: attempt.id,
          questions: sanitizedQuestions,
          timeLimit: quiz.timeLimit,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to start quiz ${quizId}: ${error}`);
      return { success: false, error: { code: 'START_ERROR', message: 'Failed to start quiz' } };
    }
  }

  async submitQuiz(attemptId: string, answers: Record<string, string>) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const attempt = await tx.quizAttempt.findUnique({
          where: { id: attemptId },
          include: { quiz: { include: { questions: true } } },
        });

        if (!attempt) {
          throw new NotFoundException('Quiz attempt not found');
        }

        if (attempt.completedAt) {
          throw new BadRequestException('Quiz already submitted');
        }

        let score = 0;
        const questionResults = attempt.quiz.questions.map((q) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === String(q.correctAnswer);
          if (isCorrect) {
            score += q.points;
          }
          return {
            questionId: q.id,
            correct: isCorrect,
            userAnswer,
          };
        });

        await tx.quizAttempt.update({
          where: { id: attemptId },
          data: {
            score,
            answers: questionResults,
            completedAt: new Date(),
          },
        });

        await tx.quiz.update({
          where: { id: attempt.quizId },
          data: { playCount: { increment: 1 } },
        });

        return {
          score,
          totalQuestions: attempt.totalQuestions,
          correctAnswers: questionResults.filter((r) => r.correct).length,
          results: questionResults,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to submit quiz attempt ${attemptId}: ${error}`);
      return { success: false, error: { code: 'SUBMIT_ERROR', message: 'Failed to submit quiz' } };
    }
  }

  async getLeaderboard(quizId: string, limit = 10) {
    try {
      const attempts = await this.prisma.quizAttempt.findMany({
        where: { quizId, completedAt: { not: null } },
        orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
        take: limit,
      });

      return {
        success: true,
        data: {
          leaderboard: attempts.map((a) => ({
            userId: a.userId,
            score: a.score,
            completedAt: a.completedAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch leaderboard for quiz ${quizId}: ${error}`);
      return {
        success: false,
        error: { code: 'LEADERBOARD_ERROR', message: 'Failed to fetch leaderboard' },
      };
    }
  }
}
