import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ModerationResponse } from './interfaces/moderation-response.interface';
import { SafetyScanningService, ScanRequest, ScanResult } from './safety-scanning.service';

interface ReportData {
  type: string;
  contentId?: string;
  userId?: string;
  reason: string;
}

interface SafetyActionData {
  type: string;
  targetId: string;
  targetType: 'content' | 'user';
  reason: string;
  duration?: number;
}

interface SafetyFilters {
  targetType?: 'content' | 'user';
  actionType?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyScanningService: SafetyScanningService
  ) {}

  async scanContentMedia(request: ScanRequest): Promise<{ scanId: string; result: ScanResult }> {
    return this.safetyScanningService.scanAndPersist(request);
  }

  async checkContentSafety(contentId: string): Promise<ModerationResponse> {
    const result = await this.safetyScanningService.checkContentSafety(contentId);
    return {
      success: true,
      data: result,
    };
  }

  async getScanById(scanId: string): Promise<ModerationResponse> {
    const scan = await this.safetyScanningService.getScanById(scanId);
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    return {
      success: true,
      data: scan,
    };
  }

  async reportContent(
    reportingUserId: string,
    reportData: ReportData
  ): Promise<ModerationResponse> {
    const { type, contentId, userId, reason } = reportData;

    if (!reason || reason.length < 5) {
      throw new BadRequestException('Report reason must be at least 5 characters');
    }

    const report = await this.prisma.report.create({
      data: {
        reportingUserId,
        type,
        contentId,
        userId,
        reason,
        status: 'pending',
      },
      include: {
        reportingUser: true,
        content: true,
        reportedUser: true,
      },
    });

    if (userId) {
      await this.updateTrustScore(userId, 'report_received');
    }

    return {
      success: true,
      data: {
        reportId: report.id,
        status: 'pending',
        message: 'Report submitted successfully',
      },
    };
  }

  async getReportTypes(): Promise<ModerationResponse> {
    const reportTypes = [
      { id: 'harassment', name: 'Harassment or bullying' },
      { id: 'hate_speech', name: 'Hate speech' },
      { id: 'violence', name: 'Violence or dangerous acts' },
      { id: 'sexual_content', name: 'Sexual content' },
      { id: 'copyright', name: 'Copyright violation' },
      { id: 'spam', name: 'Spam or misleading' },
      { id: 'other', name: 'Other' },
    ];

    return {
      success: true,
      data: reportTypes,
    };
  }

  async submitAppeal(
    userId: string,
    appealData: { caseId: string; reason: string }
  ): Promise<ModerationResponse> {
    const { caseId, reason } = appealData;

    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
    });

    if (!moderationCase) {
      throw new NotFoundException('Moderation case not found');
    }

    if (moderationCase.userId !== userId) {
      throw new BadRequestException('You can only appeal cases against your own account');
    }

    if (moderationCase.status !== 'resolved') {
      throw new BadRequestException('Only resolved cases can be appealed');
    }

    const appeal = await this.prisma.appeal.create({
      data: {
        caseId,
        userId,
        reason,
        status: 'pending',
      },
    });

    await this.updateTrustScore(userId, 'appeal_submitted');

    return {
      success: true,
      data: {
        appealId: appeal.id,
        status: 'pending',
        message: 'Appeal submitted successfully',
      },
    };
  }

  async getQueue(userId: string): Promise<ModerationResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !['moderator', 'admin', 'super_admin'].includes(user.role)) {
      throw new BadRequestException('Not authorized to access moderation queue');
    }

    const queue = await this.prisma.report.findMany({
      where: { status: 'pending' },
      include: {
        reportingUser: true,
        content: true,
        reportedUser: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return {
      success: true,
      data: {
        queue,
        totalPending: queue.length,
      },
    };
  }

  async getTrustScore(userId: string): Promise<ModerationResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reports = await this.prisma.report.count({
      where: { userId },
    });

    const resolvedReports = await this.prisma.report.count({
      where: { userId, status: 'resolved' },
    });

    const appeals = await this.prisma.appeal.count({
      where: { userId },
    });

    const successfulAppeals = await this.prisma.appeal.count({
      where: { userId, status: 'successful' },
    });

    let trustScore = 100;

    if (resolvedReports > 0) {
      const violationRate = resolvedReports / reports;
      trustScore -= violationRate * 50;
    }

    if (successfulAppeals > 0) {
      trustScore += successfulAppeals * 10;
    }

    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

    return {
      success: true,
      data: {
        userId,
        trustScore,
        reportsReceived: reports,
        resolvedReports: resolvedReports,
        appeals: appeals,
        successfulAppeals,
      },
    };
  }

  async takeAction(
    moderatorId: string,
    caseId: string,
    action: string,
    reason: string
  ): Promise<ModerationResponse> {
    const caseRecord = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Moderation case not found');
    }

    await this.prisma.moderationCase.update({
      where: { id: caseId },
      data: {
        status: 'resolved',
        resolvedBy: moderatorId,
        resolutionAction: action,
        resolutionReason: reason,
        resolvedAt: new Date(),
      },
    });

    if (caseRecord.userId) {
      await this.updateTrustScore(caseRecord.userId, action);
    }

    return {
      success: true,
      data: {
        message: 'Action taken successfully',
        caseId,
        action,
      },
    };
  }

  private async updateTrustScore(userId: string, action: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    let scoreChange = 0;

    switch (action) {
      case 'report_received':
        scoreChange = -5;
        break;
      case 'warning':
        scoreChange = -10;
        break;
      case 'suspend':
        scoreChange = -25;
        break;
      case 'ban':
        scoreChange = -50;
        break;
      case 'appeal_submitted':
        scoreChange = -2;
        break;
      case 'appeal_successful':
        scoreChange = 20;
        break;
      default:
        scoreChange = 0;
    }

    const currentScore = user.trustScore || 100;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: newScore },
    });
  }

  async takeSafetyAction(
    moderatorId: string,
    actionData: SafetyActionData
  ): Promise<ModerationResponse> {
    const { type, targetId, targetType, reason, duration } = actionData;

    const validActions = ['remove', 'hide', 'warn', 'suspend', 'ban', 'shadow_ban'];
    if (!validActions.includes(type)) {
      throw new BadRequestException(`Invalid action type. Valid types: ${validActions.join(', ')}`);
    }

    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
    });

    if (!moderator || !['moderator', 'admin', 'super_admin'].includes(moderator.role)) {
      throw new BadRequestException('Not authorized to perform safety actions');
    }

    if (targetType === 'content') {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: targetId },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      let status = content.status;
      switch (type) {
        case 'remove':
          status = 'archived';
          break;
        case 'hide':
          status = 'draft';
          break;
        default:
          break;
      }

      if (status !== content.status) {
        await this.prisma.contentItem.update({
          where: { id: targetId },
          data: { status },
        });
      }

      if (content.creatorId) {
        await this.updateTrustScore(content.creatorId, type);
      }
    } else if (targetType === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: targetId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.updateTrustScore(targetId, type);
    }

    await this.prisma.safetyAction.create({
      data: {
        type,
        targetId,
        targetType,
        reason,
        moderatorId,
        duration,
      },
    });

    return {
      success: true,
      data: {
        message: 'Safety action taken successfully',
        action: type,
        targetId,
        targetType,
      },
    };
  }

  async getSafetyActions(
    moderatorId: string,
    filters?: SafetyFilters
  ): Promise<ModerationResponse> {
    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
    });

    if (!moderator || !['moderator', 'admin', 'super_admin'].includes(moderator.role)) {
      throw new BadRequestException('Not authorized to view safety actions');
    }

    const where: Record<string, unknown> = {};

    if (filters?.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters?.actionType) {
      where.type = filters.actionType;
    }

    if (filters?.startDate) {
      where.createdAt = where.createdAt || {};
      (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
    }

    if (filters?.endDate) {
      where.createdAt = where.createdAt || {};
      (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
    }

    const actions = await this.prisma.safetyAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: actions,
    };
  }

  async getSafetyActionTypes(): Promise<ModerationResponse> {
    const actionTypes = [
      { id: 'remove', name: 'Remove', description: 'Permanently remove content' },
      { id: 'hide', name: 'Hide', description: 'Temporarily hide content' },
      { id: 'warn', name: 'Warn', description: 'Warn user about violation' },
      { id: 'suspend', name: 'Suspend', description: 'Temporarily suspend user' },
      { id: 'ban', name: 'Ban', description: 'Permanently ban user' },
      { id: 'shadow_ban', name: 'Shadow Ban', description: 'Limit user visibility' },
    ];

    return {
      success: true,
      data: actionTypes,
    };
  }
}
