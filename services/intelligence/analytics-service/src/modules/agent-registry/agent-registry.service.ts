import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  KillSwitchDto,
  RecordEvaluationDto,
  SeedAgentsDto,
  AgentCategory,
  AgentStatus,
  HEALTH_STATUSES,
} from './dto/agent-registry.dto';
import { Prisma } from '../../prisma/client';

// ─── AOS-MA-001 Agent Definitions ───────────────────────────

const AOS_AGENTS: CreateAgentDto[] = [
  // ── Control Plane (CP-01 through CP-06) ──
  {
    agentId: 'CP-01',
    name: 'Executive Orchestrator',
    version: '1.0.0',
    purpose:
      'Decompose enterprise work, coordinate specialists, assemble executive output, track dependencies.',
    humanOwner: 'COO / Executive Leadership',
    category: 'control-plane',
    executionTier: 'T3',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['work-queue', 'task-router', 'knowledge-agent', 'pmo-tools'],
    deniedActions: ['approve-material-decisions', 'modify-source-truth', 'financial-transactions'],
    approvalActions: ['delegate-to-specialists', 'escalate-to-human'],
    dataClasses: ['internal', 'confidential'],
    workflowIds: ['enterprise-orchestration', 'executive-reporting', 'dependency-tracking'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-CCPOS-001'],
    killSwitchPath: 'Suspend orchestration → route all work to human queue',
    evaluationSuite: ['orchestration-golden', 'dependency-resolution', 'executive-output-quality'],
  },
  {
    agentId: 'CP-02',
    name: 'Authority & Policy Guardian',
    version: '1.0.0',
    purpose:
      'Resolve controlling authority, revision, permissions, prohibited actions and supersession.',
    humanOwner: 'Legal / Compliance',
    category: 'control-plane',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['authority-index', 'policy-engine', 'revision-tracker'],
    deniedActions: ['create-new-authority', 'waive-controls', 'modify-authority-documents'],
    approvalActions: ['resolve-conflict', 'apply-supersession'],
    dataClasses: ['confidential', 'restricted'],
    workflowIds: ['authority-resolution', 'policy-enforcement'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-CCPOS-001', 'AZP-PDDMA-001'],
    evaluationSuite: ['authority-golden', 'policy-compliance', 'conflict-resolution'],
  },
  {
    agentId: 'CP-03',
    name: 'Intake & Work Router',
    version: '1.0.0',
    purpose: 'Classify request, priority, workflow, complexity tier and required agents/humans.',
    humanOwner: 'COO / PMO',
    category: 'control-plane',
    executionTier: 'T1',
    riskLevel: 'R1',
    autonomyLevel: 'A3',
    killSwitchLevel: 'K1',
    allowedTools: ['work-queue', 'classification-engine', 'routing-table'],
    deniedActions: ['domain-approval', 'material-decisions'],
    approvalActions: ['reclassify-task', 'override-priority'],
    dataClasses: ['internal'],
    workflowIds: ['work-routing', 'task-classification'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001'],
    evaluationSuite: ['routing-golden', 'classification-accuracy'],
  },
  {
    agentId: 'CP-04',
    name: 'Enterprise Knowledge Agent',
    version: '1.0.0',
    purpose: 'Retrieve approved institutional knowledge and cite sources.',
    humanOwner: 'Knowledge / Product',
    category: 'control-plane',
    executionTier: 'T2',
    riskLevel: 'R1',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K0',
    allowedTools: ['knowledge-graph', 'search', 'document-retrieval'],
    deniedActions: ['invent-memory', 'become-system-of-record', 'modify-knowledge'],
    approvalActions: [],
    dataClasses: ['internal', 'confidential'],
    workflowIds: ['knowledge-retrieval', 'institutional-memory'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['knowledge-golden', 'source-citation', 'accuracy'],
  },
  {
    agentId: 'CP-05',
    name: 'Risk / Approval Agent',
    version: '1.0.0',
    purpose:
      'Score risk, reversibility, data sensitivity, financial exposure and required approval.',
    humanOwner: 'Risk / Compliance',
    category: 'control-plane',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['risk-engine', 'approval-gate', 'threshold-checker'],
    deniedActions: ['final-approval', 'override-risk-score'],
    approvalActions: ['escalate-to-human', 'flag-high-risk'],
    dataClasses: ['confidential', 'restricted'],
    workflowIds: ['risk-scoring', 'approval-routing'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001'],
    evaluationSuite: ['risk-golden', 'approval-accuracy', 'threshold-calibration'],
  },
  {
    agentId: 'CP-06',
    name: 'Audit / Evidence Agent',
    version: '1.0.0',
    purpose:
      'Independently verify authority, source traceability, calculations, completion and exception status.',
    humanOwner: 'Audit / Internal Controls',
    category: 'control-plane',
    executionTier: 'T2',
    riskLevel: 'R2',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['audit-log', 'evidence-store', 'calculation-verifier'],
    deniedActions: ['review-own-output', 'modify-audit-trail', 'self-approve'],
    approvalActions: ['flag-non-conformance', 'escalate-audit-finding'],
    dataClasses: ['confidential', 'restricted'],
    workflowIds: ['audit-verification', 'evidence-tracking'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-CCPOS-001'],
    evaluationSuite: ['audit-golden', 'evidence-traceability', 'independence-check'],
  },

  // ── Shared Enterprise (EA-01 through EA-12) ──
  {
    agentId: 'EA-01',
    name: 'Finance & Close',
    version: '1.0.0',
    purpose: 'Close preparation, reconciliations, budget variance, management-report schedules.',
    humanOwner: 'CFO / Financial Controller',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['ledger', 'reconciliation-engine', 'report-builder'],
    deniedActions: ['journal-approval', 'close-signoff', 'material-reclassification'],
    approvalActions: ['reconcile-variance', 'prepare-close-pack'],
    dataClasses: ['confidential', 'restricted'],
    costBudgetDaily: 50,
    costBudgetMonthly: 1500,
    workflowIds: ['month-end-close', 'reconciliation', 'budget-variance'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['finance-golden', 'reconciliation-accuracy', 'close-timeliness'],
  },
  {
    agentId: 'EA-02',
    name: 'Treasury & Liquidity',
    version: '1.0.0',
    purpose: 'Cash position, 13-week forecast, payment calendar, covenant/headroom monitoring.',
    humanOwner: 'CFO / Treasury',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['cash-position', 'forecast-engine', 'payment-calendar'],
    deniedActions: ['payment-release', 'covenant-waiver', 'material-transfer'],
    approvalActions: ['forecast-adjustment', 'alert-escalation'],
    dataClasses: ['confidential', 'restricted'],
    costBudgetDaily: 40,
    costBudgetMonthly: 1200,
    workflowIds: ['cash-forecast', 'payment-scheduling', 'covenant-monitoring'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['treasury-golden', 'forecast-accuracy', 'liquidity-monitoring'],
  },
  {
    agentId: 'EA-03',
    name: 'Revenue Assurance & Collections',
    version: '1.0.0',
    purpose: 'Invoice status, AR ageing, collections prioritisation, disputes and credit alerts.',
    humanOwner: 'CFO / Commercial',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['invoice-tracker', 'ar-ageing', 'collections-prioritiser'],
    deniedActions: ['write-off-approval', 'credit-limit-change', 'settlement-approval'],
    approvalActions: ['collections-priority', 'dispute-escalation'],
    dataClasses: ['confidential'],
    costBudgetDaily: 30,
    costBudgetMonthly: 900,
    workflowIds: ['collections', 'dispute-resolution', 'ar-ageing'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['collections-golden', 'ar-accuracy', 'dispute-resolution'],
  },
  {
    agentId: 'EA-04',
    name: 'Commercial & Proposal',
    version: '1.0.0',
    purpose:
      'Opportunity research, proposal assembly, CRM, sponsor/partner inventory and follow-up.',
    humanOwner: 'Commercial Lead',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['crm', 'proposal-builder', 'research-engine'],
    deniedActions: ['contract-signing', 'material-price-concessions', 'partnership-commitment'],
    approvalActions: ['proposal-approval', 'pricing-exception'],
    dataClasses: ['internal', 'confidential'],
    costBudgetDaily: 30,
    costBudgetMonthly: 900,
    workflowIds: ['proposal-assembly', 'opportunity-research', 'sponsor-tracking'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['commercial-golden', 'proposal-quality', 'pipeline-accuracy'],
  },
  {
    agentId: 'EA-05',
    name: 'Contract & Rights',
    version: '1.0.0',
    purpose:
      'Contract intake, obligation extraction, renewals, chain-of-title, rights/windows/territories alerts.',
    humanOwner: 'Legal / Rights',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['contract-engine', 'rights-graph', 'obligation-tracker'],
    deniedActions: ['contract-signing', 'rights-transfer', 'licence-grant', 'settlement-approval'],
    approvalActions: ['obligation-extraction', 'renewal-alert', 'rights-conflict-flag'],
    dataClasses: ['confidential', 'restricted'],
    costBudgetDaily: 40,
    costBudgetMonthly: 1200,
    workflowIds: ['contract-management', 'rights-tracking', 'obligation-extraction'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['rights-golden', 'obligation-accuracy', 'renewal-detection'],
  },
  {
    agentId: 'EA-06',
    name: 'Procurement & Vendor',
    version: '1.0.0',
    purpose:
      'Quote comparison, renewals, duplicate tools, unused subscriptions and vendor performance.',
    humanOwner: 'Finance / Procurement',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R1',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['vendor-tracker', 'quote-comparator', 'subscription-monitor'],
    deniedActions: ['contract-signing', 'vendor-termination', 'budget-approval'],
    approvalActions: ['renewal-recommendation', 'cost-saving-flag'],
    dataClasses: ['internal', 'confidential'],
    costBudgetDaily: 20,
    costBudgetMonthly: 600,
    workflowIds: ['vendor-rationalisation', 'quote-comparison', 'subscription-monitoring'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001'],
    evaluationSuite: ['procurement-golden', 'cost-saving-accuracy'],
  },
  {
    agentId: 'EA-07',
    name: 'People & Workforce',
    version: '1.0.0',
    purpose:
      'Role business cases, onboarding, performance-cycle prep, skills/capacity mapping and headcount challenge.',
    humanOwner: 'People / CEO',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R2',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K2',
    allowedTools: ['hr-system', 'capacity-mapper', 'business-case-builder'],
    deniedActions: ['hiring-decision', 'firing-decision', 'compensation-approval'],
    approvalActions: ['business-case-preparation', 'capacity-analysis', 'headcount-challenge'],
    dataClasses: ['confidential', 'restricted'],
    costBudgetDaily: 25,
    costBudgetMonthly: 750,
    workflowIds: ['hiring-pipeline', 'performance-cycle', 'capacity-mapping'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['people-golden', 'business-case-quality', 'capacity-accuracy'],
  },
  {
    agentId: 'EA-08',
    name: 'PMO & Operating Review',
    version: '1.0.0',
    purpose: 'Action/decision logs, scorecards, dependencies, weekly operating reviews.',
    humanOwner: 'COO / PMO',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R1',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['action-log', 'scorecard-engine', 'dependency-tracker'],
    deniedActions: ['decision-making', 'priority-override'],
    approvalActions: ['scorecard-escalation', 'dependency-flag'],
    dataClasses: ['internal'],
    costBudgetDaily: 20,
    costBudgetMonthly: 600,
    workflowIds: ['operating-review', 'action-tracking', 'scorecard-generation'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001'],
    evaluationSuite: ['pmo-golden', 'scorecard-accuracy', 'dependency-tracking'],
  },
  {
    agentId: 'EA-09',
    name: 'Data, BI & Experimentation',
    version: '1.0.0',
    purpose:
      'Controlled analytics, cohort/funnel analysis, experiment readouts and data-quality checks.',
    humanOwner: 'Data / Product',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R1',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['analytics-engine', 'experiment-tracker', 'data-quality-checker'],
    deniedActions: ['data-modification', 'experiment-design-override'],
    approvalActions: ['experiment-readout', 'data-quality-flag'],
    dataClasses: ['internal', 'confidential'],
    costBudgetDaily: 30,
    costBudgetMonthly: 900,
    workflowIds: ['analytics-reporting', 'experiment-analysis', 'data-quality'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['data-golden', 'experiment-accuracy', 'data-quality'],
  },
  {
    agentId: 'EA-10',
    name: 'Customer Operations & CRM',
    version: '1.0.0',
    purpose: 'Tier-1 support, lifecycle messaging, retention/reactivation, escalation.',
    humanOwner: 'Customer / Growth',
    category: 'shared-enterprise',
    executionTier: 'T1',
    riskLevel: 'R1',
    autonomyLevel: 'A3',
    killSwitchLevel: 'K1',
    allowedTools: ['crm', 'support-tickets', 'messaging-engine', 'retention-tracker'],
    deniedActions: ['refund-approval', 'account-deletion', 'legal-escalation'],
    approvalActions: ['support-escalation', 'retention-offer'],
    dataClasses: ['internal', 'confidential'],
    costBudgetDaily: 25,
    costBudgetMonthly: 750,
    workflowIds: ['support-tickets', 'retention-campaigns', 'lifecycle-messaging'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-BRD-PRD-001'],
    evaluationSuite: ['customer-golden', 'support-quality', 'retention-accuracy'],
  },
  {
    agentId: 'EA-11',
    name: 'Product & Delivery',
    version: '1.0.0',
    purpose:
      'Backlog/PRD support and orchestration into the existing Claude Code engineering system.',
    humanOwner: 'Product / Technology',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    killSwitchLevel: 'K1',
    allowedTools: ['backlog', 'prd-tracker', 'claude-code-orchestrator'],
    deniedActions: ['architecture-change', 'production-deployment', 'database-migration'],
    approvalActions: ['backlog-prioritisation', 'release-readiness'],
    dataClasses: ['internal'],
    costBudgetDaily: 40,
    costBudgetMonthly: 1200,
    workflowIds: ['product-delivery', 'engineering-orchestration'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-CCPOS-001', 'AZP-TAA-001'],
    evaluationSuite: ['product-golden', 'delivery-quality', 'engineering-compliance'],
  },
  {
    agentId: 'EA-12',
    name: 'Security, Privacy & SRE',
    version: '1.0.0',
    purpose:
      'Alert triage, access review, privacy checks, incident classification, uptime/DR evidence.',
    humanOwner: 'Technology / Security',
    category: 'shared-enterprise',
    executionTier: 'T2',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    killSwitchLevel: 'K3',
    allowedTools: ['security-scanner', 'access-reviewer', 'incident-classifier', 'sre-monitor'],
    deniedActions: ['incident-resolution', 'access-provisioning', 'production-deployment'],
    approvalActions: ['alert-triage', 'privacy-check', 'incident-classification'],
    dataClasses: ['confidential', 'restricted'],
    costBudgetDaily: 35,
    costBudgetMonthly: 1050,
    workflowIds: ['security-monitoring', 'access-review', 'incident-response', 'dr-testing'],
    authorityRefs: ['VMNL-AZP-AOS-MA-001', 'AZP-TAA-001'],
    evaluationSuite: ['security-golden', 'incident-detection', 'access-compliance', 'sre-slo'],
  },
];

// ─── Service ─────────────────────────────────────────────────

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────

  async create(dto: CreateAgentDto) {
    const existing = await this.prisma.agentRegistry.findUnique({
      where: { agentId: dto.agentId },
    });
    if (existing) {
      throw new ConflictException(`Agent ${dto.agentId} already registered. Use PUT to update.`);
    }

    this.logger.log(`Registering agent: ${dto.agentId} - ${dto.name} (${dto.category})`);

    return this.prisma.agentRegistry.create({
      data: {
        agentId: dto.agentId,
        name: dto.name,
        version: dto.version ?? '1.0.0',
        purpose: dto.purpose,
        description: dto.description,
        humanOwner: dto.humanOwner,
        category: dto.category,
        executionTier: dto.executionTier ?? 'T2',
        riskLevel: dto.riskLevel ?? 'R1',
        autonomyLevel: dto.autonomyLevel ?? 'A1',
        killSwitchLevel: dto.killSwitchLevel ?? 'K0',
        allowedTools: dto.allowedTools ?? [],
        deniedActions: dto.deniedActions ?? [],
        approvalActions: dto.approvalActions ?? [],
        dataClasses: dto.dataClasses ?? [],
        costBudgetDaily: dto.costBudgetDaily,
        costBudgetMonthly: dto.costBudgetMonthly,
        modelTierDefault: dto.modelTierDefault,
        modelTierFallback: dto.modelTierFallback,
        qualityThreshold: (dto.qualityThreshold as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        valueKpis: (dto.valueKpis as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        slaTarget: (dto.slaTarget as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        workflowIds: dto.workflowIds ?? [],
        authorityRefs: dto.authorityRefs ?? [],
        killSwitchPath: dto.killSwitchPath,
        fallbackProcess: dto.fallbackProcess,
        evaluationSuite: dto.evaluationSuite ?? [],
      },
    });
  }

  async findAll(filters: { category?: AgentCategory; status?: AgentStatus; search?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { agentId: { contains: filters.search, mode: 'insensitive' } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.agentRegistry.findMany({ where, orderBy: { agentId: 'asc' } });
  }

  async findOne(agentId: string) {
    const agent = await this.prisma.agentRegistry.findUnique({
      where: { agentId },
      include: { evaluations: { orderBy: { evaluatedAt: 'desc' }, take: 10 } },
    });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    return agent;
  }

  async update(agentId: string, dto: UpdateAgentDto) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);

    this.logger.log(`Updating agent: ${agentId}`);
    const data: Record<string, unknown> = { ...dto };
    if (dto.qualityThreshold !== undefined)
      data.qualityThreshold = dto.qualityThreshold as Prisma.InputJsonValue;
    if (dto.valueKpis !== undefined) data.valueKpis = dto.valueKpis as Prisma.InputJsonValue;
    if (dto.slaTarget !== undefined) data.slaTarget = dto.slaTarget as Prisma.InputJsonValue;
    if (dto.metadata !== undefined) data.metadata = dto.metadata as Prisma.InputJsonValue;
    return this.prisma.agentRegistry.update({
      where: { agentId },
      data: data as Prisma.AgentRegistryUpdateInput,
    });
  }

  async delete(agentId: string) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    if (agent.status === 'active') {
      throw new ConflictException('Cannot delete an active agent. Suspend or retire first.');
    }
    return this.prisma.agentRegistry.delete({ where: { agentId } });
  }

  // ── Kill Switch ───────────────────────────────────────────

  async activateKillSwitch(agentId: string, dto: KillSwitchDto) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);

    this.logger.warn(
      `🔴 KILL SWITCH ACTIVATED for ${agentId} by ${dto.triggeredBy}: ${dto.reason}`
    );

    await this.prisma.$transaction([
      this.prisma.agentRegistry.update({
        where: { agentId },
        data: { status: 'suspended', healthStatus: 'unhealthy' },
      }),
      this.prisma.agentKillSwitch.create({
        data: {
          agentId,
          action: 'suspend',
          reason: dto.reason,
          triggeredBy: dto.triggeredBy,
          previousStatus: agent.status,
          newStatus: 'suspended',
          rollbackData: (dto.rollbackData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          evidence: dto.evidence,
        },
      }),
    ]);

    return {
      success: true,
      agentId,
      previousStatus: agent.status,
      newStatus: 'suspended',
      message: agent.fallbackProcess
        ? `Agent suspended. Fallback: ${agent.fallbackProcess}`
        : `Agent suspended. No fallback process defined.`,
    };
  }

  async resumeAgent(agentId: string, dto: KillSwitchDto) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    if (agent.status !== 'suspended') {
      throw new ConflictException(`Agent ${agentId} is not suspended (current: ${agent.status})`);
    }

    this.logger.log(`Agent ${agentId} resumed by ${dto.triggeredBy}: ${dto.reason}`);

    await this.prisma.$transaction([
      this.prisma.agentRegistry.update({
        where: { agentId },
        data: { status: 'active', healthStatus: 'healthy' },
      }),
      this.prisma.agentKillSwitch.create({
        data: {
          agentId,
          action: 'resume',
          reason: dto.reason,
          triggeredBy: dto.triggeredBy,
          previousStatus: 'suspended',
          newStatus: 'active',
          evidence: dto.evidence,
        },
      }),
    ]);

    return { success: true, agentId, newStatus: 'active' };
  }

  async retire(agentId: string, reason: string, triggeredBy: string) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);

    this.logger.log(`Agent ${agentId} retired by ${triggeredBy}: ${reason}`);

    await this.prisma.$transaction([
      this.prisma.agentRegistry.update({
        where: { agentId },
        data: { status: 'retired', healthStatus: 'unknown' },
      }),
      this.prisma.agentKillSwitch.create({
        data: {
          agentId,
          action: 'retire',
          reason,
          triggeredBy,
          previousStatus: agent.status,
          newStatus: 'retired',
        },
      }),
    ]);

    return { success: true, agentId, newStatus: 'retired' };
  }

  async getKillSwitchHistory(agentId: string, limit = 20) {
    return this.prisma.agentKillSwitch.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Health Monitoring ─────────────────────────────────────

  async recordExecution(agentId: string, success: boolean) {
    const update: Record<string, unknown> = {
      lastExecutedAt: new Date(),
      totalExecutions: { increment: 1 },
    };
    if (!success) update.totalErrors = { increment: 1 };

    return this.prisma.agentRegistry.update({
      where: { agentId },
      data: update,
    });
  }

  async checkHealth(agentId: string) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);

    const errorRate =
      agent.totalExecutions > 0 ? (agent.totalErrors / agent.totalExecutions) * 100 : 0;

    let healthStatus: (typeof HEALTH_STATUSES)[number] = 'healthy';
    if (agent.status === 'suspended') healthStatus = 'unhealthy';
    else if (errorRate > 20) healthStatus = 'unhealthy';
    else if (errorRate > 5) healthStatus = 'degraded';

    await this.prisma.agentRegistry.update({
      where: { agentId },
      data: { healthStatus, lastHealthCheck: new Date() },
    });

    return {
      agentId,
      healthStatus,
      status: agent.status,
      errorRate: Math.round(errorRate * 100) / 100,
      totalExecutions: agent.totalExecutions,
      totalErrors: agent.totalErrors,
      lastExecutedAt: agent.lastExecutedAt,
      lastHealthCheck: new Date(),
    };
  }

  async getHealthOverview() {
    const agents = await this.prisma.agentRegistry.findMany({
      select: {
        agentId: true,
        name: true,
        status: true,
        healthStatus: true,
        totalExecutions: true,
        totalErrors: true,
        lastHealthCheck: true,
        costBudgetDaily: true,
        costBudgetMonthly: true,
      },
      orderBy: { agentId: 'asc' },
    });

    const summary = {
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
      suspended: agents.filter((a) => a.status === 'suspended').length,
      retired: agents.filter((a) => a.status === 'retired').length,
      healthy: agents.filter((a) => a.healthStatus === 'healthy').length,
      degraded: agents.filter((a) => a.healthStatus === 'degraded').length,
      unhealthy: agents.filter((a) => a.healthStatus === 'unhealthy').length,
    };

    return { summary, agents };
  }

  // ── Evaluation Suite ──────────────────────────────────────

  async recordEvaluation(agentId: string, dto: RecordEvaluationDto) {
    const agent = await this.prisma.agentRegistry.findUnique({ where: { agentId } });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);

    const passedThreshold = dto.totalTests > 0 ? dto.passed / dto.totalTests >= 0.95 : false;

    this.logger.log(
      `Evaluation [${dto.evaluationType}] for ${agentId}: ${dto.passed}/${dto.totalTests} passed` +
        ` (score: ${dto.score ?? 'N/A'}) — ${passedThreshold ? '✅ PASSED' : '❌ FAILED'}`
    );

    const evaluation = await this.prisma.agentEvaluation.create({
      data: {
        agentId,
        evaluationType: dto.evaluationType,
        testSuite: dto.testSuite,
        totalTests: dto.totalTests,
        passed: dto.passed,
        failed: dto.failed,
        skipped: dto.skipped ?? 0,
        durationMs: dto.durationMs,
        score: dto.score,
        passedThreshold,
        failureDetails: (dto.failureDetails as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        environment: dto.environment,
        triggeredBy: dto.triggeredBy,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    // Auto-degrade if evaluation fails
    if (!passedThreshold && agent.status === 'active') {
      this.logger.warn(`Agent ${agentId} failed evaluation — degrading health`);
      await this.prisma.agentRegistry.update({
        where: { agentId },
        data: { healthStatus: 'degraded' },
      });
    }

    return evaluation;
  }

  async getEvaluations(agentId: string, type?: string, limit = 20) {
    const where: Record<string, unknown> = { agentId };
    if (type) where.evaluationType = type;
    return this.prisma.agentEvaluation.findMany({
      where,
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
    });
  }

  async getEvaluationSummary(agentId: string) {
    const evaluations = await this.prisma.agentEvaluation.findMany({
      where: { agentId },
      orderBy: { evaluatedAt: 'desc' },
      take: 50,
    });

    const byType: Record<
      string,
      { total: number; passed: number; failed: number; avgScore: number }
    > = {};
    for (const e of evaluations) {
      if (!byType[e.evaluationType])
        byType[e.evaluationType] = { total: 0, passed: 0, failed: 0, avgScore: 0 };
      byType[e.evaluationType].total++;
      if (e.passedThreshold) byType[e.evaluationType].passed++;
      else byType[e.evaluationType].failed++;
      byType[e.evaluationType].avgScore += Number(e.score ?? 0);
    }
    for (const key of Object.keys(byType)) {
      byType[key].avgScore = Math.round((byType[key].avgScore / byType[key].total) * 100) / 100;
    }

    const latestPassed = evaluations.find((e) => e.passedThreshold);
    const latestFailed = evaluations.find((e) => !e.passedThreshold);

    return {
      agentId,
      totalEvaluations: evaluations.length,
      byType,
      latestPassed: latestPassed
        ? {
            type: latestPassed.evaluationType,
            date: latestPassed.evaluatedAt,
            score: latestPassed.score,
          }
        : null,
      latestFailed: latestFailed
        ? {
            type: latestFailed.evaluationType,
            date: latestFailed.evaluatedAt,
            score: latestFailed.score,
          }
        : null,
    };
  }

  // ── Seed ──────────────────────────────────────────────────

  async seedAgents(dto: SeedAgentsDto = {}) {
    const agentsToSeed = dto.category
      ? AOS_AGENTS.filter((a) => a.category === dto.category)
      : AOS_AGENTS;

    const results: { created: string[]; skipped: string[]; errors: string[] } = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const agentDto of agentsToSeed) {
      try {
        const existing = await this.prisma.agentRegistry.findUnique({
          where: { agentId: agentDto.agentId },
        });
        if (existing && !dto.force) {
          results.skipped.push(agentDto.agentId);
          continue;
        }
        if (existing && dto.force) {
          const seedData: Record<string, unknown> = { ...agentDto };
          if (agentDto.qualityThreshold)
            seedData.qualityThreshold = agentDto.qualityThreshold as Prisma.InputJsonValue;
          if (agentDto.valueKpis) seedData.valueKpis = agentDto.valueKpis as Prisma.InputJsonValue;
          if (agentDto.slaTarget) seedData.slaTarget = agentDto.slaTarget as Prisma.InputJsonValue;
          if (agentDto.metadata) seedData.metadata = agentDto.metadata as Prisma.InputJsonValue;
          await this.prisma.agentRegistry.update({
            where: { agentId: agentDto.agentId },
            data: seedData as Prisma.AgentRegistryUpdateInput,
          });
          results.created.push(agentDto.agentId);
        } else {
          await this.create(agentDto);
          results.created.push(agentDto.agentId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to seed ${agentDto.agentId}: ${message}`);
        results.errors.push(agentDto.agentId);
      }
    }

    this.logger.log(
      `Seed complete: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`
    );
    return results;
  }

  // ── Stats ─────────────────────────────────────────────────

  async getStats() {
    const agents = await this.prisma.agentRegistry.findMany();

    return {
      total: agents.length,
      byCategory: {
        'control-plane': agents.filter((a) => a.category === 'control-plane').length,
        'shared-enterprise': agents.filter((a) => a.category === 'shared-enterprise').length,
        'domain-skill-pack': agents.filter((a) => a.category === 'domain-skill-pack').length,
      },
      byStatus: {
        active: agents.filter((a) => a.status === 'active').length,
        suspended: agents.filter((a) => a.status === 'suspended').length,
        retired: agents.filter((a) => a.status === 'retired').length,
      },
      byRiskLevel: {
        R0: agents.filter((a) => a.riskLevel === 'R0').length,
        R1: agents.filter((a) => a.riskLevel === 'R1').length,
        R2: agents.filter((a) => a.riskLevel === 'R2').length,
        R3: agents.filter((a) => a.riskLevel === 'R3').length,
        R4: agents.filter((a) => a.riskLevel === 'R4').length,
      },
      byAutonomyLevel: {
        A0: agents.filter((a) => a.autonomyLevel === 'A0').length,
        A1: agents.filter((a) => a.autonomyLevel === 'A1').length,
        A2: agents.filter((a) => a.autonomyLevel === 'A2').length,
        A3: agents.filter((a) => a.autonomyLevel === 'A3').length,
        A4: agents.filter((a) => a.autonomyLevel === 'A4').length,
        A5: agents.filter((a) => a.autonomyLevel === 'A5').length,
      },
      totalExecutions: agents.reduce((sum, a) => sum + a.totalExecutions, 0),
      totalErrors: agents.reduce((sum, a) => sum + a.totalErrors, 0),
    };
  }
}
