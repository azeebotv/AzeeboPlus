import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface QuizQuestionInput {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  difficulty?: string;
  timeLimit?: number;
  status?: string;
  questions: QuizQuestionInput[];
}

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async getQuizzes(page = 1, limit = 20, category?: string, difficulty?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { status: 'published' };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: { createdBy: { select: { displayName: true, avatarUrl: true } } },
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
  }

  async getQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        createdBy: { select: { displayName: true, avatarUrl: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

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
        quiz: { ...quiz, questions: sanitizedQuestions },
      },
    };
  }

  async createQuiz(userId: string, data: CreateQuizInput) {
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
          create: data.questions.map((q: QuizQuestionInput, index: number) => ({
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
  }

  async startQuiz(quizId: string, userId: string) {
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
  }

  async submitQuiz(attemptId: string, answers: Record<string, string>) {
    const attempt = await this.prisma.quizAttempt.findUnique({
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
        correctAnswer: q.correctAnswer,
      };
    });

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        answers: questionResults,
        completedAt: new Date(),
      },
    });

    await this.prisma.quiz.update({
      where: { id: attempt.quizId },
      data: { playCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: questionResults.filter((r) => r.correct).length,
        results: questionResults,
      },
    };
  }

  async getLeaderboard(quizId: string, limit = 10) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, completedAt: { not: null } },
      include: { user: { select: { displayName: true, avatarUrl: true } } },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      take: limit,
    });

    return {
      success: true,
      data: {
        leaderboard: attempts.map((a) => ({
          user: a.user,
          score: a.score,
          completedAt: a.completedAt,
        })),
      },
    };
  }
}
