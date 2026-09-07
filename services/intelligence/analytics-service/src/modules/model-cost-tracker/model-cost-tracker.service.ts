import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface RecordCostDto {
  agentId?: string;
  requestId?: string;
  model: string;
  modelTier?: string;
  taskType?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs?: number;
  userId?: string;
  sessionId?: string;
  domain?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface CostSummary {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byAgent: Record<string, { requests: number; tokens: number; cost: number }>;
  byDomain: Record<string, { requests: number; tokens: number; cost: number }>;
  byTier: Record<string, { requests: number; tokens: number; cost: number }>;
}

@Injectable()
export class ModelCostTrackerService {
  private readonly logger = new Logger(ModelCostTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(dto: RecordCostDto) {
    this.logger.debug(
      `Recording cost: ${dto.model} $${dto.costUsd} for ${dto.taskType ?? 'unknown'}`
    );
    return this.prisma.modelCostEvent.create({
      data: {
        agentId: dto.agentId,
        requestId: dto.requestId,
        model: dto.model,
        modelTier: dto.modelTier,
        taskType: dto.taskType,
        inputTokens: dto.inputTokens,
        outputTokens: dto.outputTokens,
        totalTokens: dto.inputTokens + dto.outputTokens,
        costUsd: dto.costUsd,
        latencyMs: dto.latencyMs,
        userId: dto.userId,
        sessionId: dto.sessionId,
        domain: dto.domain,
        success: dto.success ?? true,
        errorMessage: dto.errorMessage,
        metadata: dto.metadata as never,
      },
    });
  }

  async getCostSummary(
    startDate: Date,
    endDate: Date,
    filters?: { agentId?: string; domain?: string; model?: string }
  ): Promise<CostSummary> {
    const where: Record<string, unknown> = {
      recordedAt: { gte: startDate, lte: endDate },
    };
    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.domain) where.domain = filters.domain;
    if (filters?.model) where.model = filters.model;

    const events = await this.prisma.modelCostEvent.findMany({ where });

    const byModel: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const byAgent: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const byDomain: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const byTier: Record<string, { requests: number; tokens: number; cost: number }> = {};

    let totalTokens = 0;
    let totalCostUsd = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const e of events) {
      totalTokens += e.totalTokens;
      totalCostUsd += Number(e.costUsd);
      if (e.latencyMs) {
        totalLatency += e.latencyMs;
        latencyCount++;
      }

      const modelKey = e.model;
      if (!byModel[modelKey]) byModel[modelKey] = { requests: 0, tokens: 0, cost: 0 };
      byModel[modelKey].requests++;
      byModel[modelKey].tokens += e.totalTokens;
      byModel[modelKey].cost += Number(e.costUsd);

      if (e.agentId) {
        if (!byAgent[e.agentId]) byAgent[e.agentId] = { requests: 0, tokens: 0, cost: 0 };
        byAgent[e.agentId].requests++;
        byAgent[e.agentId].tokens += e.totalTokens;
        byAgent[e.agentId].cost += Number(e.costUsd);
      }

      const domainKey = e.domain ?? 'unknown';
      if (!byDomain[domainKey]) byDomain[domainKey] = { requests: 0, tokens: 0, cost: 0 };
      byDomain[domainKey].requests++;
      byDomain[domainKey].tokens += e.totalTokens;
      byDomain[domainKey].cost += Number(e.costUsd);

      const tierKey = e.modelTier ?? 'unknown';
      if (!byTier[tierKey]) byTier[tierKey] = { requests: 0, tokens: 0, cost: 0 };
      byTier[tierKey].requests++;
      byTier[tierKey].tokens += e.totalTokens;
      byTier[tierKey].cost += Number(e.costUsd);
    }

    return {
      totalRequests: events.length,
      totalTokens,
      totalCostUsd,
      avgLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
      byModel,
      byAgent,
      byDomain,
      byTier,
    };
  }

  async getRecentEvents(limit = 50, agentId?: string) {
    const where: Record<string, unknown> = {};
    if (agentId) where.agentId = agentId;
    return this.prisma.modelCostEvent.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async checkBudget(agentId: string): Promise<{
    daily: { spent: number; budget: number; ok: boolean };
    monthly: { spent: number; budget: number; ok: boolean };
  }> {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyEvents, monthlyEvents] = await Promise.all([
      this.prisma.modelCostEvent.findMany({
        where: { agentId, recordedAt: { gte: startOfDay } },
      }),
      this.prisma.modelCostEvent.findMany({
        where: { agentId, recordedAt: { gte: startOfMonth } },
      }),
    ]);

    const dailySpent = dailyEvents.reduce((sum, e) => sum + Number(e.costUsd), 0);
    const monthlySpent = monthlyEvents.reduce((sum, e) => sum + Number(e.costUsd), 0);

    const dailyBudget = agent.costBudgetDaily ? Number(agent.costBudgetDaily) : Infinity;
    const monthlyBudget = agent.costBudgetMonthly ? Number(agent.costBudgetMonthly) : Infinity;

    return {
      daily: { spent: dailySpent, budget: dailyBudget, ok: dailySpent < dailyBudget },
      monthly: { spent: monthlySpent, budget: monthlyBudget, ok: monthlySpent < monthlyBudget },
    };
  }
}
