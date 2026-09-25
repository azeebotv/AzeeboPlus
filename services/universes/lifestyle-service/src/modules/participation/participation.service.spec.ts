import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ParticipationService } from './participation.service';
import { PrismaService } from '../database/prisma.service';

describe('ParticipationService', () => {
  let service: ParticipationService;
  let prismaService: jest.Mocked<PrismaService>;

  const pollId = 'poll-1';
  const attemptId = 'attempt-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationService,
        {
          provide: PrismaService,
          useValue: {
            poll: {
              findUnique: jest.fn(),
            },
            pollVote: {
              findMany: jest.fn(),
            },
            quizAttempt: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ParticipationService>(ParticipationService);
    prismaService = module.get(PrismaService);
  });

  describe('poll results', () => {
    const poll = {
      id: pollId,
      title: 'Best Afrobeats artist?',
      status: 'active',
      totalVotes: 200,
      options: [
        { id: 'opt-1', text: 'Artist A', voteCount: 120 },
        { id: 'opt-2', text: 'Artist B', voteCount: 80 },
      ],
    };

    it('returns aggregate poll results with percentages and participant count', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(poll);
      // Mock honours the service's distinct: ['userId'] — unique voters only.
      (prismaService.pollVote.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      const result = await service.getResult(pollId);

      expect(result).toMatchObject({
        id: pollId,
        type: 'poll',
        title: 'Best Afrobeats artist?',
        totalVotes: 200,
        totalParticipants: 2,
      });
      expect(prismaService.pollVote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ['userId'] })
      );
      expect(result.options).toEqual([
        { id: 'opt-1', label: 'Artist A', votes: 120, percentage: 60 },
        { id: 'opt-2', label: 'Artist B', votes: 80, percentage: 40 },
      ]);
      expect(prismaService.pollVote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { pollId } })
      );
    });

    it('treats a zero-vote poll as zero percentages', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({
        ...poll,
        totalVotes: 0,
      });
      (prismaService.pollVote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getResult(pollId);

      expect(result.options.every((o: { percentage: number }) => o.percentage === 0)).toBe(true);
    });

    it('falls through to quiz attempts when the poll is a draft (not public)', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({ ...poll, status: 'draft' });
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getResult(pollId)).rejects.toThrow(NotFoundException);
      expect(prismaService.quizAttempt.findUnique).toHaveBeenCalled();
    });
  });

  describe('quiz attempt results', () => {
    const quiz = {
      id: 'quiz-1',
      title: 'Naija Pop Quiz',
      questions: [
        { id: 'q1', question: 'Capital of Nigeria?', points: 10, order: 1 },
        { id: 'q2', question: 'Largest city?', points: 10, order: 2 },
      ],
    };

    const attempt = {
      id: attemptId,
      userId: 'user-9',
      score: 20,
      completedAt: new Date('2026-09-01'),
      answers: [
        { questionId: 'q1', correct: true },
        { questionId: 'q2', correct: true },
      ],
      quiz,
    };

    it('aggregates per-question correctness across completed attempts', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue(attempt);
      (prismaService.quizAttempt.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-9', answers: [{ questionId: 'q1', correct: true }, { questionId: 'q2', correct: true }] },
        { userId: 'user-8', answers: [{ questionId: 'q1', correct: true }, { questionId: 'q2', correct: false }] },
        { userId: 'user-7', answers: [{ questionId: 'q1', correct: false }] },
      ]);

      const result = await service.getResult(attemptId);

      expect(result).toMatchObject({
        id: attemptId,
        type: 'quiz',
        title: 'Naija Pop Quiz',
        totalVotes: 3,
        totalParticipants: 3,
        pointsEarned: 20,
        userCorrect: true,
      });
      // q1: 2/3 correct = 67%, q2: 1/3 correct = 33%
      expect(result.options).toEqual([
        { id: 'q1', label: 'Capital of Nigeria?', votes: 2, percentage: 67 },
        { id: 'q2', label: 'Largest city?', votes: 1, percentage: 33 },
      ]);
    });

    it('marks userCorrect false when score is below total points', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        ...attempt,
        score: 10,
      });
      (prismaService.quizAttempt.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-9', answers: attempt.answers },
      ]);

      const result = await service.getResult(attemptId);

      expect(result.userCorrect).toBe(false);
    });

    it('treats non-json answers safely (no crash, zero votes)', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue(attempt);
      (prismaService.quizAttempt.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-9', answers: null },
      ]);

      const result = await service.getResult(attemptId);

      expect(result.options.every((o: { votes: number }) => o.votes === 0)).toBe(true);
    });

    it('rejects uncompleted attempts', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        ...attempt,
        completedAt: null,
      });

      await expect(service.getResult(attemptId)).rejects.toThrow(NotFoundException);
    });

    it('rejects unknown ids', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.quizAttempt.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getResult('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
