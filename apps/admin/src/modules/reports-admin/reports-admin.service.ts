import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

interface CreateReportDto {
  type: string;
  name: string;
  config?: unknown;
}

export interface SavedReport {
  id: string;
  name: string;
  category: string;
  dateRange: string;
  format: string;
  config: unknown;
  createdAt: string;
  createdBy?: string;
  lastRunAt?: string | null;
  lastRunSummary?: string | null;
}

/** system_settings key holding all saved admin reports. */
const REPORTS_KEY = 'admin.custom_reports';

@Injectable()
export class ReportsAdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  /** Read the saved-reports blob (tolerates corruption by starting fresh). */
  private async readSaved(): Promise<SavedReport[]> {
    const row = await this.prisma.systemSettings.findUnique({ where: { key: REPORTS_KEY } });
    const value = row?.value;
    return Array.isArray(value) ? (value as unknown as SavedReport[]) : [];
  }

  private async writeSaved(reports: SavedReport[]): Promise<void> {
    const value = reports as unknown as InputJsonValue;
    // system_settings is a postgres_fdw FOREIGN table here — ON CONFLICT
    // (Prisma upsert) is not supported through FDW, so find-then-write,
    // matching the creator-profile pattern in user-management.
    const existing = await this.prisma.systemSettings.findUnique({ where: { key: REPORTS_KEY } });
    if (existing) {
      await this.prisma.systemSettings.update({ where: { key: REPORTS_KEY }, data: { value } });
    } else {
      await this.prisma.systemSettings.create({
        data: {
          key: REPORTS_KEY,
          value,
          category: 'reporting',
          description: 'Saved custom admin reports (Report Builder output)',
        },
      });
    }
  }

  /**
   * GET /admin/reports returns BOTH halves of the Reports page:
   * the saved custom reports (array) and the platform activity summary
   * the old implementation computed (object). Kept under one payload so the
   * single client call keeps working.
   */
  async getReports(range: '7d' | '30d' | '90d' | 'all' = '30d') {
    const [saved, summary] = await Promise.all([this.readSaved(), this.getSummary(range)]);
    return { reports: saved, summary };
  }

  /** The analytics summary the previous implementation returned (unchanged shape). */
  private async getSummary(range: '7d' | '30d' | '90d' | 'all' = '30d') {
    const days = range === 'all' ? 365 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [userGrowth, contentPublished, revenue, reports] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.contentItem.findMany({
        where: { status: 'published', publishedAt: { gte: startDate } },
        select: { publishedAt: true },
        orderBy: { publishedAt: 'asc' },
      }),
      this.prisma.walletTransaction.findMany({
        where: { type: 'credit', status: 'completed', createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.report.findMany({
        where: { createdAt: { gte: startDate }, reportingUserId: { not: 'system' } },
        select: {
          id: true,
          status: true,
          type: true,
          reason: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const aggregateByDate = <T>(items: T[], dateKey: keyof T, valueFn: (item: T) => number) => {
      const byDate: Record<string, number> = {};
      items.forEach((item) => {
        const date = (item[dateKey] as Date).toISOString().split('T')[0];
        byDate[date] = (byDate[date] || 0) + valueFn(item);
      });
      return byDate;
    };

    return {
      userGrowth: aggregateByDate(userGrowth, 'createdAt', () => 1),
      contentPublished: aggregateByDate(contentPublished, 'publishedAt', () => 1),
      revenue: aggregateByDate(revenue, 'createdAt', (r) => Number(r.amount)),
      reports: {
        total: reports.length,
        pending: reports.filter((r) => r.status === 'pending').length,
        resolved: reports.filter((r) => r.status === 'resolved').length,
        byType: reports.reduce(
          (acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  }

  /** POST /admin/reports — save a custom report definition (no moderation rows). */
  async createReport(body: CreateReportDto, actorId?: string) {
    if (!body?.name?.trim()) {
      throw new BadRequestException('Report name is required');
    }
    if (!body?.type) {
      throw new BadRequestException('Report type is required');
    }

    const saved = await this.readSaved();
    const report: SavedReport = {
      id: `rpt_${randomUUID()}`,
      name: body.name.trim(),
      category: body.type,
      dateRange: (body.config as { dateRange?: string })?.dateRange ?? '30d',
      format: (body.config as { format?: string })?.format ?? 'json',
      config: body.config ?? {},
      createdAt: new Date().toISOString(),
      createdBy: actorId,
      lastRunAt: null,
      lastRunSummary: null,
    };
    await this.writeSaved([...saved, report]);

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'report.create',
      targetType: 'custom_report',
      targetId: report.id,
      details: { name: report.name, category: report.category },
    });

    return report;
  }

  /** POST /admin/reports/:id/execute — mark a saved report as run. */
  async executeReport(reportId: string, actorId?: string) {
    const saved = await this.readSaved();
    const report = saved.find((r) => r.id === reportId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    const now = new Date().toISOString();
    report.lastRunAt = now;
    report.lastRunSummary = `${report.category} · ${report.dateRange} · ${report.format}`;
    await this.writeSaved(saved);

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'report.execute',
      targetType: 'custom_report',
      targetId: report.id,
      details: { name: report.name },
    });

    return { id: report.id, status: 'executed', executedAt: now };
  }

  /** DELETE /admin/reports/:id — remove a saved report. */
  async deleteReport(id: string, actorId?: string) {
    const saved = await this.readSaved();
    const report = saved.find((r) => r.id === id);
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    await this.writeSaved(saved.filter((r) => r.id !== id));

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'report.delete',
      targetType: 'custom_report',
      targetId: id,
      details: { name: report.name },
    });

    return { id, deleted: true, deletedAt: new Date().toISOString() };
  }
}
