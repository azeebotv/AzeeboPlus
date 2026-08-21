import { Test, TestingModule } from '@nestjs/testing';
import { CreatorTrustSafetyService } from './creator-trust-safety.service';
import { PrismaService } from '../database/prisma.service';

describe('CreatorTrustSafetyService', () => {
  let service: CreatorTrustSafetyService;

  const mockPrisma = {
    creatorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorTrustSafetyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CreatorTrustSafetyService>(CreatorTrustSafetyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTrustScore', () => {
    it('should return trusted level for new creator', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: {},
      });

      const result = await service.getTrustScore('creator-1');

      expect(result.score).toBe(100);
      expect(result.level).toBe('trusted');
      expect(result.strikes).toBe(0);
    });

    it('should reduce score for strikes', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 3 },
      });

      const result = await service.getTrustScore('creator-1');

      expect(result.score).toBe(55); // 100 - (3 * 15)
      expect(result.level).toBe('probation');
      expect(result.strikes).toBe(3);
    });

    it('should reduce score for violations', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 1, creatorViolations: 5 },
      });

      const result = await service.getTrustScore('creator-1');

      expect(result.score).toBe(60); // 100 - 15 - 25
    });

    it('should return restricted level for very low score', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 5, creatorViolations: 5 },
      });

      const result = await service.getTrustScore('creator-1');

      expect(result.score).toBe(0); // 100 - 75 - 25, clamped to 0
      expect(result.level).toBe('restricted');
    });

    it('should return standard level for moderate score', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 1, creatorViolations: 2 },
      });

      const result = await service.getTrustScore('creator-1');

      expect(result.score).toBe(75); // 100 - 15 - 10
      expect(result.level).toBe('standard');
    });
  });

  describe('recordViolation', () => {
    it('should record violation and increment strikes', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 1 },
      });
      mockPrisma.creatorProfile.update.mockResolvedValue({});

      const result = await service.recordViolation({
        creatorId: 'creator-1',
        policy: 'no-violence',
        severity: 'high',
        description: 'Violent content',
        action: 'strike',
      });

      expect(result.id).toBeDefined();
      expect(result.action).toBe('strike');
      expect(mockPrisma.creatorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'creator-1' },
          data: expect.objectContaining({
            settings: expect.objectContaining({
              creatorStrikes: 2,
            }),
          }),
        })
      );
    });

    it('should not update strikes for warning action', async () => {
      mockPrisma.creatorProfile.update.mockResolvedValue({});

      const result = await service.recordViolation({
        creatorId: 'creator-1',
        policy: 'no-spam',
        severity: 'low',
        description: 'Spam content',
        action: 'warning',
      });

      expect(result.action).toBe('warning');
      expect(mockPrisma.creatorProfile.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.creatorProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('checkMonetizationEligibility', () => {
    it('should return eligible for trusted creator', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: {},
      });

      const result = await service.checkMonetizationEligibility('creator-1');

      expect(result.eligible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return ineligible for restricted creator', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 5, creatorViolations: 5 },
      });

      const result = await service.checkMonetizationEligibility('creator-1');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.requirements.trustScoreAbove60).toBe(false);
    });

    it('should check strike count requirement', async () => {
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator-1',
        settings: { creatorStrikes: 3 },
      });

      const result = await service.checkMonetizationEligibility('creator-1');

      expect(result.requirements.noRecentStrikes).toBe(false);
    });
  });
});
