import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuizService', () => {
  let service: QuizService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockQuiz = {
    id: 'quiz-1',
    title: 'Test Quiz',
    slug: 'test-quiz',
    description: 'A test quiz',
    coverImage: 'https://example.com/cover.jpg',
    category: 'geography',
    difficulty: 'medium',
    timeLimit: 300,
    status: 'published',
    playCount: 10,
    createdById: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockQuestion = {
    id: 'q-1',
    quizId: 'quiz-1',
    question: 'What is the capital of Nigeria?',
    options: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'],
    correctAnswer: 1,
    explanation: 'Abuja has been the capital since 1991.',
    points: 10,
    order: 0,
  };

  const mockAttempt = {
    id: 'attempt-1',
    quizId: 'quiz-1',
    userId: 'user-456',
    totalQuestions: 1,
    score: 0,
    answers: [],
    completedAt: null,
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: PrismaService,
          useValue: {
            quiz: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            quizAttempt: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuizzes', () => {
    it('should return paginated quizzes', async () => {
      (prismaService.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz]);
      (prismaService.quiz.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getQuizzes();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by category', async () => {
      (prismaService.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz]);
      (prismaService.quiz.count as jest.Mock).mockResolvedValue(1);

      await service.getQuizzes(1, 20, 'geography');

      expect((prismaService.quiz.findMany as jest.Mock).mock.calls[0][0].where.category).toBe(
        'geography'
      );
    });

    it('should filter by difficulty', async () => {
      (prismaService.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz]);
      (prismaService.quiz.count as jest.Mock).mockResolvedValue(1);

      await service.getQuizzes(1, 20, undefined, 'hard');

      expect((prismaService.quiz.findMany as jest.Mock).mock.calls[0][0].where.difficulty).toBe(
        'hard'
      );
    });

    it('should handle errors gracefully', async () => {
      (prismaService.quiz.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getQuizzes();

      expect(result.success).toBe(false);
    });
  });

  describe('getQuiz', () => {
    it('should return quiz details', async () => {
      (prismaService.quiz.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        questions: [mockQuestion],
      });

      const result = await service.getQuiz('quiz-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if quiz not found', async () => {
      (prismaService.quiz.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getQuiz('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createQuiz', () => {
    it('should create quiz successfully', async () => {
      (prismaService.quiz.create as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        questions: [mockQuestion],
      });

      const result = await service.createQuiz('user-123', {
        title: 'Test Quiz',
        description: 'A test quiz',
        questions: [
          {
            question: 'What is the capital?',
            options: ['Lagos', 'Abuja'],
            correctAnswer: '1',
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should generate slug from title', async () => {
      (prismaService.quiz.create as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        questions: [],
      });

      await service.createQuiz('user-123', {
        title: 'My Test Quiz!',
        questions: [],
      });

      const createCall = (prismaService.quiz.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.slug).toBe('my-test-quiz');
    });
  });

  describe('startQuiz', () => {
    it('should start quiz successfully', async () => {
      (prismaService.quiz.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        questions: [mockQuestion],
      });
      (prismaService.quizAttempt.create as jest.Mock).mockResolvedValue(mockAttempt);

      const result = await service.startQuiz('quiz-1', 'user-456');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if quiz not found', async () => {
      (prismaService.quiz.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.startQuiz('not-found', 'user-456')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if quiz not published', async () => {
      (prismaService.quiz.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        status: 'draft',
        questions: [],
      });

      await expect(service.startQuiz('quiz-1', 'user-456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz successfully', async () => {
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        ...mockAttempt,
        quiz: { ...mockQuiz, questions: [mockQuestion] },
      });
      (prismaService.quizAttempt.update as jest.Mock).mockResolvedValue(mockAttempt);
      (prismaService.quiz.update as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await service.submitQuiz('attempt-1', { 'q-1': '1' });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if attempt not found', async () => {
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitQuiz('not-found', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already submitted', async () => {
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        ...mockAttempt,
        completedAt: new Date(),
        quiz: { ...mockQuiz, questions: [] },
      });

      await expect(service.submitQuiz('attempt-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      (prismaService.quizAttempt.findMany as jest.Mock).mockResolvedValue([
        { ...mockAttempt, score: 100, completedAt: new Date() },
      ]);

      const result = await service.getLeaderboard('quiz-1');

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (prismaService.quizAttempt.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getLeaderboard('quiz-1');

      expect(result.success).toBe(false);
    });
  });
});
