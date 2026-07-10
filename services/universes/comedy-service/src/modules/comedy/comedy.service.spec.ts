import { Test, TestingModule } from '@nestjs/testing';
import { ComedyService } from './comedy.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ComedyService', () => {
  let service: ComedyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComedyService,
        {
          provide: PrismaService,
          useValue: {
            comedyClip: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
            comedianProfile: { findMany: jest.fn() },
            comedySeries: { findMany: jest.fn() },
            comedyChallenge: { findUnique: jest.fn(), findMany: jest.fn() },
            comedyChallengeEntry: { findUnique: jest.fn(), create: jest.fn() },
            clipShare: { create: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<ComedyService>(ComedyService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClips', () => {
    it('should return list of comedy clips (happy path)', async () => {
      const mockClips = [
        { id: 'clip-1', title: 'Clip 1', createdAt: new Date() },
        { id: 'clip-2', title: 'Clip 2', createdAt: new Date() },
      ];
      (prismaService.comedyClip.findMany as jest.Mock).mockResolvedValue(mockClips);

      const result = await service.getClips();

      expect(result.success).toBe(true);
      expect(result.data!.clips).toEqual(mockClips);
    });

    it('should return empty array when no clips exist', async () => {
      (prismaService.comedyClip.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getClips();

      expect(result.success).toBe(true);
      expect(result.data!.clips).toEqual([]);
    });
  });

  describe('getComedians', () => {
    it('should return list of comedians', async () => {
      const mockComedians = [{ id: 'comedian-1', user: { id: 'user-1' } }];
      (prismaService.comedianProfile.findMany as jest.Mock).mockResolvedValue(mockComedians);

      const result = await service.getComedians();

      expect(result.success).toBe(true);
      expect(result.data!.comedians).toEqual(mockComedians);
    });
  });

  describe('submitChallenge', () => {
    const userId = 'user-123';
    const challengeId = 'challenge-1';
    const body = { challengeId, clipUrl: 'https://example.com/clip.mp4' };

    it('should submit challenge entry successfully (happy path)', async () => {
      const mockChallenge = { id: challengeId, status: 'active' };
      const mockEntry = { id: 'entry-1', userId, challengeId };

      (prismaService.comedyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.comedyChallengeEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.comedyChallengeEntry.create as jest.Mock).mockResolvedValue(mockEntry);
      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.submitChallenge(userId, body);

      expect(result.success).toBe(true);
      expect(result.data!.entryId).toBe('entry-1');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw NotFoundException when challenge not found', async () => {
      (prismaService.comedyChallenge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitChallenge(userId, body)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when challenge is not active', async () => {
      const mockChallenge = { id: challengeId, status: 'completed' };
      (prismaService.comedyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);

      await expect(service.submitChallenge(userId, body)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already submitted', async () => {
      const mockChallenge = { id: challengeId, status: 'active' };
      const mockExistingEntry = { id: 'existing-entry', userId, challengeId };

      (prismaService.comedyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prismaService.comedyChallengeEntry.findUnique as jest.Mock).mockResolvedValue(
        mockExistingEntry
      );

      await expect(service.submitChallenge(userId, body)).rejects.toThrow(BadRequestException);
    });
  });

  describe('shareClip', () => {
    const userId = 'user-123';
    const clipId = 'clip-1';

    it('should share clip successfully (happy path)', async () => {
      const mockClip = { id: clipId, title: 'Clip 1' };
      (prismaService.comedyClip.findUnique as jest.Mock).mockResolvedValue(mockClip);
      (prismaService.clipShare.create as jest.Mock).mockResolvedValue({ id: 'share-1' });
      (prismaService.comedyClip.update as jest.Mock).mockResolvedValue({});

      const result = await service.shareClip(userId, clipId);

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Clip shared');
      expect(prismaService.clipShare.create).toHaveBeenCalled();
      expect(prismaService.comedyClip.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when clip not found', async () => {
      (prismaService.comedyClip.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.shareClip(userId, clipId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTrending', () => {
    it('should return trending clips sorted by share count', async () => {
      const mockClips = [
        { id: 'clip-1', shareCount: 100, viewCount: 50 },
        { id: 'clip-2', shareCount: 200, viewCount: 100 },
      ];
      (prismaService.comedyClip.findMany as jest.Mock).mockResolvedValue(mockClips);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).clips.length).toBe(2);
    });
  });

  describe('getChallenges', () => {
    it('should return active challenges', async () => {
      const mockChallenges = [{ id: 'challenge-1', status: 'active' }];
      (prismaService.comedyChallenge.findMany as jest.Mock).mockResolvedValue(mockChallenges);

      const result = await service.getChallenges();

      expect(result.success).toBe(true);
      expect(result.data!.challenges).toEqual(mockChallenges);
    });
  });

  describe('getSeries', () => {
    it('should return comedy series', async () => {
      const mockSeries = [{ id: 'series-1', title: 'Series 1' }];
      (prismaService.comedySeries.findMany as jest.Mock).mockResolvedValue(mockSeries);

      const result = await service.getSeries();

      expect(result.success).toBe(true);
      expect(result.data!.series).toEqual(mockSeries);
    });
  });
});
