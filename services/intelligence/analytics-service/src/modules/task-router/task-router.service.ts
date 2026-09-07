import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  RouteTaskDto,
  RecordExecutionDto,
  AutoClassifyDto,
  SeedClassificationsDto,
  HIERARCHY,
  PROCESS_MINING_STEPS,
  WorkClass,
} from './dto/task-router.dto';

// ─── Auto-Classification Heuristics ──────────────────────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  finance: [
    'invoice',
    'payment',
    'revenue',
    'close',
    'reconcil',
    'budget',
    'ledger',
    'journal',
    'refund',
    'treasury',
    'cash',
    'collection',
    'ar ',
    'ap ',
  ],
  commercial: [
    'proposal',
    'sponsor',
    'partner',
    'crm',
    'opportunity',
    'pipeline',
    'quote',
    'pricing',
    'negotiat',
  ],
  rights: [
    'contract',
    'rights',
    'licence',
    'license',
    'obligation',
    'renewal',
    'chain-of-title',
    'territory',
    'window',
  ],
  customer: [
    'support',
    'ticket',
    'complaint',
    'retention',
    'reactivation',
    'lifecycle',
    'satisfaction',
    'nps',
  ],
  product: ['backlog', 'prd', 'sprint', 'release', 'deploy', 'build', 'test', 'qa', 'engineering'],
  people: ['hiring', 'onboard', 'performance', 'headcount', 'capacity', 'skills', 'business-case'],
  security: [
    'access',
    'incident',
    'vulnerability',
    'audit',
    'compliance',
    'privacy',
    'threat',
    'sre',
    'slo',
  ],
  creative: ['content', 'editorial', 'creative', 'canon', 'story', 'script', 'production', 'asset'],
};

// ─── Seed Data: Common Azeebo+ Task Classifications ─────────

const SEED_CLASSIFICATIONS: CreateClassificationDto[] = [
  // ── Finance Domain ──
  {
    taskType: 'month_end_close',
    workClass: 'A1',
    domain: 'finance',
    priority: 'high',
    complexityTier: 'T3',
    requiredAgents: ['EA-01'],
    requiredApprovals: ['Financial Controller'],
    slaHours: 72,
    estimatedCostUsd: 2.5,
    processStep: 'P5',
    processOwner: 'CFO / Financial Controller',
    volumePerWeek: 0.25,
    baselineMinutes: 480,
    description: 'Month-end close preparation, reconciliation, and reporting',
    keywords: ['close', 'month-end', 'reconcil', 'journal', 'report'],
    reversible: 'bounded-reversible',
    dataSensitivity: 'restricted',
    automationCandidate: true,
  },
  {
    taskType: 'invoice_generation',
    workClass: 'A2',
    domain: 'finance',
    priority: 'normal',
    complexityTier: 'T1',
    requiredAgents: ['EA-03'],
    requiredApprovals: [],
    slaHours: 24,
    estimatedCostUsd: 0.15,
    processStep: 'P4',
    processOwner: 'Finance',
    volumePerWeek: 50,
    baselineMinutes: 15,
    description: 'Generate invoices from billing events',
    keywords: ['invoice', 'bill', 'generate'],
    reversible: 'reversible',
    dataSensitivity: 'confidential',
    automationCandidate: true,
  },
  {
    taskType: 'cash_forecast',
    workClass: 'A1',
    domain: 'finance',
    priority: 'high',
    complexityTier: 'T3',
    requiredAgents: ['EA-02'],
    requiredApprovals: ['Treasury'],
    slaHours: 4,
    estimatedCostUsd: 1.8,
    processStep: 'P5',
    processOwner: 'CFO / Treasury',
    volumePerWeek: 5,
    baselineMinutes: 120,
    description: '13-week cash flow forecast',
    keywords: ['cash', 'forecast', 'treasury', 'liquidity', '13-week'],
    reversible: 'reversible',
    dataSensitivity: 'restricted',
    automationCandidate: true,
  },
  {
    taskType: 'reconciliation_check',
    workClass: 'S',
    domain: 'finance',
    priority: 'normal',
    complexityTier: 'T0',
    requiredAgents: [],
    requiredApprovals: [],
    slaHours: 1,
    estimatedCostUsd: 0.01,
    processStep: 'P4',
    processOwner: 'Finance',
    volumePerWeek: 100,
    baselineMinutes: 5,
    description: 'Automated ledger reconciliation check',
    keywords: ['reconcil', 'match', 'verify', 'check'],
    reversible: 'reversible',
    dataSensitivity: 'confidential',
    automationCandidate: true,
  },
  {
    taskType: 'budget_variance_analysis',
    workClass: 'A2',
    domain: 'finance',
    priority: 'normal',
    complexityTier: 'T2',
    requiredAgents: ['EA-01'],
    requiredApprovals: [],
    slaHours: 8,
    estimatedCostUsd: 0.8,
    processStep: 'P5',
    processOwner: 'Finance',
    volumePerWeek: 1,
    baselineMinutes: 60,
    description: 'Budget vs actual variance analysis',
    keywords: ['budget', 'variance', 'actual', 'analysis'],
    reversible: 'reversible',
    dataSensitivity: 'confidential',
    automationCandidate: true,
  },

  // ── Commercial Domain ──
  {
    taskType: 'proposal_assembly',
    workClass: 'A1',
    domain: 'commercial',
    priority: 'normal',
    complexityTier: 'T3',
    requiredAgents: ['EA-04'],
    requiredApprovals: ['Commercial Lead'],
    slaHours: 48,
    estimatedCostUsd: 3.0,
    processStep: 'P5',
    processOwner: 'Commercial Lead',
    volumePerWeek: 5,
    baselineMinutes: 240,
    description: 'Assemble commercial proposal from templates and research',
    keywords: ['proposal', 'bid', 'rfp', 'tender', 'sponsor'],
    reversible: 'reversible',
    dataSensitivity: 'confidential',
    automationCandidate: true,
  },
  {
    taskType: 'opportunity_research',
    workClass: 'A2',
    domain: 'commercial',
    priority: 'low',
    complexityTier: 'T2',
    requiredAgents: ['EA-04'],
    requiredApprovals: [],
    slaHours: 24,
    estimatedCostUsd: 0.5,
    processStep: 'P5',
    processOwner: 'Commercial Lead',
    volumePerWeek: 10,
    baselineMinutes: 30,
    description: 'Research potential sponsor/partner opportunities',
    keywords: ['research', 'opportunity', 'sponsor', 'partner', 'prospect'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    automationCandidate: true,
  },

  // ── Rights Domain ──
  {
    taskType: 'contract_review',
    workClass: 'A1',
    domain: 'rights',
    priority: 'high',
    complexityTier: 'T3',
    requiredAgents: ['EA-05'],
    requiredApprovals: ['Legal'],
    slaHours: 72,
    estimatedCostUsd: 4.0,
    processStep: 'P5',
    processOwner: 'Legal / Rights',
    volumePerWeek: 3,
    baselineMinutes: 180,
    description: 'Review contract terms and extract obligations',
    keywords: ['contract', 'review', 'terms', 'clause', 'obligation'],
    reversible: 'bounded-reversible',
    dataSensitivity: 'restricted',
    automationCandidate: false,
  },
  {
    taskType: 'rights_expiry_check',
    workClass: 'S',
    domain: 'rights',
    priority: 'normal',
    complexityTier: 'T0',
    requiredAgents: [],
    requiredApprovals: [],
    slaHours: 1,
    estimatedCostUsd: 0.005,
    processStep: 'P4',
    processOwner: 'Rights',
    volumePerWeek: 200,
    baselineMinutes: 2,
    description: 'Automated check for approaching rights expirations',
    keywords: ['rights', 'expiry', 'expiration', 'renewal', 'window'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    automationCandidate: true,
  },

  // ── Customer Domain ──
  {
    taskType: 'support_ticket_triage',
    workClass: 'A2',
    domain: 'customer',
    priority: 'high',
    complexityTier: 'T1',
    requiredAgents: ['EA-10'],
    requiredApprovals: [],
    slaHours: 1,
    estimatedCostUsd: 0.05,
    processStep: 'P5',
    processOwner: 'Customer / Growth',
    volumePerWeek: 500,
    baselineMinutes: 3,
    description: 'Classify and route incoming support tickets',
    keywords: ['support', 'ticket', 'triage', 'classif', 'route'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    automationCandidate: true,
  },
  {
    taskType: 'retention_campaign',
    workClass: 'A1',
    domain: 'customer',
    priority: 'normal',
    complexityTier: 'T2',
    requiredAgents: ['EA-10'],
    requiredApprovals: ['Customer Lead'],
    slaHours: 24,
    estimatedCostUsd: 0.8,
    processStep: 'P5',
    processOwner: 'Customer / Growth',
    volumePerWeek: 10,
    baselineMinutes: 45,
    description: 'Prepare and send retention campaign to at-risk users',
    keywords: ['retention', 'churn', 'campaign', 'reactivat'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    automationCandidate: true,
  },

  // ── Product Domain ──
  {
    taskType: 'release_pack',
    workClass: 'A1',
    domain: 'product',
    priority: 'high',
    complexityTier: 'T3',
    requiredAgents: ['EA-11'],
    requiredApprovals: ['Product Lead', 'Architecture Guardian'],
    slaHours: 24,
    estimatedCostUsd: 2.0,
    processStep: 'P5',
    processOwner: 'Product / Technology',
    volumePerWeek: 2,
    baselineMinutes: 120,
    description: 'Prepare release pack with evidence, tests, and rollback',
    keywords: ['release', 'deploy', 'ship', 'launch', 'pack'],
    reversible: 'bounded-reversible',
    dataSensitivity: 'internal',
    automationCandidate: false,
  },

  // ── Security Domain ──
  {
    taskType: 'incident_classification',
    workClass: 'A2',
    domain: 'security',
    priority: 'urgent',
    complexityTier: 'T2',
    requiredAgents: ['EA-12'],
    requiredApprovals: ['Security Lead'],
    slaHours: 0.25,
    estimatedCostUsd: 0.3,
    processStep: 'P5',
    processOwner: 'Technology / Security',
    volumePerWeek: 20,
    baselineMinutes: 5,
    description: 'Classify and prioritize security incidents',
    keywords: ['incident', 'security', 'breach', 'vulnerability', 'alert'],
    reversible: 'reversible',
    dataSensitivity: 'restricted',
    automationCandidate: true,
  },
  {
    taskType: 'access_review',
    workClass: 'H1',
    domain: 'security',
    priority: 'normal',
    complexityTier: 'T2',
    requiredAgents: ['EA-12'],
    requiredApprovals: ['Security Lead', 'System Owner'],
    slaHours: 48,
    estimatedCostUsd: 5.0,
    processStep: 'P6',
    processOwner: 'Technology / Security',
    volumePerWeek: 5,
    baselineMinutes: 60,
    description: 'Review and validate user access permissions',
    keywords: ['access', 'review', 'permission', 'rbac', 'privilege'],
    reversible: 'bounded-reversible',
    dataSensitivity: 'restricted',
    automationCandidate: false,
  },

  // ── People Domain ──
  {
    taskType: 'role_business_case',
    workClass: 'H1',
    domain: 'people',
    priority: 'normal',
    complexityTier: 'T3',
    requiredAgents: ['EA-07'],
    requiredApprovals: ['People Lead', 'CFO'],
    slaHours: 120,
    estimatedCostUsd: 8.0,
    processStep: 'P6',
    processOwner: 'People / CEO',
    volumePerWeek: 1,
    baselineMinutes: 300,
    description: 'Prepare business case for new role/headcount',
    keywords: ['hiring', 'headcount', 'business-case', 'role', 'recruit'],
    reversible: 'bounded-reversible',
    dataSensitivity: 'restricted',
    automationCandidate: false,
  },

  // ── Elimination Candidates ──
  {
    taskType: 'duplicate_reporting',
    workClass: 'X',
    domain: 'pmo',
    priority: 'low',
    complexityTier: 'T0',
    requiredAgents: [],
    requiredApprovals: ['PMO'],
    slaHours: 0,
    estimatedCostUsd: 0,
    processStep: 'P1',
    processOwner: 'COO / PMO',
    volumePerWeek: 20,
    baselineMinutes: 30,
    description: 'Duplicate reports that add no value beyond existing dashboards',
    keywords: ['duplicate', 'report', 'redundant', 'unnecessary'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    eliminationCandidate: true,
  },
  {
    taskType: 'manual_data_copy',
    workClass: 'X',
    domain: 'operations',
    priority: 'low',
    complexityTier: 'T0',
    requiredAgents: [],
    requiredApprovals: [],
    slaHours: 0,
    estimatedCostUsd: 0,
    processStep: 'P1',
    processOwner: 'Operations',
    volumePerWeek: 15,
    baselineMinutes: 20,
    description: 'Manual copying of data between systems that should be automated',
    keywords: ['copy', 'manual', 'spreadsheet', 'export', 'import'],
    reversible: 'reversible',
    dataSensitivity: 'internal',
    eliminationCandidate: true,
  },
];

@Injectable()
export class TaskRouterService {
  private readonly logger = new Logger(TaskRouterService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────

  async createClassification(dto: CreateClassificationDto) {
    const existing = await this.prisma.taskClassification.findUnique({
      where: { taskType: dto.taskType },
    });
    if (existing) {
      throw new ConflictException(
        `Task type "${dto.taskType}" already classified. Use PUT to update.`
      );
    }

    this.logger.log(
      `Classifying task: ${dto.taskType} → ${dto.workClass} (${HIERARCHY[dto.workClass]?.choice})`
    );

    return this.prisma.taskClassification.create({
      data: {
        taskType: dto.taskType,
        workClass: dto.workClass,
        domain: dto.domain,
        priority: dto.priority ?? 'normal',
        complexityTier: dto.complexityTier,
        requiredAgents: dto.requiredAgents ?? [],
        requiredApprovals: dto.requiredApprovals ?? [],
        slaHours: dto.slaHours,
        estimatedCostUsd: dto.estimatedCostUsd,
        processStep: dto.processStep,
        processOwner: dto.processOwner,
        volumePerWeek: dto.volumePerWeek,
        baselineMinutes: dto.baselineMinutes,
        description: dto.description,
        keywords: dto.keywords ?? [],
        inputPatterns: dto.inputPatterns ?? [],
        outputPatterns: dto.outputPatterns ?? [],
        dependencies: dto.dependencies ?? [],
        triggersEvents: dto.triggersEvents ?? [],
        reversible: dto.reversible ?? 'reversible',
        dataSensitivity: dto.dataSensitivity ?? 'internal',
        automationCandidate: dto.automationCandidate ?? false,
        eliminationCandidate: dto.eliminationCandidate ?? false,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async findAll(filters: {
    domain?: string;
    workClass?: string;
    search?: string;
    automationCandidate?: boolean;
    eliminationCandidate?: boolean;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.domain) where.domain = filters.domain;
    if (filters.workClass) where.workClass = filters.workClass;
    if (filters.automationCandidate !== undefined)
      where.automationCandidate = filters.automationCandidate;
    if (filters.eliminationCandidate !== undefined)
      where.eliminationCandidate = filters.eliminationCandidate;
    if (filters.search) {
      where.OR = [
        { taskType: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.taskClassification.findMany({ where, orderBy: { taskType: 'asc' } });
  }

  async findOne(taskType: string) {
    const classification = await this.prisma.taskClassification.findUnique({
      where: { taskType },
      include: { executions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!classification) throw new NotFoundException(`Task type "${taskType}" not found`);
    return classification;
  }

  async update(taskType: string, dto: UpdateClassificationDto) {
    const existing = await this.prisma.taskClassification.findUnique({ where: { taskType } });
    if (!existing) throw new NotFoundException(`Task type "${taskType}" not found`);

    this.logger.log(`Updating classification: ${taskType}`);
    const data: Record<string, unknown> = { ...dto };
    if (dto.keywords) data.keywords = dto.keywords;
    if (dto.dependencies) data.dependencies = dto.dependencies;
    if (dto.triggersEvents) data.triggersEvents = dto.triggersEvents;
    return this.prisma.taskClassification.update({
      where: { taskType },
      data: data as Prisma.TaskClassificationUpdateInput,
    });
  }

  async delete(taskType: string) {
    const existing = await this.prisma.taskClassification.findUnique({ where: { taskType } });
    if (!existing) throw new NotFoundException(`Task type "${taskType}" not found`);
    return this.prisma.taskClassification.delete({ where: { taskType } });
  }

  // ── Core Routing ──────────────────────────────────────────

  async routeTask(taskType: string, dto: RouteTaskDto = {}) {
    const classification = await this.prisma.taskClassification.findUnique({ where: { taskType } });

    if (!classification) {
      this.logger.warn(`No classification for "${taskType}" — defaulting to H1 (human-led)`);
      return this.buildRoutingDecision(taskType, null, dto);
    }

    const workClass = dto.overrideWorkClass ?? classification.workClass;

    // Cost optimization: try to downgrade if possible
    const optimizedWorkClass = await this.optimizeTier(classification, workClass as WorkClass);

    const decision = {
      taskType: classification.taskType,
      workClass: optimizedWorkClass,
      originalWorkClass: classification.workClass,
      domain: classification.domain,
      complexityTier: classification.complexityTier,
      executionChoice: HIERARCHY[optimizedWorkClass]?.choice ?? 'HUMAN JUDGEMENT',
      reason: HIERARCHY[optimizedWorkClass]?.useWhen ?? 'Defaulting to human judgement',
      costTier: HIERARCHY[optimizedWorkClass]?.costTier ?? 5,
      requiredAgents: (classification.requiredAgents as string[]) ?? [],
      requiredApprovals: (classification.requiredApprovals as string[]) ?? [],
      estimatedCostUsd: classification.estimatedCostUsd
        ? Number(classification.estimatedCostUsd)
        : null,
      slaHours: classification.slaHours,
      processStep: classification.processStep,
      processOwner: classification.processOwner,
      priority: classification.priority,
      reversible: classification.reversible,
      dataSensitivity: classification.dataSensitivity,
      wasOptimized: optimizedWorkClass !== workClass,
      optimizationReason:
        optimizedWorkClass !== workClass
          ? `Downgraded from ${workClass} to ${optimizedWorkClass} based on cost/reliability analysis`
          : undefined,
      assignedAgent: dto.overrideAgent ?? this.selectAgent(classification, optimizedWorkClass),
      assignedModel:
        dto.overrideModel ?? this.selectModel(optimizedWorkClass, classification.complexityTier),
    };

    // Record the execution
    await this.recordRoutingExecution(classification, decision, dto);

    return decision;
  }

  private async optimizeTier(
    classification: {
      eliminationCandidate: boolean;
      volumePerWeek: number | null;
      automationCandidate: boolean;
      complexityTier: string;
    },
    requestedClass: WorkClass
  ): Promise<WorkClass> {
    // If elimination candidate and high volume, suggest elimination
    if (classification.eliminationCandidate && (classification.volumePerWeek ?? 0) > 10) {
      return 'X';
    }

    // If automation candidate and low complexity, try to downgrade
    if (classification.automationCandidate) {
      const currentTier = HIERARCHY[requestedClass]?.costTier ?? 5;
      // If it's currently H1 or H0 but marked as automation candidate, try A2
      if (currentTier >= 4 && classification.complexityTier === 'T0') return 'S';
      if (currentTier >= 4 && classification.complexityTier === 'T1') return 'A2';
      if (currentTier >= 4 && classification.complexityTier === 'T2') return 'A2';
    }

    return requestedClass;
  }

  private selectAgent(
    classification: { requiredAgents: unknown },
    workClass: WorkClass
  ): string | null {
    if (workClass === 'X' || workClass === 'S') return null; // No agent needed
    const agents = (classification.requiredAgents as string[]) ?? [];
    return agents.length > 0 ? agents[0] : null;
  }

  private selectModel(workClass: WorkClass, complexityTier: string): string | null {
    if (workClass === 'X' || workClass === 'S') return null;
    if (workClass === 'A2') {
      if (complexityTier === 'T0' || complexityTier === 'T1') return 'claude-haiku-3.5';
      return 'claude-sonnet-4-20250514';
    }
    if (workClass === 'A1') return 'claude-sonnet-4-20250514';
    return null; // H0/H1 don't use models directly
  }

  private async recordRoutingExecution(
    classification: {
      taskType: string;
      domain: string;
      complexityTier: string;
      priority: string;
      requiredApprovals: unknown;
    },
    decision: Record<string, unknown>,
    dto: RouteTaskDto
  ) {
    try {
      await this.prisma.$transaction([
        this.prisma.taskExecution.create({
          data: {
            taskType: classification.taskType,
            correlationId: dto.correlationId,
            workClass: decision.workClass as string,
            executionChoice: decision.executionChoice as string,
            domain: classification.domain,
            priority: classification.priority,
            complexityTier: classification.complexityTier,
            assignedAgent: decision.assignedAgent as string,
            assignedModel: decision.assignedModel as string,
            modelTier: classification.complexityTier,
            requiredApprovals: classification.requiredApprovals as Prisma.InputJsonValue,
            status: 'routed',
            metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          },
        }),
        this.prisma.taskClassification.update({
          where: { taskType: classification.taskType },
          data: {
            lastRoutedAt: new Date(),
            totalRouted: { increment: 1 },
          },
        }),
      ]);
    } catch (err) {
      this.logger.error(`Failed to record routing execution: ${err}`);
    }
  }

  private buildRoutingDecision(
    taskType: string,
    classification: { domain?: string; complexityTier?: string } | null,
    dto: RouteTaskDto
  ) {
    return {
      taskType,
      workClass: dto.overrideWorkClass ?? 'H1',
      originalWorkClass: 'H1',
      domain: classification?.domain ?? 'unknown',
      complexityTier: classification?.complexityTier ?? 'T3',
      executionChoice: 'HUMAN JUDGEMENT',
      reason: 'No classification found — defaulting to human-led with agent assistance',
      costTier: 4,
      requiredAgents: [],
      requiredApprovals: ['Human Owner'],
      estimatedCostUsd: null,
      slaHours: null,
      processStep: null,
      processOwner: null,
      priority: 'normal',
      reversible: 'reversible',
      dataSensitivity: 'internal',
      wasOptimized: false,
      assignedAgent: null,
      assignedModel: null,
    };
  }

  // ── Batch Routing ─────────────────────────────────────────

  async routeBatch(
    tasks: { taskType: string; correlationId?: string; overrideWorkClass?: WorkClass }[]
  ) {
    const results = [];
    for (const task of tasks) {
      try {
        const decision = await this.routeTask(task.taskType, {
          correlationId: task.correlationId,
          overrideWorkClass: task.overrideWorkClass,
        });
        results.push({ ...decision, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ taskType: task.taskType, success: false, error: message });
      }
    }
    return {
      total: tasks.length,
      routed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ── Auto-Classification ───────────────────────────────────

  async autoClassify(dto: AutoClassifyDto) {
    const text = `${dto.description} ${dto.inputSample ?? ''}`.toLowerCase();
    const scores: Record<string, { score: number; domain: string; matchedKeywords: string[] }> = {};

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matched = keywords.filter((kw) => text.includes(kw));
      if (matched.length > 0) {
        scores[domain] = { score: matched.length, domain, matchedKeywords: matched };
      }
    }

    const sorted = Object.values(scores).sort((a, b) => b.score - a.score);
    const bestMatch = sorted[0];

    if (!bestMatch) {
      return {
        suggestedWorkClass: 'H1',
        suggestedDomain: dto.domain ?? 'unknown',
        confidence: 0,
        reason: 'No keyword matches found — defaulting to human-led',
        matchedDomains: [],
      };
    }

    // Determine work class based on keyword density and domain
    let suggestedWorkClass: WorkClass = 'A2';
    if (bestMatch.score >= 3) suggestedWorkClass = 'A2'; // High confidence → low-cost AI
    if (bestMatch.score >= 5) suggestedWorkClass = 'A1'; // Very high → specialist reasoning
    if (text.includes('review') || text.includes('approve') || text.includes('decide'))
      suggestedWorkClass = 'H1';
    if (text.includes('duplicate') || text.includes('unnecessary') || text.includes('redundant'))
      suggestedWorkClass = 'X';

    return {
      suggestedWorkClass,
      suggestedDomain: bestMatch.domain,
      confidence: Math.min(bestMatch.score / 5, 1),
      reason: `Matched ${bestMatch.matchedKeywords.length} keywords in ${bestMatch.domain} domain`,
      matchedDomains: sorted.map((s) => ({
        domain: s.domain,
        score: s.score,
        keywords: s.matchedKeywords,
      })),
    };
  }

  // ── Execution Tracking ────────────────────────────────────

  async recordExecution(dto: RecordExecutionDto) {
    const execution = await this.prisma.taskExecution.findFirst({
      where: { taskType: dto.taskType, status: 'routed' },
      orderBy: { createdAt: 'desc' },
    });

    if (execution) {
      return this.prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: dto.status,
          assignedAgent: dto.assignedAgent,
          assignedModel: dto.assignedModel,
          modelTier: dto.modelTier,
          approvalStatus: dto.approvalStatus,
          approvedBy: dto.approvedBy,
          durationMs: dto.durationMs,
          success: dto.success,
          costUsd: dto.costUsd,
          tokensUsed: dto.tokensUsed,
          errorType: dto.errorType,
          errorMessage: dto.errorMessage,
          humanEscalated: dto.humanEscalated ?? false,
          escalationReason: dto.escalationReason,
          outputReference: dto.outputReference,
          completedAt:
            dto.status === 'completed' || dto.status === 'failed' ? new Date() : undefined,
          metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
    }

    // No routed execution found — create a new one
    return this.prisma.taskExecution.create({
      data: {
        taskType: dto.taskType,
        correlationId: dto.correlationId,
        workClass: 'H1',
        executionChoice: 'HUMAN JUDGEMENT',
        domain: 'unknown',
        assignedAgent: dto.assignedAgent,
        assignedModel: dto.assignedModel,
        status: dto.status,
        durationMs: dto.durationMs,
        success: dto.success,
        costUsd: dto.costUsd,
        tokensUsed: dto.tokensUsed,
        errorType: dto.errorType,
        errorMessage: dto.errorMessage,
        humanEscalated: dto.humanEscalated ?? false,
        escalationReason: dto.escalationReason,
        outputReference: dto.outputReference,
        completedAt: dto.status === 'completed' || dto.status === 'failed' ? new Date() : undefined,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async getExecutionHistory(taskType: string, limit = 20) {
    return this.prisma.taskExecution.findMany({
      where: { taskType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getExecutionStats(taskType?: string) {
    const where: Record<string, unknown> = {};
    if (taskType) where.taskType = taskType;

    const executions = await this.prisma.taskExecution.findMany({ where });

    const byStatus: Record<string, number> = {};
    const byWorkClass: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    let totalCost = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let successCount = 0;
    let escalationCount = 0;

    for (const e of executions) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
      byWorkClass[e.workClass] = (byWorkClass[e.workClass] ?? 0) + 1;
      byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;
      if (e.costUsd) totalCost += Number(e.costUsd);
      if (e.durationMs) {
        totalDuration += e.durationMs;
        durationCount++;
      }
      if (e.success) successCount++;
      if (e.humanEscalated) escalationCount++;
    }

    return {
      total: executions.length,
      byStatus,
      byWorkClass,
      byDomain,
      totalCostUsd: totalCost,
      avgCostUsd: executions.length > 0 ? totalCost / executions.length : 0,
      avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      successRate: executions.length > 0 ? Math.round((successCount / executions.length) * 100) : 0,
      escalationRate:
        executions.length > 0 ? Math.round((escalationCount / executions.length) * 100) : 0,
    };
  }

  // ── Process Mining ────────────────────────────────────────

  async getProcessMiningOverview() {
    const classifications = await this.prisma.taskClassification.findMany();
    const byStep: Record<string, { count: number; tasks: string[] }> = {};

    for (const step of Object.keys(PROCESS_MINING_STEPS)) {
      byStep[step] = { count: 0, tasks: [] };
    }

    for (const c of classifications) {
      const step = c.processStep ?? 'P0';
      if (!byStep[step]) byStep[step] = { count: 0, tasks: [] };
      byStep[step].count++;
      byStep[step].tasks.push(c.taskType);
    }

    return {
      totalClassifications: classifications.length,
      eliminationCandidates: classifications.filter((c) => c.eliminationCandidate).length,
      automationCandidates: classifications.filter((c) => c.automationCandidate).length,
      byStep: Object.entries(PROCESS_MINING_STEPS).map(([step, info]) => ({
        step,
        ...info,
        taskCount: byStep[step]?.count ?? 0,
        tasks: byStep[step]?.tasks ?? [],
      })),
    };
  }

  // ── Stats ─────────────────────────────────────────────────

  async getStats() {
    const all = await this.prisma.taskClassification.findMany();
    const byClass: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    const byReversibility: Record<string, number> = {};
    let totalVolume = 0;
    let totalEstimatedCost = 0;

    for (const t of all) {
      byClass[t.workClass] = (byClass[t.workClass] ?? 0) + 1;
      byDomain[t.domain] = (byDomain[t.domain] ?? 0) + 1;
      byComplexity[t.complexityTier] = (byComplexity[t.complexityTier] ?? 0) + 1;
      byReversibility[t.reversible] = (byReversibility[t.reversible] ?? 0) + 1;
      totalVolume += t.volumePerWeek ?? 0;
      totalEstimatedCost += t.estimatedCostUsd
        ? Number(t.estimatedCostUsd) * (t.volumePerWeek ?? 0)
        : 0;
    }

    return {
      total: all.length,
      byClass,
      byDomain,
      byComplexity,
      byReversibility,
      totalWeeklyVolume: totalVolume,
      totalWeeklyEstimatedCostUsd: totalEstimatedCost,
      automationCandidates: all.filter((c) => c.automationCandidate).length,
      eliminationCandidates: all.filter((c) => c.eliminationCandidate).length,
    };
  }

  // ── Seed ──────────────────────────────────────────────────

  async seedClassifications(dto: SeedClassificationsDto = {}) {
    const toSeed = dto.domain
      ? SEED_CLASSIFICATIONS.filter((c) => c.domain === dto.domain)
      : SEED_CLASSIFICATIONS;

    const results: { created: string[]; skipped: string[]; errors: string[] } = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const classDto of toSeed) {
      try {
        const existing = await this.prisma.taskClassification.findUnique({
          where: { taskType: classDto.taskType },
        });
        if (existing && !dto.force) {
          results.skipped.push(classDto.taskType);
          continue;
        }
        if (existing) {
          await this.update(classDto.taskType, classDto);
          results.created.push(classDto.taskType);
        } else {
          await this.createClassification(classDto);
          results.created.push(classDto.taskType);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to seed ${classDto.taskType}: ${message}`);
        results.errors.push(classDto.taskType);
      }
    }

    this.logger.log(
      `Seed complete: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`
    );
    return results;
  }
}
