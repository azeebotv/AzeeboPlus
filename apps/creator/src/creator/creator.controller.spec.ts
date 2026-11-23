import { Test, TestingModule } from '@nestjs/testing';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { ArchivedContentSweeperService } from './archived-content-sweeper.service';
import { FeatureFlagService, creatorFlags } from '@azeebo/feature-flags';
import {
  CreateContentDto,
  UpdateContentDto,
  RequestPayoutDto,
  UpdatePayoutSettingsDto,
  UpdateSettingsDto,
  CreateSubscriptionTierDto,
  UpdateSubscriptionTierDto,
  SubmitChallengeDto,
  UpdateProfileDto,
  UpdateMonetizationSettingsDto,
} from './dto';

describe('CreatorController', () => {
  let controller: CreatorController;

  const mockFlags = {
    getAllFlagsWithDefaults: jest.fn(),
    isEnabled: jest.fn().mockResolvedValue(false),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  const mockCreatorService = {
    getDashboardStats: jest.fn(),
    getContent: jest.fn(),
    getPlaybackUrl: jest.fn(),
    createContent: jest.fn(),
    updateContent: jest.fn(),
    deleteContent: jest.fn(),
    getAnalytics: jest.fn(),
    getEarnings: jest.fn(),
    getEarningsSummary: jest.fn(),
    getEarningsHistory: jest.fn(),
    getPayouts: jest.fn(),
    requestPayout: jest.fn(),
    updatePayoutSettings: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getMonetization: jest.fn(),
    updateMonetization: jest.fn(),
    getWebMonetizationSettings: jest.fn(),
    getSubscriptionTiers: jest.fn(),
    createSubscriptionTier: jest.fn(),
    updateSubscriptionTier: jest.fn(),
    deleteSubscriptionTier: jest.fn(),
    getCreatorProfile: jest.fn(),
    updateCreatorProfile: jest.fn(),
    getSubscribers: jest.fn(),
    getSubscribersStats: jest.fn(),
    getUploads: jest.fn(),
    getChallenges: jest.fn(),
    getChallengeSubmissions: jest.fn(),
    getChallengeSubmissionDetail: jest.fn(),
    getChallengeLeaderboard: jest.fn(),
    submitChallenge: jest.fn(),
  };

  const mockAuthReq = {
    user: { id: 'usr-1', email: 'creator@azeebo.com', role: 'creator' },
  } as never;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreatorController],
      providers: [
        { provide: CreatorService, useValue: mockCreatorService },
        { provide: ArchivedContentSweeperService, useValue: {} },
        { provide: FeatureFlagService, useValue: mockFlags },
      ],
    }).compile();
    controller = module.get(CreatorController);
  });

  describe('flags endpoint', () => {
    it('returns creator UI flags plus universe visibility sentinels', async () => {
      mockFlags.getAllFlagsWithDefaults.mockResolvedValue([
        { key: creatorFlags.uploadV2, enabled: true },
        { key: 'universe.comedy.enabled', enabled: false },
        { key: 'universe.reality.enabled', enabled: true },
        { key: 'search_faceted', enabled: true },
      ]);

      const res = (await controller.getFlags()) as {
        success: boolean;
        data: Array<{ key: string; enabled: boolean }>;
      };

      expect(res.success).toBe(true);
      const keys = res.data.map((f) => f.key);
      expect(keys).toContain(creatorFlags.uploadV2);
      expect(keys).toContain('universe.comedy.enabled');
      expect(keys).toContain('universe.reality.enabled');
      expect(keys).not.toContain('search_faceted');
      expect(res.data.find((f) => f.key === 'universe.comedy.enabled')?.enabled).toBe(false);
    });
  });

  describe('content management endpoints', () => {
    it('delegates createContent with validated DTO', async () => {
      const dto: CreateContentDto = {
        title: 'New Comedy Skit',
        description: 'Hilarious scene',
        type: 'video',
        universe: 'comedy',
      };
      mockCreatorService.createContent.mockResolvedValue({ id: 'c-1', ...dto });

      const res = await controller.createContent(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.createContent).toHaveBeenCalledWith('usr-1', {
        ...dto,
        type: 'video',
      });
    });

    it('delegates updateContent with update DTO', async () => {
      const dto: UpdateContentDto = { title: 'Updated Title', isExclusive: true };
      mockCreatorService.updateContent.mockResolvedValue({ id: 'c-1', ...dto });

      const res = await controller.updateContent(mockAuthReq, 'c-1', dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updateContent).toHaveBeenCalledWith('c-1', 'usr-1', dto);
    });

    it('delegates deleteContent and returns success', async () => {
      mockCreatorService.deleteContent.mockResolvedValue(true);

      const res = await controller.deleteContent(mockAuthReq, 'c-1');
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ deleted: true });
      expect(mockCreatorService.deleteContent).toHaveBeenCalledWith('c-1', 'usr-1');
    });
  });

  describe('payouts and settings endpoints', () => {
    it('delegates requestPayout with DTO', async () => {
      const dto: RequestPayoutDto = { amount: 50000, method: 'bank_transfer' };
      mockCreatorService.requestPayout.mockResolvedValue({
        success: true,
        message: 'Payout requested',
      });

      const res = await controller.requestPayout(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.requestPayout).toHaveBeenCalledWith(
        'usr-1',
        50000,
        'bank_transfer'
      );
    });

    it('delegates updatePayoutSettings with DTO', async () => {
      const dto: UpdatePayoutSettingsDto = { method: 'bank_transfer', minimum: 10000 };
      mockCreatorService.updatePayoutSettings.mockResolvedValue({ success: true });

      const res = await controller.updatePayoutSettings(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updatePayoutSettings).toHaveBeenCalledWith('usr-1', dto);
    });

    it('delegates updateSettings with preferences DTO', async () => {
      const dto: UpdateSettingsDto = {
        payoutMethod: 'bank_transfer',
        notifications: { email: true, push: false, sms: false, marketing: false },
      };
      mockCreatorService.updateSettings.mockResolvedValue({ success: true });

      const res = await controller.updateSettings(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updateSettings).toHaveBeenCalledWith('usr-1', dto);
    });
  });

  describe('monetization and subscription tiers endpoints', () => {
    it('delegates patchWebMonetizationSettings with DTO', async () => {
      const dto: UpdateMonetizationSettingsDto = { tippingEnabled: true, minimumTip: 500 };
      mockCreatorService.updateMonetization.mockResolvedValue({ tipEnabled: true, tipMin: 500 });

      const res = await controller.patchWebMonetizationSettings(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updateMonetization).toHaveBeenCalledWith('usr-1', {
        tipEnabled: true,
        tipMin: 500,
        tipMax: undefined,
      });
    });

    it('delegates createSubscriptionTier with DTO', async () => {
      const dto: CreateSubscriptionTierDto = {
        name: 'Gold Supporter',
        price: 2500,
        perks: ['Discord access', 'Early releases'],
        isActive: true,
        displayOrder: 1,
      };
      mockCreatorService.createSubscriptionTier.mockResolvedValue({ id: 'tier-1', ...dto });

      const res = await controller.createSubscriptionTier(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.createSubscriptionTier).toHaveBeenCalledWith('usr-1', dto);
    });

    it('delegates updateSubscriptionTier with tierId and DTO', async () => {
      const dto: UpdateSubscriptionTierDto = { price: 3000 };
      mockCreatorService.updateSubscriptionTier.mockResolvedValue({ id: 'tier-1', price: 3000 });

      const res = await controller.updateSubscriptionTier(mockAuthReq, 'tier-1', dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updateSubscriptionTier).toHaveBeenCalledWith(
        'usr-1',
        'tier-1',
        dto
      );
    });

    it('delegates deleteSubscriptionTier', async () => {
      mockCreatorService.deleteSubscriptionTier.mockResolvedValue({ success: true });

      const res = await controller.deleteSubscriptionTier(mockAuthReq, 'tier-1');
      expect(res.success).toBe(true);
      expect(mockCreatorService.deleteSubscriptionTier).toHaveBeenCalledWith('usr-1', 'tier-1');
    });
  });

  describe('profile and challenges endpoints', () => {
    it('delegates updateOwnProfile with DTO', async () => {
      const dto: UpdateProfileDto = { bio: 'Official comedy creator', displayName: 'Comedy King' };
      mockCreatorService.updateCreatorProfile.mockResolvedValue({ id: 'p-1', ...dto });

      const res = await controller.updateOwnProfile(mockAuthReq, dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.updateCreatorProfile).toHaveBeenCalledWith('usr-1', dto);
    });

    it('delegates submitChallenge with DTO', async () => {
      const dto: SubmitChallengeDto = { title: 'Viral Punchline Challenge', contentId: 'c-1' };
      mockCreatorService.submitChallenge.mockResolvedValue({
        success: true,
        submissionId: 'sub-1',
      });

      const res = await controller.submitChallenge(mockAuthReq, 'ch-1', dto);
      expect(res.success).toBe(true);
      expect(mockCreatorService.submitChallenge).toHaveBeenCalledWith(
        'usr-1',
        'ch-1',
        'Viral Punchline Challenge',
        'c-1'
      );
    });
  });
});
