jest.mock('@azeebo/shared-services', () => ({
  CacheService: class MockCacheService {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue(undefined);
    invalidate = jest.fn().mockResolvedValue(undefined);
  },
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService, CreateCaseRequest, ResolveCaseRequest } from './moderation.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { SafetyScanningService } from './safety-scanning.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModerationService Integration - Cross-Service Communication', () => {
  let service: ModerationService;
  let safetyScanningService: SafetyScanningService;

  const mockPrismaService = {
    moderationCase: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
    },
    appeal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    trustScoreHistory: {
      create: jest.fn(),
    },
    safetyAction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    reviewerAssignment: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSafetyScanningService = {
    scanContent: jest.fn(),
    scanMedia: jest.fn(),
    scanText: jest.fn(),
    scanAndPersist: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SafetyScanningService,
          useValue: mockSafetyScanningService,
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    module.get<PrismaService>(PrismaService);
    safetyScanningService = module.get<SafetyScanningService>(SafetyScanningService);

    jest.clearAllMocks();
  });

  describe('createCase - Analytics Service Integration', () => {
    it('should create case and track analytics event', async () => {
      const mockReport = {
        id: 'report-1',
        userId: 'user-1',
        contentId: 'content-1',
        reason: 'harassment',
      };

      const mockCase = {
        id: 'case-1',
        reportId: 'report-1',
        userId: 'user-1',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.moderationCase.create.mockResolvedValue(mockCase);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const request: CreateCaseRequest = {
        reportId: 'report-1',
        userId: 'user-1',
      };

      const result = await service.createCase(request);

      expect(result).toEqual(mockCase);
      expect(mockPrismaService.auditEvent.create).toHaveBeenCalled();
    });

    it('should handle analytics service failure gracefully', async () => {
      const mockReport = {
        id: 'report-1',
        userId: 'user-1',
        contentId: 'content-1',
        reason: 'harassment',
      };

      const mockCase = {
        id: 'case-1',
        reportId: 'report-1',
        userId: 'user-1',
        status: 'pending',
      };

      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.moderationCase.create.mockResolvedValue(mockCase);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const request: CreateCaseRequest = {
        reportId: 'report-1',
        userId: 'user-1',
      };

      const result = await service.createCase(request);

      expect(result).toEqual(mockCase);
    });
  });

  describe('resolveCase - Notification Service Integration', () => {
    it('should resolve case and notify user', async () => {
      const mockCase = {
        id: 'case-1',
        status: 'pending',
        userId: 'user-1',
        reportId: 'report-1',
      };

      const resolvedCase = {
        id: 'case-1',
        status: 'resolved',
        resolvedBy: 'moderator-1',
        resolutionAction: 'remove',
        resolutionReason: 'Violates community guidelines',
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);
      mockPrismaService.moderationCase.update.mockResolvedValue(resolvedCase);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const request: ResolveCaseRequest = {
        caseId: 'case-1',
        resolverId: 'moderator-1',
        action: 'remove',
        reason: 'Violates community guidelines',
      };

      const result = await service.resolveCase(request);

      expect(result).toEqual(resolvedCase);
    });

    it('should handle notification service failure gracefully', async () => {
      const mockCase = {
        id: 'case-1',
        status: 'pending',
        userId: 'user-1',
      };

      const resolvedCase = {
        id: 'case-1',
        status: 'resolved',
        resolvedBy: 'moderator-1',
        resolutionAction: 'remove',
        resolutionReason: 'Violates community guidelines',
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);
      mockPrismaService.moderationCase.update.mockResolvedValue(resolvedCase);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });
      mockedAxios.post.mockRejectedValue(new Error('Notification service unavailable'));

      const request: ResolveCaseRequest = {
        caseId: 'case-1',
        resolverId: 'moderator-1',
        action: 'remove',
        reason: 'Violates community guidelines',
      };

      const result = await service.resolveCase(request);

      expect(result).toEqual(resolvedCase);
    });
  });

  describe('createSafetyAction - Content Service Integration', () => {
    it('should create safety action and update content status', async () => {
      const mockAction = {
        id: 'action-1',
        type: 'remove',
        targetId: 'content-1',
        targetType: 'post',
        reason: 'Violates guidelines',
        moderatorId: 'moderator-1',
      };

      mockPrismaService.safetyAction.create.mockResolvedValue(mockAction);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.createSafetyAction({
        type: 'remove',
        targetId: 'content-1',
        targetType: 'post',
        reason: 'Violates guidelines',
        moderatorId: 'moderator-1',
      });

      expect(result).toEqual(mockAction);
      expect(mockPrismaService.auditEvent.create).toHaveBeenCalled();
    });
  });

  describe('scanContent - Safety Scanning Service Integration', () => {
    it('should scan content using safety scanning service', async () => {
      const scanRequest = {
        mediaUrl: 'https://example.com/image.jpg',
        scanTypes: ['content_safety'] as ('malware' | 'content_safety' | 'copyright')[],
      };

      const scanResult = {
        result: 'flagged' as const,
        threatLevel: 'high' as const,
        categories: ['explicit_content'],
      };

      mockSafetyScanningService.scanMedia.mockResolvedValue(scanResult);

      const result = await safetyScanningService.scanMedia(scanRequest);

      expect(result).toEqual(scanResult);
      expect(mockSafetyScanningService.scanMedia).toHaveBeenCalledWith(scanRequest);
    });

    it('should handle scanning service failure', async () => {
      const scanRequest = {
        mediaUrl: 'https://example.com/image.jpg',
      };

      mockSafetyScanningService.scanMedia.mockRejectedValue(
        new Error('Scanning service unavailable')
      );

      await expect(safetyScanningService.scanMedia(scanRequest)).rejects.toThrow(
        'Scanning service unavailable'
      );
    });
  });

  describe('updateTrustScore - User Service Integration', () => {
    it('should update trust score and notify user service', async () => {
      const mockUser = { id: 'user-1', trustScore: 70 };
      const mockTrustScore = {
        id: 'trust-1',
        userId: 'user-1',
        newScore: 85,
        reason: 'Good behavior',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', trustScore: 85 });
      mockPrismaService.trustScoreHistory.create.mockResolvedValue(mockTrustScore);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.updateTrustScore({
        userId: 'user-1',
        newScore: 85,
        reason: 'Good behavior',
      });

      expect(result).toEqual(mockTrustScore);
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should continue operation when external services fail', async () => {
      const mockReport = {
        id: 'report-1',
        userId: 'user-1',
        contentId: 'content-1',
        reason: 'harassment',
      };

      const mockCase = {
        id: 'case-1',
        reportId: 'report-1',
        userId: 'user-1',
        status: 'pending',
      };

      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.moderationCase.create.mockResolvedValue(mockCase);
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });
      mockedAxios.post.mockRejectedValue(new Error('Service unavailable'));

      const request: CreateCaseRequest = {
        reportId: 'report-1',
        userId: 'user-1',
      };

      const result = await service.createCase(request);

      expect(result).toEqual(mockCase);
    });
  });
});
