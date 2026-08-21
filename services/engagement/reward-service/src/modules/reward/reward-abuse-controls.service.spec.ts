import { Test, TestingModule } from '@nestjs/testing';
import { RewardAbuseControlsService } from './reward-abuse-controls.service';
import { PrismaService } from '../database/prisma.service';

describe('RewardAbuseControlsService', () => {
  let service: RewardAbuseControlsService;

  const mockPrisma = {
    pointsLedger: {
      count: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RewardAbuseControlsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<RewardAbuseControlsService>(RewardAbuseControlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAbuse', () => {
    it('should pass when no abuse detected', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(0);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 0 } });

      const result = await service.checkAbuse('user-1');

      expect(result.passed).toBe(true);
      expect(result.flags).toHaveLength(0);
    });

    it('should flag rapid claiming', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(25);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 0 } });

      const result = await service.checkAbuse('user-1');

      expect(result.flags).toContain('RAPID_CLAIMING');
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });

    it('should flag abnormal earn rate', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(0);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 15000 } });

      const result = await service.checkAbuse('user-1');

      expect(result.flags).toContain('ABNORMAL_EARN_RATE');
    });

    it('should block when risk score >= 50', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(25);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 15000 } });

      const result = await service.checkAbuse('user-1');

      expect(result.passed).toBe(false);
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe('recordAdminAdjustment', () => {
    it('should record admin adjustment', async () => {
      mockPrisma.pointsLedger.create.mockResolvedValue({});

      const result = await service.recordAdminAdjustment(
        'user-1',
        5000,
        'Promotional credit',
        'admin-1'
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.amount).toBe(5000);
      expect(result.adjustedBy).toBe('admin-1');

      expect(mockPrisma.pointsLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          points: 5000,
          type: 'credit',
          reason: 'Promotional credit',
          metadata: expect.objectContaining({
            adjustedBy: 'admin-1',
            isAdminAdjustment: true,
          }),
        }),
      });
    });

    it('should use debit type for negative amounts', async () => {
      mockPrisma.pointsLedger.create.mockResolvedValue({});

      await service.recordAdminAdjustment('user-1', -2000, 'Penalty', 'admin-1');

      expect(mockPrisma.pointsLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'debit',
          }),
        })
      );
    });
  });

  describe('redeemSponsorReward', () => {
    it('should approve when no abuse detected', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(0);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 0 } });

      const result = await service.redeemSponsorReward('user-1', 'reward-1');

      expect(result.success).toBe(true);
    });

    it('should block when abuse detected', async () => {
      mockPrisma.pointsLedger.count.mockResolvedValue(25);
      mockPrisma.pointsLedger.aggregate.mockResolvedValue({ _sum: { points: 15000 } });

      const result = await service.redeemSponsorReward('user-1', 'reward-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('restricted');
    });
  });
});
