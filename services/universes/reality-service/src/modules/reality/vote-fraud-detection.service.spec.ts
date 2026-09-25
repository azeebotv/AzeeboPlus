import { Test, TestingModule } from '@nestjs/testing';
import { VoteFraudDetectionService } from './vote-fraud-detection.service';
import { PrismaService } from '../database/prisma.service';

describe('VoteFraudDetectionService', () => {
  let service: VoteFraudDetectionService;

  const mockPrisma = {
    vote: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [VoteFraudDetectionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<VoteFraudDetectionService>(VoteFraudDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkVote', () => {
    it('should allow vote when no fraud detected', async () => {
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(result.passed).toBe(true);
      expect(result.action).toBe('allow');
      expect(result.flags).toHaveLength(0);
    });

    it('should flag when rate limit exceeded per minute', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(6) // per minute
        .mockResolvedValueOnce(0); // per hour
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(result.flags).toContain('RATE_LIMIT_PER_MINUTE');
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });

    it('should flag when hourly rate limit exceeded', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(0) // per minute
        .mockResolvedValueOnce(31); // per hour
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(result.flags).toContain('RATE_LIMIT_PER_HOUR');
    });

    it('should block when risk score >= 80', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(6) // per minute
        .mockResolvedValueOnce(31); // per hour
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 25 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const blockResult = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
        ipAddress: '192.168.1.1',
      });

      expect(blockResult.action).toBe('block');
    });

    it('should throttle when risk score >= 50', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(6) // per minute
        .mockResolvedValueOnce(0);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 15 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
        ipAddress: '192.168.1.1',
      });

      expect(result.action).toBe('throttle');
    });

    it('should apply stricter limits for super votes', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(4) // per minute (super limit is 3)
        .mockResolvedValueOnce(0);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'super',
      });

      expect(result.flags).toContain('RATE_LIMIT_PER_MINUTE');
    });

    it('should detect repeated same contestant votes', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(0) // per minute
        .mockResolvedValueOnce(0) // per hour
        .mockResolvedValueOnce(21); // same contestant
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(result.flags).toContain('REPEATED_SAME_CONTESTANT');
    });

    it('should detect rapid vote switching', async () => {
      mockPrisma.vote.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
      mockPrisma.vote.findMany.mockResolvedValue([
        { contestantId: 'c1' },
        { contestantId: 'c2' },
        { contestantId: 'c3' },
        { contestantId: 'c4' },
        { contestantId: 'c5' },
      ]);

      const result = await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(result.flags).toContain('RAPID_VOTE_SWITCHING');
    });

    it('should skip IP check when no IP provided', async () => {
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.vote.findMany.mockResolvedValue([]);

      await service.checkVote({
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        voteType: 'regular',
      });

      expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('getVoteAuditTrail', () => {
    it('should return vote audit trail with hash', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        userId: 'user-1',
        showId: 'show-1',
        contestantId: 'contestant-1',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      });

      const result = await service.getVoteAuditTrail('vote-1');

      expect(result).not.toBeNull();
      expect(result!.verified).toBe(true);
      expect(result!.hash).toBeDefined();
      expect(typeof result!.hash).toBe('string');
      expect(result!.hash).toHaveLength(64); // SHA-256 hex
    });

    it('should return null when vote not found', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      const result = await service.getVoteAuditTrail('nonexistent');

      expect(result).toBeNull();
    });
  });
});
