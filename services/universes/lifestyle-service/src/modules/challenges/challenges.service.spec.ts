import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeService } from './challenge.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockChallenge = {
    id: 'challenge-1',
    title: 'Photo Challenge',
    slug: 'photo-challenge',
    description: 'Submit your best photo',
    coverImage: 'https://example.com/cover.jpg',
    type: 'photo',
    status: 'active',
    rules: 'One submission per user',
    prize: 'Gift card',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    createdById: 'user-123',
    participantCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockSubmission = {
    id: 'sub-1',
    challengeId: 'challenge-1',
    userId: 'user-456',
    content: 'My photo submission',
    mediaUrl: 'https://example.com/photo.jpg',
    votes: 0,
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: PrismaService,
          useValue: {
            challenge: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            challengeSubmission: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            challengeVote: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((fns: unknown[]) => Promise.all(fns)),
          },
        },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChallenges', () => {
    it('should return paginated challenges', async () => {
      (prismaService.challenge.findMany as jest.Mock).mockResolvedValue([mockChallenge]);
      (prismaService.challenge.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getChallenges();

      expect(result.success).toBe(true);
    });

    it('should filter by type', async () => {
      (prismaService.challenge.findMany as jest.Mock).mockResolvedValue([mockChallenge]);
      (prismaService.challenge.count as jest.Mock).mockResolvedValue(1);

      await service.getChallenges(1, 20, 'photo');

      expect((prismaService.challenge.findMany as jest.Mock).mock.calls[0][0].where.type).toBe(
        'photo'
      );
    });

    it('should filter by status', async () => {
      (prismaService.challenge.findMany as jest.Mock).mockResolvedValue([mockChallenge]);
      (prismaService.challenge.count as jest.Mock).mockResolvedValue(1);

      await service.getChallenges(1, 20, undefined, 'active');

      expect((prismaService.challenge.findMany as jest.Mock).mock.calls[0][0].where.status).toBe(
        'active'
      );
    });

    it('should handle errors gracefully', async () => {
      (prismaService.challenge.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getChallenges();

      expect(result.success).toBe(false);
    });
  });

  describe('getChallenge', () => {
    it('should return challenge details', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue({
        ...mockChallenge,
        submissions: [mockSubmission],
      });

      const result = await service.getChallenge('challenge-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if challenge not found', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getChallenge('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChallenge', () => {
    it('should create challenge successfully', async () => {
      (prismaService.challenge.create as jest.Mock).mockResolvedValue(mockChallenge);

      const result = await service.createChallenge('user-123', {
        title: 'Photo Challenge',
        description: 'Submit your best photo',
      });

      expect(result.success).toBe(true);
    });

    it('should generate slug from title', async () => {
      (prismaService.challenge.create as jest.Mock).mockResolvedValue(mockChallenge);

      await service.createChallenge('user-123', {
        title: 'My Challenge!',
      });

      const createCall = (prismaService.challenge.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.slug).toBe('my-challenge');
    });
  });

  describe('submitToChallenge', () => {
    it('should submit to challenge successfully', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.challengeSubmission.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.challengeSubmission.create as jest.Mock).mockResolvedValue(mockSubmission);
      (prismaService.challenge.update as jest.Mock).mockResolvedValue(mockChallenge);

      const result = await service.submitToChallenge('challenge-1', 'user-456', {
        content: 'My photo',
      });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if challenge not found', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.submitToChallenge('not-found', 'user-456', { content: 'My photo' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if challenge not active', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue({
        ...mockChallenge,
        status: 'draft',
      });

      await expect(
        service.submitToChallenge('challenge-1', 'user-456', { content: 'My photo' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already submitted', async () => {
      (prismaService.challenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.challengeSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      await expect(
        service.submitToChallenge('challenge-1', 'user-456', { content: 'My photo' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('voteSubmission', () => {
    it('should vote successfully', async () => {
      (prismaService.challengeSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);
      (prismaService.challengeVote.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.challengeVote.create as jest.Mock).mockResolvedValue({
        id: 'vote-1',
        userId: 'user-789',
        submissionId: 'sub-1',
      });
      (prismaService.challengeSubmission.update as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await service.voteSubmission('sub-1', 'user-789');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if submission not found', async () => {
      (prismaService.challengeSubmission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.voteSubmission('not-found', 'user-789')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if already voted', async () => {
      (prismaService.challengeSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);
      (prismaService.challengeVote.findUnique as jest.Mock).mockResolvedValue({
        id: 'vote-1',
        userId: 'user-789',
        submissionId: 'sub-1',
      });

      await expect(service.voteSubmission('sub-1', 'user-789')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
