import { Test, TestingModule } from '@nestjs/testing';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

describe('ReferralController', () => {
  let controller: ReferralController;
  let service: ReferralService;

  const mockReferralService = {
    getReferralCode: jest.fn(),
    generateReferralCode: jest.fn(),
    applyReferralCode: jest.fn(),
    getReferrals: jest.fn(),
    getStats: jest.fn(),
    completeReferral: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralController],
      providers: [
        {
          provide: ReferralService,
          useValue: mockReferralService,
        },
      ],
    }).compile();

    controller = module.get<ReferralController>(ReferralController);
    service = module.get<ReferralService>(ReferralService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReferralCode', () => {
    it('should call referralService.getReferralCode with userId', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockResult = { success: true, data: { referralCode: null } };
      mockReferralService.getReferralCode.mockResolvedValue(mockResult);

      const result = await controller.getReferralCode(mockReq);

      expect(service.getReferralCode).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('generateReferralCode', () => {
    it('should call referralService.generateReferralCode with userId and dto', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const dto = { maxUses: 10, expiresAt: '2026-12-31T23:59:59.000Z' };
      const mockResult = {
        success: true,
        data: {
          referralCode: {
            id: 'rc-1',
            code: 'AZB-ABC12345',
            isActive: true,
            maxUses: 10,
            currentUses: 0,
            expiresAt: new Date('2026-12-31'),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };
      mockReferralService.generateReferralCode.mockResolvedValue(mockResult);

      const result = await controller.generateReferralCode(mockReq, dto);

      expect(service.generateReferralCode).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockResult);
    });

    it('should call referralService.generateReferralCode with empty dto', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const dto = {};
      const mockResult = {
        success: true,
        data: { referralCode: { id: 'rc-2', code: 'AZB-XYZ99999', isActive: true } },
      };
      mockReferralService.generateReferralCode.mockResolvedValue(mockResult);

      const result = await controller.generateReferralCode(mockReq, dto);

      expect(service.generateReferralCode).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('applyReferralCode', () => {
    it('should call referralService.applyReferralCode with userId and dto', async () => {
      const mockReq = { user: { sub: 'user-2' } } as any;
      const dto = { code: 'AZB-ABC12345' };
      const mockResult = {
        success: true,
        data: {
          message: 'Referral code applied successfully',
          referral: {
            id: 'ref-1',
            referrerId: 'user-1',
            referredId: 'user-2',
            status: 'pending',
            createdAt: new Date(),
          },
        },
      };
      mockReferralService.applyReferralCode.mockResolvedValue(mockResult);

      const result = await controller.applyReferralCode(mockReq, dto);

      expect(service.applyReferralCode).toHaveBeenCalledWith('user-2', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getReferrals', () => {
    it('should call referralService.getReferrals with default page and limit', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockResult = {
        success: true,
        data: { referrals: [], pagination: { page: 1, limit: 20, total: 0 } },
      };
      mockReferralService.getReferrals.mockResolvedValue(mockResult);

      const result = await controller.getReferrals(mockReq);

      expect(service.getReferrals).toHaveBeenCalledWith('user-1', 1, 20);
      expect(result).toEqual(mockResult);
    });

    it('should call referralService.getReferrals with custom page and limit', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockResult = {
        success: true,
        data: { referrals: [], pagination: { page: 2, limit: 10, total: 25 } },
      };
      mockReferralService.getReferrals.mockResolvedValue(mockResult);

      const result = await controller.getReferrals(mockReq, 2, 10);

      expect(service.getReferrals).toHaveBeenCalledWith('user-1', 2, 10);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStats', () => {
    it('should call referralService.getStats with userId', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockResult = {
        success: true,
        data: {
          stats: {
            totalReferrals: 5,
            completedReferrals: 3,
            pendingReferrals: 2,
            totalRewards: 150,
            referralCode: 'AZB-ABC12345',
          },
        },
      };
      mockReferralService.getStats.mockResolvedValue(mockResult);

      const result = await controller.getStats(mockReq);

      expect(service.getStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('completeReferral', () => {
    it('should call referralService.completeReferral with referralId', async () => {
      const mockReq = { user: { sub: 'user-1' } } as any;
      const mockResult = {
        success: true,
        data: {
          message: 'Referral completed successfully',
          referralId: 'ref-1',
          rewardAmount: 50,
        },
      };
      mockReferralService.completeReferral.mockResolvedValue(mockResult);

      const result = await controller.completeReferral(mockReq, 'ref-1');

      expect(service.completeReferral).toHaveBeenCalledWith('ref-1', 'user-1');
      expect(result).toEqual(mockResult);
    });
  });
});
