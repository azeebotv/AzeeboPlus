import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SafetyScanningService, ScanRequest, ScanResult } from './safety-scanning.service';
import type {
  ModerationCase,
  Appeal,
  SafetyAction,
  TrustScoreHistory,
  AuditEvent,
  ReviewerAssignment,
  Report,
} from '@prisma/client';
import { ModerationResponse } from './interfaces/moderation-response.interface';

export interface CreateCaseRequest {
  reportId: string;
  userId: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResolveCaseRequest {
  caseId: string;
  resolverId: string;
  action: string;
  reason: string;
}

export interface CreateAppealRequest {
  caseId: string;
  userId: string;
  reason: string;
}

export interface ResolveAppealRequest {
  appealId: string;
  resolverId: string;
  successful: boolean;
  reason: string;
}

export interface CreateSafetyActionRequest {
  type: string;
  targetId: string;
  targetType: string;
  reason: string;
  moderatorId: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateTrustScoreRequest {
  userId: string;
  newScore: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAuditEventRequest {
  action: string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  actorType: string;
  details?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AssignReviewerRequest {
  caseId: string;
  reviewerId: string;
  assignedBy?: string;
}

const REPORT_TYPES = [
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'hate_speech', label: 'Hate Speech' },
  { id: 'violence', label: 'Violence or Threatening Content' },
  { id: 'sexual_content', label: 'Sexual Content' },
  { id: 'copyright', label: 'Copyright Violation' },
  { id: 'spam', label: 'Spam or Misleading' },
  { id: 'other', label: 'Other' },
];

const SAFETY_ACTION_TYPES = [
  { id: 'remove', label: 'Remove Content' },
  { id: 'hide', label: 'Hide Content' },
  { id: 'warn', label: 'Warn User' },
  { id: 'suspend', label: 'Suspend User' },
  { id: 'ban', label: 'Ban User' },
  { id: 'shadow_ban', label: 'Shadow Ban' },
];

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyScanningService: SafetyScanningService
  ) {}

  async createCase(request: CreateCaseRequest): Promise<ModerationCase> {
    const report = await this.prisma.report.findUnique({
      where: { id: request.reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const moderationCase = await this.prisma.moderationCase.create({
      data: {
        reportId: request.reportId,
        userId: request.userId,
        status: 'pending',
      },
    });

    await this.createAuditEvent({
      action: 'create',
      resourceType: 'case',
      resourceId: moderationCase.id,
      actorType: 'system',
      details: { reportId: request.reportId, userId: request.userId },
    });

    return moderationCase;
  }

  async getCase(caseId: string): Promise<ModerationCase | null> {
    return this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      include: {
        report: true,
        user: true,
        resolvedByUser: true,
        Appeal: true,
      },
    });
  }

  async listCases(filters?: {
    status?: string;
    userId?: string;
    resolvedBy?: string;
  }): Promise<ModerationCase[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resolvedBy) where.resolvedBy = filters.resolvedBy;

    return this.prisma.moderationCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { report: true, user: true },
    });
  }

  async resolveCase(request: ResolveCaseRequest): Promise<ModerationCase> {
    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: request.caseId },
    });

    if (!moderationCase) {
      throw new Error('Moderation case not found');
    }

    const previousState = { ...moderationCase };

    const updatedCase = await this.prisma.moderationCase.update({
      where: { id: request.caseId },
      data: {
        status: 'resolved',
        resolvedBy: request.resolverId,
        resolutionAction: request.action,
        resolutionReason: request.reason,
        resolvedAt: new Date(),
      },
    });

    await this.createAuditEvent({
      action: 'resolve',
      resourceType: 'case',
      resourceId: request.caseId,
      actorId: request.resolverId,
      actorType: 'moderator',
      previousState,
      newState: { ...updatedCase },
      details: { action: request.action, reason: request.reason },
    });

    if (request.action === 'suspend' || request.action === 'ban') {
      await this.updateTrustScore({
        userId: moderationCase.userId,
        newScore: Math.max(0, (await this.getTrustScore(moderationCase.userId)) - 50),
        reason: `Moderation action: ${request.action}`,
        metadata: { caseId: request.caseId },
      });
    }

    return updatedCase;
  }

  async createAppeal(request: CreateAppealRequest): Promise<Appeal> {
    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: request.caseId },
    });

    if (!moderationCase) {
      throw new Error('Moderation case not found');
    }

    if (moderationCase.status !== 'resolved') {
      throw new Error('Can only appeal resolved cases');
    }

    const appeal = await this.prisma.appeal.create({
      data: {
        caseId: request.caseId,
        userId: request.userId,
        reason: request.reason,
        status: 'pending',
      },
    });

    await this.prisma.moderationCase.update({
      where: { id: request.caseId },
      data: { status: 'appealed' },
    });

    await this.createAuditEvent({
      action: 'create',
      resourceType: 'appeal',
      resourceId: appeal.id,
      actorId: request.userId,
      actorType: 'user',
      details: { caseId: request.caseId, reason: request.reason },
    });

    return appeal;
  }

  async submitAppeal(
    userId: string,
    body: { caseId: string; reason: string }
  ): Promise<ModerationResponse> {
    try {
      const appeal = await this.createAppeal({
        caseId: body.caseId,
        userId,
        reason: body.reason,
      });
      return { success: true, data: appeal };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: { code: 'APPEAL_SUBMISSION_FAILED', message: err.message } };
    }
  }

  async resolveAppeal(request: ResolveAppealRequest): Promise<Appeal> {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: request.appealId },
      include: { case: true },
    });

    if (!appeal) {
      throw new Error('Appeal not found');
    }

    const status = request.successful ? 'successful' : 'rejected';

    const updatedAppeal = await this.prisma.appeal.update({
      where: { id: request.appealId },
      data: {
        status,
        resolvedBy: request.resolverId,
        resolutionReason: request.reason,
        resolvedAt: new Date(),
      },
    });

    if (request.successful) {
      await this.prisma.moderationCase.update({
        where: { id: appeal.caseId },
        data: { status: 'resolved', resolutionAction: 'appeal_upheld' },
      });

      await this.updateTrustScore({
        userId: appeal.userId,
        newScore: Math.min(100, (await this.getTrustScore(appeal.userId)) + 25),
        reason: 'Appeal successful',
        metadata: { appealId: request.appealId },
      });
    }

    await this.createAuditEvent({
      action: 'resolve',
      resourceType: 'appeal',
      resourceId: request.appealId,
      actorId: request.resolverId,
      actorType: 'moderator',
      details: { successful: request.successful, reason: request.reason },
    });

    return updatedAppeal;
  }

  async reportContent(
    userId: string,
    body: { type: string; contentId?: string; userId?: string; reason: string }
  ): Promise<ModerationResponse> {
    try {
      const report = await this.prisma.report.create({
        data: {
          reportingUserId: userId,
          type: body.type,
          contentId: body.contentId,
          userId: body.userId,
          reason: body.reason,
          status: 'pending',
        },
      });

      await this.createAuditEvent({
        action: 'create',
        resourceType: 'report',
        resourceId: report.id,
        actorId: userId,
        actorType: 'user',
        details: { type: body.type, reason: body.reason },
      });

      return { success: true, data: report };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: { code: 'REPORT_CREATION_FAILED', message: err.message } };
    }
  }

  async getReportTypes(): Promise<ModerationResponse> {
    return { success: true, data: REPORT_TYPES };
  }

  async getQueue(moderatorId: string): Promise<ModerationResponse> {
    const assignments = await this.prisma.reviewerAssignment.findMany({
      where: { reviewerId: moderatorId, status: 'active' },
      include: { case: { include: { report: true, user: true } } },
    });

    const cases = assignments.map((a) => a.case);
    return { success: true, data: cases };
  }

  async createSafetyAction(request: CreateSafetyActionRequest): Promise<SafetyAction> {
    const safetyAction = await this.prisma.safetyAction.create({
      data: {
        type: request.type,
        targetId: request.targetId,
        targetType: request.targetType,
        reason: request.reason,
        moderatorId: request.moderatorId,
        duration: request.duration,
        metadata: request.metadata as unknown as object,
      },
    });

    await this.createAuditEvent({
      action: 'create',
      resourceType: 'safety_action',
      resourceId: safetyAction.id,
      actorId: request.moderatorId,
      actorType: 'moderator',
      details: { ...request },
    });

    return safetyAction;
  }

  async takeSafetyAction(
    moderatorId: string,
    body: {
      type: string;
      targetId: string;
      targetType: 'content' | 'user';
      reason: string;
      duration?: number;
    }
  ): Promise<ModerationResponse> {
    try {
      const safetyAction = await this.createSafetyAction({
        type: body.type,
        targetId: body.targetId,
        targetType: body.targetType,
        reason: body.reason,
        moderatorId,
        duration: body.duration,
      });
      return { success: true, data: safetyAction };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: { code: 'SAFETY_ACTION_FAILED', message: err.message } };
    }
  }

  async listSafetyActions(filters?: {
    targetId?: string;
    targetType?: string;
    type?: string;
  }): Promise<SafetyAction[]> {
    const where: Record<string, unknown> = {};
    if (filters?.targetId) where.targetId = filters.targetId;
    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.type) where.type = filters.type;

    return this.prisma.safetyAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSafetyActions(
    moderatorId: string,
    filters: { targetType?: string; actionType?: string; startDate?: string; endDate?: string }
  ): Promise<ModerationResponse> {
    const where: Record<string, unknown> = {};
    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.actionType) where.type = filters.actionType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate)
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      if (filters?.endDate)
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
    }

    const actions = await this.prisma.safetyAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: actions };
  }

  async getSafetyActionTypes(): Promise<ModerationResponse> {
    return { success: true, data: SAFETY_ACTION_TYPES };
  }

  async updateTrustScore(request: UpdateTrustScoreRequest): Promise<TrustScoreHistory> {
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const oldScore = user.trustScore;

    await this.prisma.user.update({
      where: { id: request.userId },
      data: { trustScore: request.newScore },
    });

    const historyRecord = await this.prisma.trustScoreHistory.create({
      data: {
        userId: request.userId,
        oldScore,
        newScore: request.newScore,
        reason: request.reason,
        metadata: request.metadata as unknown as object,
      },
    });

    await this.createAuditEvent({
      action: 'update',
      resourceType: 'trust_score',
      resourceId: request.userId,
      actorType: 'system',
      details: { reason: request.reason, change: request.newScore - oldScore },
      previousState: { trustScore: oldScore },
      newState: { trustScore: request.newScore },
    });

    return historyRecord;
  }

  async getTrustScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    });
    return user?.trustScore || 100;
  }

  async getTrustScoreHistory(userId: string): Promise<TrustScoreHistory[]> {
    return this.prisma.trustScoreHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAuditEvent(request: CreateAuditEventRequest): Promise<AuditEvent> {
    return this.prisma.auditEvent.create({
      data: {
        action: request.action,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        actorId: request.actorId,
        actorType: request.actorType,
        details: request.details as unknown as object,
        previousState: request.previousState as unknown as object,
        newState: request.newState as unknown as object,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      },
    });
  }

  async listAuditEvents(filters?: {
    action?: string;
    resourceType?: string;
    resourceId?: string;
    actorId?: string;
  }): Promise<AuditEvent[]> {
    const where: Record<string, unknown> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.actorId) where.actorId = filters.actorId;

    return this.prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignReviewer(request: AssignReviewerRequest): Promise<ReviewerAssignment> {
    const existingAssignment = await this.prisma.reviewerAssignment.findFirst({
      where: { caseId: request.caseId, status: 'active' },
    });

    if (existingAssignment) {
      await this.prisma.reviewerAssignment.update({
        where: { id: existingAssignment.id },
        data: { status: 'reassigned' },
      });
    }

    const assignment = await this.prisma.reviewerAssignment.create({
      data: {
        caseId: request.caseId,
        reviewerId: request.reviewerId,
        assignedBy: request.assignedBy,
        status: 'active',
      },
    });

    await this.prisma.moderationCase.update({
      where: { id: request.caseId },
      data: { status: 'in_review' },
    });

    await this.createAuditEvent({
      action: 'assign',
      resourceType: 'reviewer_assignment',
      resourceId: assignment.id,
      actorId: request.assignedBy,
      actorType: 'moderator',
      details: { caseId: request.caseId, reviewerId: request.reviewerId },
    });

    return assignment;
  }

  async completeReviewerAssignment(assignmentId: string): Promise<ReviewerAssignment> {
    return this.prisma.reviewerAssignment.update({
      where: { id: assignmentId },
      data: { status: 'completed', completedAt: new Date() },
    });
  }

  async getReviewerAssignments(reviewerId?: string): Promise<ReviewerAssignment[]> {
    const where: Record<string, unknown> = {};
    if (reviewerId) where.reviewerId = reviewerId;

    return this.prisma.reviewerAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      include: { case: true },
    });
  }

  async getReport(reportId: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id: reportId },
      include: { reportingUser: true, reportedUser: true, content: true },
    });
  }

  async listReports(filters?: {
    status?: string;
    type?: string;
    reportingUserId?: string;
  }): Promise<Report[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.reportingUserId) where.reportingUserId = filters.reportingUserId;

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { reportingUser: true, content: true },
    });
  }

  async updateReportStatus(reportId: string, status: string): Promise<Report> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const previousState = { status: report.status };

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    await this.createAuditEvent({
      action: 'update',
      resourceType: 'report',
      resourceId: reportId,
      actorType: 'system',
      previousState,
      newState: { status },
    });

    return updatedReport;
  }

  async scanContentMedia(
    request: ScanRequest
  ): Promise<{ success: boolean; data: { scanId: string; result: ScanResult } }> {
    const { scanId, result } = await this.safetyScanningService.scanAndPersist(request);

    return {
      success: true,
      data: { scanId, result },
    };
  }

  async getScanById(scanId: string): Promise<ModerationResponse> {
    try {
      const scan = await this.prisma.safetyScan.findUnique({
        where: { id: scanId },
      });

      if (!scan) {
        return { success: false, error: { code: 'SCAN_NOT_FOUND', message: 'Scan not found' } };
      }

      return { success: true, data: scan };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: { code: 'SCAN_FETCH_FAILED', message: err.message } };
    }
  }

  async checkContentSafety(contentId: string): Promise<ModerationResponse> {
    try {
      const scans = await this.prisma.safetyScan.findMany({
        where: { contentId },
        orderBy: { createdAt: 'desc' },
      });

      if (scans.length === 0) {
        return {
          success: true,
          data: { isSafe: true, scans: [], message: 'No safety scans found for this content' },
        };
      }

      const latestScan = scans[0];
      const isSafe = latestScan.result === 'clean' || latestScan.status === 'completed';

      return {
        success: true,
        data: {
          contentId,
          isSafe,
          latestScan: {
            id: latestScan.id,
            status: latestScan.status,
            result: latestScan.result,
            threatLevel: latestScan.threatLevel,
            categories: latestScan.categories,
          },
          scanCount: scans.length,
        },
      };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: { code: 'SAFETY_CHECK_FAILED', message: err.message } };
    }
  }
}
