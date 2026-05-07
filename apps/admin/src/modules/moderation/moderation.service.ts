import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../database/prisma.service';

export interface ModerationStats {
  pendingReports: number;
  inReviewReports: number;
  resolvedReports: number;
  totalReports: number;
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

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
        expiresAt: duration ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
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
