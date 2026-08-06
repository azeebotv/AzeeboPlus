import { Test, TestingModule } from '@nestjs/testing';
import { PollService } from './poll.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PollService', () => {
  let service: PollService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOption = {
    id: 'opt-1',
    pollId: 'poll-1',
    text: 'Option A',
    imageUrl: null,
    voteCount: 5,
  };

  const mockPoll = {
    id: 'poll-1',
    title: 'Best Neighborhood',
    slug: 'best-neighborhood',
    description: 'Vote for your favorite',
    coverImage: 'https://example.com/cover.jpg',
    status: 'active',
    expiresAt: new Date('2026-08-01'),
    totalVotes: 10,
    createdById: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    options: [mockOption],
  };

  const mockVote = {
    id: 'vote-1',
    pollId: 'poll-1',
    optionId: 'opt-1',
    userId: 'user-456',
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollService,
        {
          provide: PrismaService,
          useValue: {
            poll: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            pollOption: {
              update: jest.fn(),
            },
            pollVote: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((fn: unknown) =>
              typeof fn === 'function' ? fn({ pollVote: { create: jest.fn() }, pollOption: { update: jest.fn() }, poll: { update: jest.fn() } }) : Promise.all(fn as unknown[])
            ),
          },
        },
      ],
    }).compile();

    service = module.get<PollService>(PollService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPolls', () => {
    it('should return paginated polls', async () => {
      (prismaService.poll.findMany as jest.Mock).mockResolvedValue([mockPoll]);
      (prismaService.poll.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getPolls();

      expect(result.success).toBe(true);
    });

    it('should filter by status', async () => {
      (prismaService.poll.findMany as jest.Mock).mockResolvedValue([mockPoll]);
      (prismaService.poll.count as jest.Mock).mockResolvedValue(1);

      await service.getPolls(1, 20, 'active');

      expect((prismaService.poll.findMany as jest.Mock).mock.calls[0][0].where.status).toBe(
        'active'
      );
    });

    it('should handle errors gracefully', async () => {
      (prismaService.poll.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getPolls();

      expect(result.success).toBe(false);
    });
  });

  describe('getPoll', () => {
    it('should return poll details', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      const result = await service.getPoll('poll-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if poll not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getPoll('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPoll', () => {
    it('should create poll successfully', async () => {
      (prismaService.poll.create as jest.Mock).mockResolvedValue(mockPoll);

      const result = await service.createPoll('user-123', {
        title: 'Best Neighborhood',
        description: 'Vote for your favorite',
        options: [{ text: 'Option A' }, { text: 'Option B' }],
      });

      expect(result.success).toBe(true);
    });

    it('should generate slug from title', async () => {
      (prismaService.poll.create as jest.Mock).mockResolvedValue(mockPoll);

      await service.createPoll('user-123', {
        title: 'My Poll!',
        options: [{ text: 'A' }],
      });

      const createCall = (prismaService.poll.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.slug).toBe('my-poll');
    });

    it('should handle errors gracefully', async () => {
      (prismaService.poll.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.createPoll('user-123', {
        title: 'Test',
        options: [{ text: 'A' }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('votePoll', () => {
    it('should vote successfully', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);
      (prismaService.pollVote.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.$transaction as jest.Mock).mockResolvedValue(undefined);

      const result = await service.votePoll('poll-1', 'user-456', 'opt-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if poll not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.votePoll('not-found', 'user-456', 'opt-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if poll not active', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoll,
        status: 'draft',
      });

      await expect(service.votePoll('poll-1', 'user-456', 'opt-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if poll expired', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoll,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.votePoll('poll-1', 'user-456', 'opt-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if already voted', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);
      (prismaService.pollVote.findUnique as jest.Mock).mockResolvedValue(mockVote);

      await expect(service.votePoll('poll-1', 'user-456', 'opt-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if option not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoll,
        options: [],
      });
      (prismaService.pollVote.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.votePoll('poll-1', 'user-456', 'opt-999')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
