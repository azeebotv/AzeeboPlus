import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService, CreateCaseRequest, ResolveCaseRequest } from './moderation.service';
import { PrismaService } from '../database/prisma.service';
import { SafetyScanningService } from './safety-scanning.service';

describe('ModerationService', () => {
  let service: ModerationService;

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
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCase', () => {
    it('should create a moderation case from a report', async () => {
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
      expect(mockPrismaService.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-1' },
      });
      expect(mockPrismaService.moderationCase.create).toHaveBeenCalledWith({
        data: {
          reportId: 'report-1',
          userId: 'user-1',
          status: 'pending',
        },
      });
    });

    it('should throw error when report does not exist', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(null);

      const request: CreateCaseRequest = {
        reportId: 'nonexistent',
        userId: 'user-1',
      };

      await expect(service.createCase(request)).rejects.toThrow('Report not found');
    });

    it('should create an audit event when case is created', async () => {
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

      await service.createCase(request);

      expect(mockPrismaService.auditEvent.create).toHaveBeenCalled();
    });
  });

  describe('getCase', () => {
    it('should return a case by ID', async () => {
      const mockCase = {
        id: 'case-1',
        reportId: 'report-1',
        userId: 'user-1',
        status: 'pending',
        report: { id: 'report-1', reason: 'harassment' },
        user: { id: 'user-1', name: 'John' },
        Appeal: [],
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);

      const result = await service.getCase('case-1');

      expect(result).toEqual(mockCase);
      expect(mockPrismaService.moderationCase.findUnique).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        include: {
          report: true,
          user: true,
          resolvedByUser: true,
          Appeal: true,
        },
      });
    });

    it('should return null when case does not exist', async () => {
      mockPrismaService.moderationCase.findUnique.mockResolvedValue(null);

      const result = await service.getCase('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listCases', () => {
    it('should return all cases when no filters provided', async () => {
      const mockCases = [
        { id: 'case-1', status: 'pending' },
        { id: 'case-2', status: 'resolved' },
      ];

      mockPrismaService.moderationCase.findMany.mockResolvedValue(mockCases);

      const result = await service.listCases();

      expect(result).toEqual(mockCases);
      expect(mockPrismaService.moderationCase.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        include: { report: true, user: true },
      });
    });

    it('should filter cases by status', async () => {
      const mockCases = [{ id: 'case-1', status: 'pending' }];

      mockPrismaService.moderationCase.findMany.mockResolvedValue(mockCases);

      const result = await service.listCases({ status: 'pending' });

      expect(result).toEqual(mockCases);
      expect(mockPrismaService.moderationCase.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        include: { report: true, user: true },
      });
    });

    it('should filter cases by userId', async () => {
      const mockCases = [{ id: 'case-1', userId: 'user-1' }];

      mockPrismaService.moderationCase.findMany.mockResolvedValue(mockCases);

      const result = await service.listCases({ userId: 'user-1' });

      expect(result).toEqual(mockCases);
      expect(mockPrismaService.moderationCase.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        include: { report: true, user: true },
      });
    });
  });

  describe('resolveCase', () => {
    it('should resolve a case with action and reason', async () => {
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

      const request: ResolveCaseRequest = {
        caseId: 'case-1',
        resolverId: 'moderator-1',
        action: 'remove',
        reason: 'Violates community guidelines',
      };

      const result = await service.resolveCase(request);

      expect(result).toEqual(resolvedCase);
      expect(mockPrismaService.moderationCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: {
          status: 'resolved',
          resolvedBy: 'moderator-1',
          resolutionAction: 'remove',
          resolutionReason: 'Violates community guidelines',
          resolvedAt: expect.any(Date),
        },
      });
    });
  });

  describe('createAppeal', () => {
    it('should create an appeal for a case', async () => {
      const mockCase = {
        id: 'case-1',
        status: 'resolved',
        userId: 'user-1',
      };

      const mockAppeal = {
        id: 'appeal-1',
        caseId: 'case-1',
        userId: 'user-1',
        reason: 'I believe this was a mistake',
        status: 'pending',
      };

      mockPrismaService.moderationCase.findUnique.mockResolvedValue(mockCase);
      mockPrismaService.appeal.create.mockResolvedValue(mockAppeal);
      mockPrismaService.moderationCase.update.mockResolvedValue({ id: 'case-1', status: 'appealed' });
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.createAppeal({
        caseId: 'case-1',
        userId: 'user-1',
        reason: 'I believe this was a mistake',
      });

      expect(result).toEqual(mockAppeal);
      expect(mockPrismaService.appeal.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case-1',
          userId: 'user-1',
          reason: 'I believe this was a mistake',
          status: 'pending',
        },
      });
    });
  });

  describe('resolveAppeal', () => {
    it('should resolve an appeal with success or failure', async () => {
      const mockAppeal = {
        id: 'appeal-1',
        status: 'pending',
        caseId: 'case-1',
        userId: 'user-1',
        case: { id: 'case-1', status: 'appealed' },
      };

      const resolvedAppeal = {
        id: 'appeal-1',
        status: 'successful',
        resolutionReason: 'Case reviewed and overturned',
      };

      mockPrismaService.appeal.findUnique.mockResolvedValue(mockAppeal);
      mockPrismaService.appeal.update.mockResolvedValue(resolvedAppeal);
      mockPrismaService.moderationCase.update.mockResolvedValue({ id: 'case-1', status: 'resolved' });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', trustScore: 75 });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', trustScore: 100 });
      mockPrismaService.trustScoreHistory.create.mockResolvedValue({ id: 'trust-1' });
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.resolveAppeal({
        appealId: 'appeal-1',
        resolverId: 'moderator-1',
        successful: true,
        reason: 'Case reviewed and overturned',
      });

      expect(result).toEqual(resolvedAppeal);
    });
  });

  describe('createSafetyAction', () => {
    it('should create a safety action', async () => {
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
    });
  });

  describe('updateTrustScore', () => {
    it('should update user trust score', async () => {
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

      const result = await service.updateTrustScore({
        userId: 'user-1',
        newScore: 85,
        reason: 'Good behavior',
      });

      expect(result).toEqual(mockTrustScore);
    });
  });

  describe('createAuditEvent', () => {
    it('should create an audit event', async () => {
      const mockAuditEvent = {
        id: 'audit-1',
        action: 'create',
        resourceType: 'case',
        resourceId: 'case-1',
        actorType: 'system',
      };

      mockPrismaService.auditEvent.create.mockResolvedValue(mockAuditEvent);

      const result = await service.createAuditEvent({
        action: 'create',
        resourceType: 'case',
        resourceId: 'case-1',
        actorType: 'system',
      });

      expect(result).toEqual(mockAuditEvent);
    });
  });

  describe('assignReviewer', () => {
    it('should assign a reviewer to a case', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        caseId: 'case-1',
        reviewerId: 'reviewer-1',
      };

      mockPrismaService.reviewerAssignment.findFirst.mockResolvedValue(null);
      mockPrismaService.reviewerAssignment.create.mockResolvedValue(mockAssignment);
      mockPrismaService.moderationCase.update.mockResolvedValue({ id: 'case-1', status: 'in_review' });
      mockPrismaService.auditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.assignReviewer({
        caseId: 'case-1',
        reviewerId: 'reviewer-1',
      });

      expect(result).toEqual(mockAssignment);
    });
  });
});
