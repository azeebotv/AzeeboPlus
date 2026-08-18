import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CreateReportDto {
  type: string;
  name: string;
  config: unknown;
}

@Injectable()
export class ReportsAdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getReports(range: '7d' | '30d' | '90d' | 'all' = '30d') {
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
        where: { createdAt: { gte: startDate } },
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

  async createReport(body: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        reportingUserId: 'system',
        type: body.type,
        reason: body.name,
        status: 'pending',
      },
    });

    return {
      id: report.id,
      type: report.type,
      name: body.name,
      status: report.status,
      config: body.config,
      createdAt: report.createdAt.toISOString(),
    };
  }

  async executeReport(reportId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    // Mark as resolved with execution metadata
    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionAction: 'executed',
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      executedAt: updated.resolvedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async deleteReport(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    await this.prisma.report.delete({ where: { id } });
    return { id, deleted: true, deletedAt: new Date().toISOString() };
  }
}
