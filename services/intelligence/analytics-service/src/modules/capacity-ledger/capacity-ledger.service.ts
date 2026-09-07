import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateCapacityEntryDto {
  workflowId?: string;
  taskType: string;
  domain: string;
  baselineHours: number;
  postAgentHours: number;
  redeploymentTarget?: string;
  headcountAvoided?: boolean;
  vendorAvoided?: boolean;
  roleDescription?: string;
  validatedBy?: string;
  period: string;
  notes?: string;
}

@Injectable()
export class CapacityLedgerService {
  private readonly logger = new Logger(CapacityLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEntry(dto: CreateCapacityEntryDto) {
    const hoursReleased = dto.baselineHours - dto.postAgentHours;
    this.logger.log(`Recording capacity: ${dto.taskType} — ${hoursReleased}h released`);

    return this.prisma.capacityLedger.create({
      data: {
        ...dto,
        baselineHours: dto.baselineHours,
        postAgentHours: dto.postAgentHours,
        hoursReleased,
        headcountAvoided: dto.headcountAvoided ?? false,
        vendorAvoided: dto.vendorAvoided ?? false,
        validatedAt: dto.validatedBy ? new Date() : null,
      },
    });
  }

  async getPeriodSummary(period: string) {
    const entries = await this.prisma.capacityLedger.findMany({
      where: { period },
    });

    const totalBaseline = entries.reduce(
      (sum: number, e: { baselineHours: unknown }) => sum + Number(e.baselineHours),
      0
    );
    const totalPostAgent = entries.reduce(
      (sum: number, e: { postAgentHours: unknown }) => sum + Number(e.postAgentHours),
      0
    );
    const totalReleased = entries.reduce(
      (sum: number, e: { hoursReleased: unknown }) => sum + Number(e.hoursReleased),
      0
    );
    const headcountAvoided = entries.filter(
      (e: { headcountAvoided: boolean }) => e.headcountAvoided
    ).length;
    const vendorAvoided = entries.filter((e: { vendorAvoided: boolean }) => e.vendorAvoided).length;

    const byDomain: Record<string, { baseline: number; released: number; count: number }> = {};
    for (const e of entries) {
      if (!byDomain[e.domain]) byDomain[e.domain] = { baseline: 0, released: 0, count: 0 };
      byDomain[e.domain].baseline += Number(e.baselineHours);
      byDomain[e.domain].released += Number(e.hoursReleased);
      byDomain[e.domain].count++;
    }

    return {
      period,
      totalEntries: entries.length,
      totalBaselineHours: totalBaseline,
      totalPostAgentHours: totalPostAgent,
      totalHoursReleased: totalReleased,
      headcountAvoided,
      vendorAvoided,
      byDomain,
    };
  }

  async findAll(period?: string, domain?: string) {
    const where: Record<string, unknown> = {};
    if (period) where.period = period;
    if (domain) where.domain = domain;
    return this.prisma.capacityLedger.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async validateEntry(id: string, validatedBy: string) {
    return this.prisma.capacityLedger.update({
      where: { id },
      data: { validatedBy, validatedAt: new Date() },
    });
  }

  /**
   * Seed capacity ledger with sample AOS-MA-001 workflow data.
   * Returns count of created entries.
   */
  async seedEntries(period?: string) {
    const targetPeriod =
      period || `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

    const seedData: CreateCapacityEntryDto[] = [
      {
        taskType: 'payment.reconciliation',
        domain: 'FINANCE',
        baselineHours: 40,
        postAgentHours: 8,
        headcountAvoided: true,
        roleDescription: 'Accounts Payable Clerk',
        period: targetPeriod,
      },
      {
        taskType: 'invoice.processing',
        domain: 'FINANCE',
        baselineHours: 35,
        postAgentHours: 5,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'revenue.recognition',
        domain: 'FINANCE',
        baselineHours: 20,
        postAgentHours: 6,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'content.moderation',
        domain: 'COMMERCIAL',
        baselineHours: 60,
        postAgentHours: 12,
        headcountAvoided: true,
        roleDescription: 'Content Moderator',
        period: targetPeriod,
      },
      {
        taskType: 'rights.clearance',
        domain: 'RIGHTS',
        baselineHours: 30,
        postAgentHours: 10,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'royalty.calculation',
        domain: 'RIGHTS',
        baselineHours: 25,
        postAgentHours: 4,
        headcountAvoided: true,
        roleDescription: 'Royalty Analyst',
        period: targetPeriod,
      },
      {
        taskType: 'customer.support.triage',
        domain: 'CUSTOMER',
        baselineHours: 50,
        postAgentHours: 15,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'ticket.escalation',
        domain: 'CUSTOMER',
        baselineHours: 20,
        postAgentHours: 8,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'recommendation.tuning',
        domain: 'PRODUCT',
        baselineHours: 30,
        postAgentHours: 10,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'ab.test.analysis',
        domain: 'PRODUCT',
        baselineHours: 15,
        postAgentHours: 3,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'security.scan.review',
        domain: 'SECURITY',
        baselineHours: 20,
        postAgentHours: 6,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'incident.response.triage',
        domain: 'SECURITY',
        baselineHours: 10,
        postAgentHours: 4,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'onboarding.workflow',
        domain: 'PEOPLE',
        baselineHours: 15,
        postAgentHours: 5,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'report.generation',
        domain: 'PMO',
        baselineHours: 25,
        postAgentHours: 3,
        headcountAvoided: false,
        period: targetPeriod,
      },
      {
        taskType: 'sprint.retrospective.analysis',
        domain: 'PMO',
        baselineHours: 8,
        postAgentHours: 2,
        headcountAvoided: false,
        period: targetPeriod,
      },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    for (const dto of seedData) {
      try {
        // Check if similar entry exists for this period+taskType
        const existing = await this.prisma.capacityLedger.findFirst({
          where: { period: dto.period, taskType: dto.taskType },
        });
        if (existing) {
          skipped.push(dto.taskType);
          continue;
        }
        await this.createEntry(dto);
        created.push(dto.taskType);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to seed ${dto.taskType}: ${message}`);
      }
    }

    return { created, skipped, total: seedData.length };
  }
}
