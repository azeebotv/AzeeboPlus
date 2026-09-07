import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  AssessActionDto,
  RequestApprovalDto,
  DecideApprovalDto,
  RevokeApprovalDto,
  BatchAssessDto,
  SeedRiskClassificationsDto,
  Decision,
  RISK_LEVELS,
  RISK_DEFINITIONS,
  AUTONOMY_DEFINITIONS,
} from './dto/risk-engine.dto';

// ─── Risk Decision Matrix (AOS-MA-001 §20-21) ───────────────

const DECISION_MATRIX: Record<string, Record<string, Decision>> = {
  // riskLevel → autonomyLevel → decision
  R0: { A0: 'ASK', A1: 'ALLOW', A2: 'ALLOW', A3: 'ALLOW', A4: 'ALLOW', A5: 'ALLOW' },
  R1: { A0: 'ASK', A1: 'ALLOW', A2: 'ALLOW', A3: 'ALLOW', A4: 'ALLOW', A5: 'ALLOW' },
  R2: { A0: 'ASK', A1: 'ASK', A2: 'ALLOW', A3: 'ALLOW', A4: 'ALLOW', A5: 'ALLOW' },
  R3: { A0: 'DENY', A1: 'ASK', A2: 'ASK', A3: 'ASK', A4: 'ALLOW', A5: 'ALLOW' },
  R4: { A0: 'DENY', A1: 'DENY', A2: 'DENY', A3: 'ASK', A4: 'ASK', A5: 'ASK' },
};

// ─── Seed Data: Common Azeebo+ Risk Classifications ─────────

const SEED_CLASSIFICATIONS: CreateClassificationDto[] = [
  // ── Finance ──
  {
    actionType: 'payment_initiate',
    domain: 'finance',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Finance Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Initiate a payment transaction',
    policyRef: 'VMNL-AZP-AOS-MA-001',
    maxAutoApproveUsd: 100,
    keywords: ['payment', 'pay', 'transfer', 'disburse'],
  },
  {
    actionType: 'payment_release',
    domain: 'finance',
    riskLevel: 'R4',
    autonomyLevel: 'A0',
    reversibility: 'irreversible',
    approvalRequired: true,
    approverRole: 'CFO',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Release payment to external party',
    policyRef: 'VMNL-AZP-AOS-MA-001',
    maxAutoApproveUsd: 0,
    keywords: ['release', 'disburse', 'payout'],
  },
  {
    actionType: 'journal_post',
    domain: 'finance',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    reversibility: 'reversible',
    approvalRequired: false,
    approverRole: 'Financial Controller',
    makerChecker: true,
    dataSensitivity: 'confidential',
    financialExposure: 'medium',
    description: 'Post journal entry to ledger',
    keywords: ['journal', 'post', 'ledger', 'entry'],
  },
  {
    actionType: 'close_signoff',
    domain: 'finance',
    riskLevel: 'R3',
    autonomyLevel: 'A0',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'CFO',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Sign off on period close',
    keywords: ['close', 'signoff', 'period', 'month-end'],
  },
  {
    actionType: 'budget_adjustment',
    domain: 'finance',
    riskLevel: 'R2',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Finance Lead',
    makerChecker: false,
    dataSensitivity: 'confidential',
    financialExposure: 'medium',
    description: 'Adjust budget allocation',
    keywords: ['budget', 'adjust', 'reallocate'],
  },
  {
    actionType: 'refund_process',
    domain: 'finance',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Finance Lead',
    makerChecker: true,
    dataSensitivity: 'confidential',
    financialExposure: 'medium',
    description: 'Process customer refund',
    maxAutoApproveUsd: 50,
    keywords: ['refund', 'reimburse', 'credit-back'],
  },

  // ── Rights ──
  {
    actionType: 'rights_grant',
    domain: 'rights',
    riskLevel: 'R3',
    autonomyLevel: 'A0',
    reversibility: 'irreversible',
    approvalRequired: true,
    approverRole: 'Legal / Rights Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Grant content rights to third party',
    policyRef: 'AZP-BRD-PRD-001',
    keywords: ['rights', 'grant', 'licence', 'license'],
  },
  {
    actionType: 'rights_takedown',
    domain: 'rights',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Rights Lead',
    makerChecker: true,
    dataSensitivity: 'confidential',
    financialExposure: 'medium',
    description: 'Emergency rights takedown',
    keywords: ['takedown', 'remove', 'disable', 'emergency'],
  },
  {
    actionType: 'contract_redline',
    domain: 'rights',
    riskLevel: 'R2',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Legal',
    makerChecker: false,
    dataSensitivity: 'confidential',
    financialExposure: 'medium',
    description: 'Prepare contract redlines',
    keywords: ['contract', 'redline', 'amend', 'negotiate'],
  },
  {
    actionType: 'rights_expiry_renewal',
    domain: 'rights',
    riskLevel: 'R3',
    autonomyLevel: 'A0',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Rights Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Renew expiring rights',
    keywords: ['renewal', 'renew', 'extend', 'expiry'],
  },

  // ── Content ──
  {
    actionType: 'content_publish',
    domain: 'content',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    reversibility: 'reversible',
    approvalRequired: false,
    approverRole: 'Content Lead',
    makerChecker: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Publish content to production',
    keywords: ['publish', 'release', 'launch', 'go-live'],
  },
  {
    actionType: 'content_delete',
    domain: 'content',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'irreversible',
    approvalRequired: true,
    approverRole: 'Content Lead',
    makerChecker: true,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Delete published content',
    keywords: ['delete', 'remove', 'unpublish'],
  },
  {
    actionType: 'editorial_approval',
    domain: 'content',
    riskLevel: 'R2',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Editorial Lead',
    makerChecker: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Approve editorial content',
    keywords: ['editorial', 'approve', 'review', 'sign-off'],
  },

  // ── Customer ──
  {
    actionType: 'support_refund',
    domain: 'customer',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    reversibility: 'reversible',
    approvalRequired: false,
    approverRole: 'Support Lead',
    makerChecker: false,
    dataSensitivity: 'internal',
    financialExposure: 'low',
    description: 'Process support refund under threshold',
    maxAutoApproveUsd: 25,
    keywords: ['refund', 'support', 'compensation'],
  },
  {
    actionType: 'account_suspension',
    domain: 'customer',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Trust & Safety Lead',
    makerChecker: true,
    dataSensitivity: 'confidential',
    financialExposure: 'none',
    description: 'Suspend user account',
    keywords: ['suspend', 'ban', 'block', 'restrict'],
  },
  {
    actionType: 'account_deletion',
    domain: 'customer',
    riskLevel: 'R4',
    autonomyLevel: 'A0',
    reversibility: 'irreversible',
    approvalRequired: true,
    approverRole: 'Trust & Safety Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'none',
    description: 'Permanently delete user account',
    keywords: ['delete', 'erase', 'gdpr', 'deletion'],
  },

  // ── Product ──
  {
    actionType: 'release_deploy',
    domain: 'product',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Tech Lead',
    makerChecker: true,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Deploy release to production',
    keywords: ['deploy', 'release', 'ship', 'launch'],
  },
  {
    actionType: 'database_migration',
    domain: 'product',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Architecture Guardian',
    makerChecker: true,
    dataSensitivity: 'confidential',
    financialExposure: 'none',
    description: 'Execute database migration',
    keywords: ['migration', 'schema', 'alter', 'migrate'],
  },
  {
    actionType: 'feature_flag_toggle',
    domain: 'product',
    riskLevel: 'R1',
    autonomyLevel: 'A3',
    reversibility: 'reversible',
    approvalRequired: false,
    approverRole: 'Product Lead',
    makerChecker: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Toggle feature flag',
    keywords: ['feature', 'flag', 'toggle', 'enable', 'disable'],
  },

  // ── Security ──
  {
    actionType: 'access_provision',
    domain: 'security',
    riskLevel: 'R3',
    autonomyLevel: 'A1',
    reversibility: 'reversible',
    approvalRequired: true,
    approverRole: 'Security Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'none',
    description: 'Provision user access',
    keywords: ['access', 'provision', 'grant', 'permission'],
  },
  {
    actionType: 'incident_response',
    domain: 'security',
    riskLevel: 'R3',
    autonomyLevel: 'A2',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'Security Lead',
    makerChecker: false,
    dataSensitivity: 'restricted',
    financialExposure: 'none',
    description: 'Respond to security incident',
    keywords: ['incident', 'response', 'breach', 'contain'],
  },
  {
    actionType: 'secret_rotation',
    domain: 'security',
    riskLevel: 'R2',
    autonomyLevel: 'A2',
    reversibility: 'reversible',
    approvalRequired: false,
    approverRole: 'Security Lead',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'none',
    description: 'Rotate secrets/credentials',
    keywords: ['secret', 'rotate', 'credential', 'key'],
  },

  // ── People ──
  {
    actionType: 'hiring_offer',
    domain: 'people',
    riskLevel: 'R3',
    autonomyLevel: 'A0',
    reversibility: 'bounded-reversible',
    approvalRequired: true,
    approverRole: 'People Lead + CFO',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Extend hiring offer',
    keywords: ['hiring', 'offer', 'recruit', 'employ'],
  },
  {
    actionType: 'termination',
    domain: 'people',
    riskLevel: 'R4',
    autonomyLevel: 'A0',
    reversibility: 'irreversible',
    approvalRequired: true,
    approverRole: 'People Lead + CEO + Legal',
    makerChecker: true,
    dataSensitivity: 'restricted',
    financialExposure: 'high',
    description: 'Terminate employment',
    keywords: ['terminate', 'fire', 'dismiss', 'exit'],
  },

  // ── Low-risk / Elimination candidates ──
  {
    actionType: 'report_generate',
    domain: 'pmo',
    riskLevel: 'R0',
    autonomyLevel: 'A3',
    reversibility: 'reversible',
    approvalRequired: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Generate standard report',
    keywords: ['report', 'generate', 'export'],
  },
  {
    actionType: 'data_export',
    domain: 'analytics',
    riskLevel: 'R1',
    autonomyLevel: 'A2',
    reversibility: 'reversible',
    approvalRequired: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Export analytics data',
    keywords: ['export', 'download', 'extract'],
  },
  {
    actionType: 'notification_send',
    domain: 'customer',
    riskLevel: 'R1',
    autonomyLevel: 'A3',
    reversibility: 'reversible',
    approvalRequired: false,
    dataSensitivity: 'internal',
    financialExposure: 'none',
    description: 'Send notification to user',
    keywords: ['notification', 'send', 'email', 'push'],
  },
];

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Classification CRUD ───────────────────────────────────

  async createClassification(dto: CreateClassificationDto) {
    const existing = await this.prisma.riskClassification.findUnique({
      where: { actionType: dto.actionType },
    });
    if (existing) {
      throw new ConflictException(
        `Risk classification for "${dto.actionType}" already exists. Use PUT to update.`
      );
    }

    this.logger.log(
      `Creating risk classification: ${dto.actionType} → ${dto.riskLevel}/${dto.autonomyLevel}`
    );

    return this.prisma.riskClassification.create({
      data: {
        actionType: dto.actionType,
        domain: dto.domain,
        riskLevel: dto.riskLevel,
        autonomyLevel: dto.autonomyLevel,
        reversibility: dto.reversibility,
        approvalRequired: dto.approvalRequired ?? false,
        approverRole: dto.approverRole,
        makerChecker: dto.makerChecker ?? false,
        dataSensitivity: dto.dataSensitivity ?? 'internal',
        financialExposure: dto.financialExposure ?? 'none',
        description: dto.description,
        policyRef: dto.policyRef,
        maxAutoApproveUsd: dto.maxAutoApproveUsd,
        escalationThreshold: dto.escalationThreshold,
        requiredApproverCount: dto.requiredApproverCount ?? 1,
        cooldownMinutes: dto.cooldownMinutes,
        keywords: dto.keywords ?? [],
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async findAll(filters: { domain?: string; riskLevel?: string; search?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.domain) where.domain = filters.domain;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.search) {
      where.OR = [
        { actionType: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.riskClassification.findMany({ where, orderBy: { actionType: 'asc' } });
  }

  async findOne(actionType: string) {
    const classification = await this.prisma.riskClassification.findUnique({
      where: { actionType },
      include: {
        assessments: { orderBy: { assessedAt: 'desc' }, take: 10 },
        approvals: { where: { status: 'pending' }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!classification)
      throw new NotFoundException(`Risk classification "${actionType}" not found`);
    return classification;
  }

  async update(actionType: string, dto: UpdateClassificationDto) {
    const existing = await this.prisma.riskClassification.findUnique({ where: { actionType } });
    if (!existing) throw new NotFoundException(`Risk classification "${actionType}" not found`);

    this.logger.log(`Updating risk classification: ${actionType}`);
    const data: Record<string, unknown> = { ...dto };
    if (dto.keywords) data.keywords = dto.keywords;
    return this.prisma.riskClassification.update({
      where: { actionType },
      data: data as Prisma.RiskClassificationUpdateInput,
    });
  }

  async delete(actionType: string) {
    const existing = await this.prisma.riskClassification.findUnique({ where: { actionType } });
    if (!existing) throw new NotFoundException(`Risk classification "${actionType}" not found`);
    return this.prisma.riskClassification.delete({ where: { actionType } });
  }

  // ── Core Assessment ───────────────────────────────────────

  async assessAction(actionType: string, dto: AssessActionDto = {}) {
    const classification = await this.prisma.riskClassification.findUnique({
      where: { actionType },
    });

    if (!classification) {
      const assessment = this.buildDefaultAssessment(actionType, dto.domain ?? 'unknown');
      await this.logAssessment(assessment, dto);
      return assessment;
    }

    // Apply override if provided
    const riskLevel = dto.overrideRiskLevel ?? classification.riskLevel;
    const autonomyLevel = classification.autonomyLevel;

    // Get decision from matrix
    let decision: Decision = DECISION_MATRIX[riskLevel]?.[autonomyLevel] ?? 'ASK';

    // Override decision if provided
    if (dto.overrideDecision) {
      decision = dto.overrideDecision;
      this.logger.warn(
        `Decision overridden to ${decision} for ${actionType} by ${dto.requestedBy ?? 'system'}`
      );
    }

    // Apply additional rules
    const { finalDecision, reason } = this.applyAdditionalRules(classification, decision, dto);

    // Check financial threshold
    if (
      classification.maxAutoApproveUsd !== null &&
      classification.maxAutoApproveUsd !== undefined &&
      dto.estimatedCostUsd !== undefined
    ) {
      if (
        dto.estimatedCostUsd > Number(classification.maxAutoApproveUsd) &&
        finalDecision === 'ALLOW'
      ) {
        return this.buildAssessment(
          classification,
          'ASK',
          `Cost $${dto.estimatedCostUsd} exceeds auto-approval threshold $${classification.maxAutoApproveUsd}`,
          dto
        );
      }
    }

    const assessment = this.buildAssessment(classification, finalDecision, reason, dto);
    await this.logAssessment(assessment, dto);

    return assessment;
  }

  private applyAdditionalRules(
    classification: {
      actionType: string;
      domain: string;
      riskLevel: string;
      autonomyLevel: string;
      reversibility: string;
      approvalRequired: boolean;
      approverRole: string | null;
      makerChecker: boolean;
      dataSensitivity: string;
      financialExposure: string | null;
      escalationThreshold: string | null;
    },
    matrixDecision: Decision,
    _dto: AssessActionDto
  ): { finalDecision: Decision; reason: string } {
    // Rule 1: Always ASK if approvalRequired
    if (classification.approvalRequired && matrixDecision === 'ALLOW') {
      return {
        finalDecision: 'ASK',
        reason: `Approval required by ${classification.approverRole ?? 'Human Owner'} — policy mandate`,
      };
    }

    // Rule 2: Always ASK if makerChecker
    if (classification.makerChecker && matrixDecision === 'ALLOW') {
      return { finalDecision: 'ASK', reason: 'Maker-checker separation required' };
    }

    // Rule 3: Escalation threshold
    if (classification.escalationThreshold) {
      const thresholdIndex = RISK_LEVELS.indexOf(
        classification.escalationThreshold as (typeof RISK_LEVELS)[number]
      );
      const currentIndex = RISK_LEVELS.indexOf(
        classification.riskLevel as (typeof RISK_LEVELS)[number]
      );
      if (currentIndex >= thresholdIndex && matrixDecision === 'ALLOW') {
        return {
          finalDecision: 'ASK',
          reason: `Risk ${classification.riskLevel} meets escalation threshold ${classification.escalationThreshold}`,
        };
      }
    }

    // Rule 4: High financial exposure always ASK
    if (classification.financialExposure === 'high' && matrixDecision === 'ALLOW') {
      return { finalDecision: 'ASK', reason: 'High financial exposure — human review required' };
    }

    // Rule 5: Irreversible actions at R3+ always ASK
    if (classification.riskLevel === 'R3' || classification.riskLevel === 'R4') {
      if (matrixDecision === 'ALLOW') {
        return {
          finalDecision: 'ASK',
          reason: `${classification.riskLevel} risk — human review recommended`,
        };
      }
    }

    const riskDef = RISK_DEFINITIONS[classification.riskLevel];
    const autoDef = AUTONOMY_DEFINITIONS[classification.autonomyLevel];

    const decisionText =
      matrixDecision === 'ALLOW'
        ? 'autonomous execution permitted'
        : matrixDecision === 'ASK'
          ? 'human approval required'
          : 'blocked — human-only action';

    return {
      finalDecision: matrixDecision,
      reason: `${riskDef?.name ?? classification.riskLevel} risk (${classification.riskLevel}) × ${autoDef?.name ?? classification.autonomyLevel} autonomy (${classification.autonomyLevel}) — ${decisionText}`,
    };
  }

  private buildAssessment(
    classification: {
      actionType: string;
      domain: string;
      riskLevel: string;
      autonomyLevel: string;
      reversibility: string;
      approvalRequired: boolean;
      approverRole: string | null;
      makerChecker: boolean;
      dataSensitivity: string;
      financialExposure: string | null;
    },
    decision: Decision,
    reason: string,
    dto: AssessActionDto
  ) {
    return {
      actionType: classification.actionType,
      domain: classification.domain,
      riskLevel: classification.riskLevel,
      autonomyLevel: classification.autonomyLevel,
      reversibility: classification.reversibility,
      approvalRequired: classification.approvalRequired,
      approverRole: classification.approverRole,
      makerChecker: classification.makerChecker,
      dataSensitivity: classification.dataSensitivity,
      financialExposure: classification.financialExposure ?? 'none',
      decision,
      reason,
      correlationId: dto.correlationId,
      requestedBy: dto.requestedBy,
      estimatedCostUsd: dto.estimatedCostUsd,
    };
  }

  private buildDefaultAssessment(actionType: string, domain: string) {
    return {
      actionType,
      domain,
      riskLevel: 'R3',
      autonomyLevel: 'A0',
      reversibility: 'unknown',
      approvalRequired: true,
      approverRole: 'Human Owner',
      makerChecker: true,
      dataSensitivity: 'confidential',
      financialExposure: 'unknown',
      decision: 'ASK' as Decision,
      reason: 'No risk classification found — defaulting to high scrutiny (R3/A0)',
    };
  }

  private async logAssessment(assessment: Record<string, unknown>, dto: AssessActionDto) {
    try {
      await this.prisma.riskAssessmentLog.create({
        data: {
          actionType: assessment.actionType as string,
          domain: assessment.domain as string,
          assessedBy: dto.requestedBy ?? 'system',
          correlationId: dto.correlationId,
          inputContext: (dto.context as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          riskLevel: assessment.riskLevel as string,
          autonomyLevel: assessment.autonomyLevel as string,
          reversibility: assessment.reversibility as string,
          decision: assessment.decision as string,
          decisionReason: assessment.reason as string,
          approvalRequired: assessment.approvalRequired as boolean,
          approverRole: assessment.approverRole as string,
          makerChecker: assessment.makerChecker as boolean,
          dataSensitivity: assessment.dataSensitivity as string,
          financialExposure: assessment.financialExposure as string,
          estimatedCostUsd: dto.estimatedCostUsd,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log assessment: ${err}`);
    }
  }

  // ── Approval Workflow ─────────────────────────────────────

  async requestApproval(dto: RequestApprovalDto) {
    const classification = await this.prisma.riskClassification.findUnique({
      where: { actionType: dto.actionType },
    });
    if (!classification)
      throw new NotFoundException(`Risk classification "${dto.actionType}" not found`);

    // Check for existing pending approval
    const existing = await this.prisma.approvalRequest.findFirst({
      where: { actionType: dto.actionType, status: 'pending' },
    });
    if (existing) {
      throw new ConflictException(
        `Pending approval already exists for "${dto.actionType}" (ID: ${existing.id})`
      );
    }

    const expiresAt = dto.expiresInMinutes
      ? new Date(Date.now() + dto.expiresInMinutes * 60_000)
      : new Date(Date.now() + 24 * 60 * 60_000); // Default 24h

    this.logger.log(`Approval requested for ${dto.actionType} by ${dto.requestedBy}`);

    return this.prisma.approvalRequest.create({
      data: {
        actionType: dto.actionType,
        domain: classification.domain,
        riskLevel: classification.riskLevel,
        autonomyLevel: classification.autonomyLevel,
        correlationId: dto.correlationId,
        requestedBy: dto.requestedBy,
        requestContext: (dto.requestContext as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        expiresAt,
      },
    });
  }

  async decideApproval(approvalId: string, dto: DecideApprovalDto) {
    const approval = await this.prisma.approvalRequest.findUnique({ where: { id: approvalId } });
    if (!approval) throw new NotFoundException(`Approval request "${approvalId}" not found`);
    if (approval.status !== 'pending')
      throw new ConflictException(
        `Approval ${approvalId} is not pending (current: ${approval.status})`
      );

    // Check expiry
    if (approval.expiresAt && approval.expiresAt < new Date()) {
      await this.prisma.approvalRequest.update({
        where: { id: approvalId },
        data: { status: 'expired' },
      });
      throw new ConflictException(`Approval ${approvalId} has expired`);
    }

    this.logger.log(`Approval ${approvalId} ${dto.decision} by ${dto.decidedBy}`);

    const updated = await this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: dto.decision,
        decision: dto.decision,
        decidedBy: dto.decidedBy,
        decidedAt: new Date(),
        reason: dto.reason,
      },
    });

    // Update assessment log if linked
    if (dto.decision === 'approved') {
      await this.prisma.riskAssessmentLog.updateMany({
        where: { actionType: approval.actionType, decision: 'ASK', outcome: null },
        data: { outcome: 'completed', approvalRequestId: approvalId },
      });
    }

    return updated;
  }

  async revokeApproval(approvalId: string, dto: RevokeApprovalDto) {
    const approval = await this.prisma.approvalRequest.findUnique({ where: { id: approvalId } });
    if (!approval) throw new NotFoundException(`Approval request "${approvalId}" not found`);
    if (approval.status !== 'approved')
      throw new ConflictException(
        `Can only revoke approved requests (current: ${approval.status})`
      );

    this.logger.warn(`Approval ${approvalId} REVOKED by ${dto.revokedBy}: ${dto.reason}`);

    return this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'revoked',
        revocationReason: dto.reason,
        revokedBy: dto.revokedBy,
        revokedAt: new Date(),
      },
    });
  }

  async getPendingApprovals(domain?: string) {
    const where: Record<string, unknown> = { status: 'pending' };
    if (domain) where.domain = domain;
    return this.prisma.approvalRequest.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async getApprovalHistory(actionType: string, limit = 20) {
    return this.prisma.approvalRequest.findMany({
      where: { actionType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Batch Assessment ──────────────────────────────────────

  async batchAssess(dto: BatchAssessDto) {
    const results = [];
    for (const item of dto.assessments) {
      try {
        const assessment = await this.assessAction(item.actionType, {
          domain: item.domain,
          context: item.context,
          correlationId: item.correlationId,
        });
        results.push({ ...assessment, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ actionType: item.actionType, success: false, error: message });
      }
    }
    return {
      total: dto.assessments.length,
      allowed: results.filter(
        (r) => r.success && (r as Record<string, unknown>).decision === 'ALLOW'
      ).length,
      asked: results.filter((r) => r.success && (r as Record<string, unknown>).decision === 'ASK')
        .length,
      denied: results.filter((r) => r.success && (r as Record<string, unknown>).decision === 'DENY')
        .length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ── Audit Trail ───────────────────────────────────────────

  async getAssessmentLog(filters: {
    actionType?: string;
    domain?: string;
    decision?: string;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.actionType) where.actionType = filters.actionType;
    if (filters.domain) where.domain = filters.domain;
    if (filters.decision) where.decision = filters.decision;
    return this.prisma.riskAssessmentLog.findMany({
      where,
      orderBy: { assessedAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }

  // ── Stats ─────────────────────────────────────────────────

  async getStats() {
    const [classifications, assessments, approvals] = await Promise.all([
      this.prisma.riskClassification.findMany(),
      this.prisma.riskAssessmentLog.findMany({ orderBy: { assessedAt: 'desc' }, take: 1000 }),
      this.prisma.approvalRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
    ]);

    const byRiskLevel: Record<string, number> = {};
    const byAutonomyLevel: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    for (const c of classifications) {
      byRiskLevel[c.riskLevel] = (byRiskLevel[c.riskLevel] ?? 0) + 1;
      byAutonomyLevel[c.autonomyLevel] = (byAutonomyLevel[c.autonomyLevel] ?? 0) + 1;
      byDomain[c.domain] = (byDomain[c.domain] ?? 0) + 1;
    }

    const assessmentDecisions: Record<string, number> = {};
    for (const a of assessments) {
      assessmentDecisions[a.decision] = (assessmentDecisions[a.decision] ?? 0) + 1;
    }

    const approvalStatuses: Record<string, number> = {};
    for (const a of approvals) {
      approvalStatuses[a.status] = (approvalStatuses[a.status] ?? 0) + 1;
    }

    return {
      classifications: {
        total: classifications.length,
        byDomain,
        approvalRequired: classifications.filter((c) => c.approvalRequired).length,
        makerChecker: classifications.filter((c) => c.makerChecker).length,
      },
      assessments: {
        total: assessments.length,
        byDecision: assessmentDecisions,
        overridden: assessments.filter((a) => a.overridden).length,
      },
      approvals: {
        total: approvals.length,
        byStatus: approvalStatuses,
        pending: approvals.filter((a) => a.status === 'pending').length,
      },
    };
  }

  // ── Seed ──────────────────────────────────────────────────

  async seedClassifications(dto: SeedRiskClassificationsDto = {}) {
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
        const existing = await this.prisma.riskClassification.findUnique({
          where: { actionType: classDto.actionType },
        });
        if (existing && !dto.force) {
          results.skipped.push(classDto.actionType);
          continue;
        }
        if (existing) {
          await this.update(classDto.actionType, classDto);
          results.created.push(classDto.actionType);
        } else {
          await this.createClassification(classDto);
          results.created.push(classDto.actionType);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to seed ${classDto.actionType}: ${message}`);
        results.errors.push(classDto.actionType);
      }
    }

    this.logger.log(
      `Seed complete: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`
    );
    return results;
  }
}
