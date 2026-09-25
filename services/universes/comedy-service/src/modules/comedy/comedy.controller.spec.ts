jest.mock('libphonenumber-js/max', () => ({}));
jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  ApiBearerAuth: () => () => {},
  ApiProperty: () => () => {},
  ApiPropertyOptional: () => () => {},
  PartialType: (t: unknown) => t,
}));
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ComedyController } from './comedy.controller.js';
import { ComedyService } from './comedy.service.js';
import { RateLimitService } from '@azeebo/security';

jest.mock('@azeebo/shared-services', () => ({
  RedisService: jest.fn(),
}));
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagService: jest.fn(),
  FeatureFlagGuard: class {},
  FeatureFlag: () => () => {},
  comedyFlags: {
    challengesEnabled: 'comedy_challenges_enabled',
    specialsGate: 'comedy_specials_gate',
  },
}));

describe('ComedyController', () => {
  let controller: ComedyController;

  const mockComedyService = {
    getClips: jest.fn(),
    getComedians: jest.fn(),
    getSeries: jest.fn(),
    submitChallenge: jest.fn(),
    getChallenges: jest.fn(),
    shareClip: jest.fn(),
    getTrending: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000, limit: 10 }),
    resetRateLimit: jest.fn(),
    getRateLimitStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComedyController],
      providers: [
        {
          provide: ComedyService,
          useValue: mockComedyService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ComedyController>(ComedyController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getClips', () => {
    it('should return comedy clips', async () => {
      const result = { success: true, data: { clips: [] } };
      mockComedyService.getClips.mockResolvedValue(result);

      expect(await controller.getClips()).toEqual(result);
      expect(mockComedyService.getClips).toHaveBeenCalled();
    });

    it('should propagate errors from service', async () => {
      mockComedyService.getClips.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.getClips()).rejects.toThrow('Service unavailable');
    });
  });

  describe('getComedians', () => {
    it('should return comedian profiles', async () => {
      const result = { success: true, data: { comedians: [] } };
      mockComedyService.getComedians.mockResolvedValue(result);

      expect(await controller.getComedians()).toEqual(result);
      expect(mockComedyService.getComedians).toHaveBeenCalled();
    });
  });

  describe('getSeries', () => {
    it('should return comedy series', async () => {
      const result = { success: true, data: { series: [] } };
      mockComedyService.getSeries.mockResolvedValue(result);

      expect(await controller.getSeries()).toEqual(result);
      expect(mockComedyService.getSeries).toHaveBeenCalled();
    });
  });

  describe('submitChallenge', () => {
    it('should submit a challenge entry', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { challengeId: 'challenge-1', clipUrl: 'https://example.com/clip.mp4' };
      const result = {
        success: true,
        data: { entryId: 'entry-1', message: 'Challenge entry submitted' },
      };
      mockComedyService.submitChallenge.mockResolvedValue(result);

      expect(await controller.submitChallenge(req, body)).toEqual(result);
      expect(mockComedyService.submitChallenge).toHaveBeenCalledWith('user-123', body);
    });

    it('should throw NotFoundException when challenge not found', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { challengeId: 'nonexistent', clipUrl: 'https://example.com/clip.mp4' };
      mockComedyService.submitChallenge.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Challenge not found')
      );

      await expect(controller.submitChallenge(req, body)).rejects.toThrow('Challenge not found');
    });

    it('should throw BadRequestException when challenge is not active', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { challengeId: 'challenge-1', clipUrl: 'https://example.com/clip.mp4' };
      mockComedyService.submitChallenge.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Challenge is not active')
      );

      await expect(controller.submitChallenge(req, body)).rejects.toThrow(
        'Challenge is not active'
      );
    });
  });

  describe('getChallenges', () => {
    it('should return active challenges', async () => {
      const result = { success: true, data: { challenges: [] } };
      mockComedyService.getChallenges.mockResolvedValue(result);

      expect(await controller.getChallenges()).toEqual(result);
      expect(mockComedyService.getChallenges).toHaveBeenCalled();
    });
  });

  describe('shareClip', () => {
    it('should share a clip', async () => {
      const req = { user: { id: 'user-123' } };
      const clipId = 'clip-1';
      const result = { success: true, data: { message: 'Clip shared' } };
      mockComedyService.shareClip.mockResolvedValue(result);

      expect(await controller.shareClip(req, clipId)).toEqual(result);
      expect(mockComedyService.shareClip).toHaveBeenCalledWith('user-123', clipId);
    });

    it('should throw NotFoundException when clip not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockComedyService.shareClip.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Clip not found')
      );

      await expect(controller.shareClip(req, 'nonexistent')).rejects.toThrow('Clip not found');
    });
  });

  describe('getTrending', () => {
    it('should return trending clips', async () => {
      const result = { success: true, data: { clips: [] } };
      mockComedyService.getTrending.mockResolvedValue(result);

      expect(await controller.getTrending()).toEqual(result);
      expect(mockComedyService.getTrending).toHaveBeenCalled();
    });
  });
});
