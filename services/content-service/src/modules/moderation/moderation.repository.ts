import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ModerationScan {
  id: string;
  contentId: string;
  type: 'malware' | 'nsfw' | 'hate_speech' | 'violence' | 'copyright' | 'spam' | 'misinformation';
  status: 'pending' | 'clean' | 'flagged' | 'blocked';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  provider: string;
  providerResponse: Record<string, unknown>;
  flaggedLabels: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationCase {
  id: string;
  contentId: string;
  type: 'content' | 'user' | 'comment' | 'message';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'dismissed';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  policyCategory: string;
  description: string;
  evidence: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SafetyAction {
  id: string;
  caseId: string;
  type: 'warning' | 'content_removal' | 'account_suspension' | 'account_ban' | 'content_aging' | 'visibility_reduction';
  targetId: string;
  targetType: 'user' | 'content' | 'comment';
  reason: string;
  performedBy: string;
  status: 'pending' | 'executed' | 'reversed' | 'expired';
  expiresAt?: Date;
  createdAt: Date;
}

export interface Appeal {
  id: string;
  caseId: string;
  actionId: string;
  appellantId: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export interface TrustScore {
  id: string;
  userId: string;
  score: number;
  tier: 'trusted' | 'regular' | 'monitored' | 'restricted';
  factors: Record<string, number>;
  violationCount: number;
  lastViolationAt?: Date;
  lastUpdated: Date;
}

export interface PolicyCategory {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAction: 'flag' | 'block' | 'escalate' | 'none';
  reviewRequired: boolean;
  createdAt: Date;
}

@Injectable()
export class ModerationRepository {
  constructor(private prisma: PrismaService) {}

  async createScan(data: {
    contentId: string;
    type: string;
    status: string;
    riskScore: number;
    riskLevel: string;
    provider: string;
    providerResponse: Record<string, unknown>;
    flaggedLabels: string[];
  }): Promise<ModerationScan> {
    return this.prisma.moderationScan.create({ data }) as Promise<ModerationScan>;
  }

  async getScanByContentId(contentId: string): Promise<ModerationScan[]> {
    return this.prisma.moderationScan.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ModerationScan[]>;
  }

  async updateScanStatus(
    scanId: string,
    data: {
      status: string;
      reviewedBy?: string;
      reviewedAt?: Date;
    }
  ): Promise<ModerationScan> {
    return this.prisma.moderationScan.update({
      where: { id: scanId },
      data,
    }) as Promise<ModerationScan>;
  }

  async createCase(data: {
    contentId: string;
    type: string;
    severity: string;
    status: string;
    priority: string;
    policyCategory: string;
    description: string;
    evidence: Record<string, unknown>;
    assignedTo?: string;
  }): Promise<ModerationCase> {
    return this.prisma.moderationCase.create({ data }) as Promise<ModerationCase>;
  }

  async getCaseById(caseId: string): Promise<ModerationCase | null> {
    return this.prisma.moderationCase.findUnique({ where: { id: caseId } }) as Promise<ModerationCase | null>;
  }

  async getCases(filters: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ModerationCase[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.priority) where.priority = filters.priority;

    const [data, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.moderationCase.count({ where }),
    ]);

    return { data: data as ModerationCase[], total };
  }

  async updateCase(
    caseId: string,
    data: {
      status?: string;
      assignedTo?: string;
      priority?: string;
      severity?: string;
      resolvedAt?: Date;
    }
  ): Promise<ModerationCase> {
    return this.prisma.moderationCase.update({
      where: { id: caseId },
      data,
    }) as Promise<ModerationCase>;
  }

  async createSafetyAction(data: {
    caseId: string;
    type: string;
    targetId: string;
    targetType: string;
    reason: string;
    performedBy: string;
    status: string;
    expiresAt?: Date;
  }): Promise<SafetyAction> {
    return this.prisma.safetyAction.create({ data }) as Promise<SafetyAction>;
  }

  async getSafetyActionsByCaseId(caseId: string): Promise<SafetyAction[]> {
    return this.prisma.safetyAction.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SafetyAction[]>;
  }

  async updateSafetyActionStatus(
    actionId: string,
    data: { status: string }
  ): Promise<SafetyAction> {
    return this.prisma.safetyAction.update({
      where: { id: actionId },
      data,
    }) as Promise<SafetyAction>;
  }

  async createAppeal(data: {
    caseId: string;
    actionId: string;
    appellantId: string;
    reason: string;
    evidence: Record<string, unknown>;
    status: string;
  }): Promise<Appeal> {
    return this.prisma.appeal.create({ data }) as Promise<Appeal>;
  }

  async getAppealById(appealId: string): Promise<Appeal | null> {
    return this.prisma.appeal.findUnique({ where: { id: appealId } }) as Promise<Appeal | null>;
  }

  async updateAppeal(
    appealId: string,
    data: {
      status: string;
      reviewedBy?: string;
      reviewedAt?: Date;
      reviewNotes?: string;
    }
  ): Promise<Appeal> {
    return this.prisma.appeal.update({
      where: { id: appealId },
      data,
    }) as Promise<Appeal>;
  }

  async upsertTrustScore(userId: string, data: {
    score: number;
    tier: string;
    factors: Record<string, number>;
    violationCount: number;
    lastViolationAt?: Date;
  }): Promise<TrustScore> {
    return this.prisma.trustScore.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data, lastUpdated: new Date() },
    }) as Promise<TrustScore>;
  }

  async getTrustScore(userId: string): Promise<TrustScore | null> {
    return this.prisma.trustScore.findUnique({ where: { userId } }) as Promise<TrustScore | null>;
  }

  async createPolicyCategory(data: {
    name: string;
    description: string;
    severity: string;
    autoAction: string;
    reviewRequired: boolean;
  }): Promise<PolicyCategory> {
    return this.prisma.policyCategory.create({ data }) as Promise<PolicyCategory>;
  }

  async getPolicyCategories(): Promise<PolicyCategory[]> {
    return this.prisma.policyCategory.findMany({
      orderBy: { severity: 'desc' },
    }) as Promise<PolicyCategory[]>;
  }

  async createAuditLog(data: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<unknown> {
    return this.prisma.auditLog.create({ data });
  }
}