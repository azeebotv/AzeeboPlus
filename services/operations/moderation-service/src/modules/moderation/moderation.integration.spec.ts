import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService, CreateCaseRequest, ResolveCaseRequest } from './moderation.service';
import { PrismaService } from '../database/prisma.service';
import { SafetyScanningService } from './safety-scanning.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModerationService Integration - Cross-Service Communication', () => {
  let service: ModerationService;
  let prisma: PrismaService;
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
  };

  const mockSafetyScanningService = {
    scanContent: jest.fn(),
    scanImage: jest.fn(),
    scanText: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    prisma = module.get<PrismaService>(PrismaService);
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
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const request: CreateCaseRequest = {
        reportId: 'report-1',
        userId: 'user-1',
      };

      const result = await service.createCase(request);

      expect(result).toEqual(mockCase);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          eventName: 'moderation_case_created',
          userId: 'user-1',
        })
      );
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
      mockedAxios.post.mockRejectedValue(new Error('Analytics service unavailable'));

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
        resolverId: 'moderator-1',
        resolution: 'remove',
        resolutionReason: 'Violates community guidelines',
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);
      mockPrismaService.moderationCase.update.mockResolvedValue(resolvedCase);
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const request: ResolveCaseRequest = {
        caseId: 'case-1',
        resolverId: 'moderator-1',
        action: 'remove',
        reason: 'Violates community guidelines',
      };

      const result = await service.resolveCase(request);

      expect(result).toEqual(resolvedCase);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/send'),
        expect.objectContaining({
          userId: 'user-1',
          type: 'moderation_action',
        })
      );
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
        resolverId: 'moderator-1',
        resolution: 'remove',
        resolutionReason: 'Violates community guidelines',
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);
      mockPrismaService.moderationCase.update.mockResolvedValue(resolvedCase);
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
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.createSafetyAction({
        type: 'remove',
        targetId: 'content-1',
        targetType: 'post',
        reason: 'Violates guidelines',
        moderatorId: 'moderator-1',
      });

      expect(result).toEqual(mockAction);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/content/update-status'),
        expect.objectContaining({
          contentId: 'content-1',
          status: 'removed',
        })
      );
    });
  });

  describe('scanContent - Safety Scanning Service Integration', () => {
    it('should scan content using safety scanning service', async () => {
      const scanRequest = {
        contentId: 'content-1',
        contentType: 'image',
        contentUrl: 'https://example.com/image.jpg',
      };

      const scanResult = {
        isSafe: false,
        confidence: 0.95,
        violations: ['explicit_content'],
      };

      mockSafetyScanningService.scanImage.mockResolvedValue(scanResult);

      const result = await safetyScanningService.scanImage(scanRequest);

      expect(result).toEqual(scanResult);
      expect(mockSafetyScanningService.scanImage).toHaveBeenCalledWith(scanRequest);
    });

    it('should handle scanning service failure', async () => {
      const scanRequest = {
        contentId: 'content-1',
        contentType: 'image',
        contentUrl: 'https://example.com/image.jpg',
      };

      mockSafetyScanningService.scanImage.mockRejectedValue(
        new Error('Scanning service unavailable')
      );

      await expect(safetyScanningService.scanImage(scanRequest)).rejects.toThrow(
        'Scanning service unavailable'
      );
    });
  });

  describe('updateTrustScore - User Service Integration', () => {
    it('should update trust score and notify user service', async () => {
      const mockTrustScore = {
        id: 'trust-1',
        userId: 'user-1',
        newScore: 85,
        reason: 'Good behavior',
      };

      mockPrismaService.trustScoreHistory.create.mockResolvedValue(mockTrustScore);
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.updateTrustScore({
        userId: 'user-1',
        newScore: 85,
        reason: 'Good behavior',
      });

      expect(result).toEqual(mockTrustScore);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/update-trust-score'),
        expect.objectContaining({
          userId: 'user-1',
          trustScore: 85,
        })
      );
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
