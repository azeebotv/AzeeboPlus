import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

export interface ModerationStats {
  pendingReports: number;
  inReviewReports: number;
  resolvedReports: number;
  totalReports: number;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30 days
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  async getReports(page = 1, limit = 20, status?: string, type?: string): Promise<unknown> {
    const where: Prisma.ReportWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedUser: { select: { id: true, displayName: true, email: true } },
          reportingUser: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportById(id: string): Promise<unknown> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reportedUser: { select: { id: true, displayName: true, email: true, avatar: true } },
        reportingUser: { select: { id: true, displayName: true, email: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async resolveReport(
    reportId: string,
    action: string,
    reason: string,
    adminId: string
  ): Promise<unknown> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'resolved',
        resolutionAction: action,
        resolutionReason: reason,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId,
      details: { action, reason, reportType: report.type, reportStatus: report.status },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async dismissReport(reportId: string, reason: string, adminId: string): Promise<unknown> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'dismissed',
        resolutionReason: reason,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'dismiss_report',
      targetType: 'report',
      targetId: reportId,
      details: { reason, reportType: report.type, reportStatus: report.status },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async takeSafetyAction(
    targetId: string,
    targetType: string,
    actionType: string,
    reason: string,
    adminId: string,
    duration?: string
  ): Promise<unknown> {
    const safetyAction = await this.prisma.safetyAction.create({
      data: {
        targetId,
        targetType,
        actionType,
        reason,
        takenBy: adminId,
        duration,
        status: 'active',
        expiresAt: duration ? new Date(Date.now() + this.parseDuration(duration)) : null,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'safety_action',
      targetType,
      targetId,
      details: { actionType, reason, duration },
    });

    return {
      success: true,
      data: safetyAction,
    };
  }

  async getSafetyActions(targetId?: string): Promise<unknown> {
    const where: Prisma.SafetyActionWhereInput = {};

    if (targetId) {
      where.targetId = targetId;
    }

    const actions = await this.prisma.safetyAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      actions,
    };
  }

  async getModerationStats(): Promise<ModerationStats> {
    const [pendingReports, inReviewReports, resolvedReports, totalReports] = await Promise.all([
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'in_review' } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count(),
    ]);

    return {
      pendingReports,
      inReviewReports,
      resolvedReports,
      totalReports,
    };
  }

  async getReportTypes(): Promise<unknown> {
    // Fetch from moderation-service API if available, otherwise use defaults
    const moderationServiceUrl = process.env.MODERATION_SERVICE_URL || 'http://localhost:3022';
    try {
      const response = await fetch(`${moderationServiceUrl}/api/moderation/report-types`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = (await response.json()) as { data?: unknown };
        if (data.data) return data.data;
      }
    } catch (error) {
      // Fall back to defaults
      this.logger.warn(
        `Failed to fetch report types from moderation-service: ${(error as Error).message}`
      );
    }

    return [
      { value: 'harassment', label: 'Harassment' },
      { value: 'hate_speech', label: 'Hate Speech' },
      { value: 'violence', label: 'Violence' },
      { value: 'sexual_content', label: 'Sexual Content' },
      { value: 'copyright', label: 'Copyright' },
      { value: 'spam', label: 'Spam' },
      { value: 'other', label: 'Other' },
    ];
  }
}
