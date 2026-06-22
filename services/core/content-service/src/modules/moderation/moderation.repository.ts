import { Injectable } from '@nestjs/common';
import { createLogger } from '@azeebo/logger';
export interface ModerationScan {
  id: string;
  contentId: string;
  type: string;
  status: string;
  riskScore: number;
  riskLevel: string;
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
  type: string;
  severity: string;
  status: string;
  assignedTo?: string;
  priority: string;
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
  type: string;
  targetId: string;
  targetType: string;
  reason: string;
  performedBy: string;
  status: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Appeal {
  id: string;
  caseId: string;
  userId: string;
  reason: string;
  status: string;
  resolvedBy?: string;
  resolutionReason?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustScore {
  id: string;
  userId: string;
  score: number;
  factors: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCategory {
  id: string;
  name: string;
  description: string;
  severity: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ModerationRepository {
  private readonly logger = createLogger('moderation-service');
  // In-memory storage for moderation data
  // In production, this should use a dedicated moderation database or service
  private moderationScans: Map<string, ModerationScan> = new Map();
  private moderationCases: Map<string, ModerationCase> = new Map();
  private safetyActions: Map<string, SafetyAction> = new Map();
  private appeals: Map<string, Appeal> = new Map();
  private trustScores: Map<string, TrustScore> = new Map();
  private policyCategories: Map<string, PolicyCategory> = new Map();

  async createScan(
    data: Omit<ModerationScan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ModerationScan> {
    const id = `scan-${Date.now()}`;
    const scan: ModerationScan = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.moderationScans.set(id, scan);
    return scan;
  }

  async getScan(id: string): Promise<ModerationScan | null> {
    return this.moderationScans.get(id) || null;
  }

  async getScansByContentId(contentId: string): Promise<ModerationScan[]> {
    return Array.from(this.moderationScans.values()).filter((scan) => scan.contentId === contentId);
  }

  async updateScan(id: string, data: Partial<ModerationScan>): Promise<ModerationScan | null> {
    const scan = this.moderationScans.get(id);
    if (!scan) return null;
    const updated = { ...scan, ...data, updatedAt: new Date() };
    this.moderationScans.set(id, updated);
    return updated;
  }

  async createCase(
    data: Omit<ModerationCase, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ModerationCase> {
    const id = `case-${Date.now()}`;
    const moderationCase: ModerationCase = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.moderationCases.set(id, moderationCase);
    return moderationCase;
  }

  async getCase(id: string): Promise<ModerationCase | null> {
    return this.moderationCases.get(id) || null;
  }

  async getCases(filters?: { status?: string; type?: string }): Promise<ModerationCase[]> {
    let cases = Array.from(this.moderationCases.values());
    if (filters?.status) {
      cases = cases.filter((c) => c.status === filters.status);
    }
    if (filters?.type) {
      cases = cases.filter((c) => c.type === filters.type);
    }
    return cases;
  }

  async updateCase(id: string, data: Partial<ModerationCase>): Promise<ModerationCase | null> {
    const moderationCase = this.moderationCases.get(id);
    if (!moderationCase) return null;
    const updated = { ...moderationCase, ...data, updatedAt: new Date() };
    this.moderationCases.set(id, updated);
    return updated;
  }

  async createSafetyAction(data: Omit<SafetyAction, 'id' | 'createdAt'>): Promise<SafetyAction> {
    const id = `action-${Date.now()}`;
    const action: SafetyAction = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.safetyActions.set(id, action);
    return action;
  }

  async getSafetyActionsByCaseId(caseId: string): Promise<SafetyAction[]> {
    return Array.from(this.safetyActions.values()).filter((action) => action.caseId === caseId);
  }

  async createAppeal(data: Omit<Appeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appeal> {
    const id = `appeal-${Date.now()}`;
    const appeal: Appeal = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appeals.set(id, appeal);
    return appeal;
  }

  async getAppeal(id: string): Promise<Appeal | null> {
    return this.appeals.get(id) || null;
  }

  async getAppealsByCaseId(caseId: string): Promise<Appeal[]> {
    return Array.from(this.appeals.values()).filter((appeal) => appeal.caseId === caseId);
  }

  async updateAppeal(id: string, data: Partial<Appeal>): Promise<Appeal | null> {
    const appeal = this.appeals.get(id);
    if (!appeal) return null;
    const updated = { ...appeal, ...data, updatedAt: new Date() };
    this.appeals.set(id, updated);
    return updated;
  }

  async getTrustScore(userId: string): Promise<TrustScore | null> {
    return this.trustScores.get(userId) || null;
  }

  async updateTrustScore(
    userId: string,
    score: number,
    factors: Record<string, unknown>
  ): Promise<TrustScore> {
    const existing = this.trustScores.get(userId);
    const trustScore: TrustScore = {
      id: existing?.id || `trust-${Date.now()}`,
      userId,
      score,
      factors,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.trustScores.set(userId, trustScore);
    return trustScore;
  }

  async getPolicyCategories(): Promise<PolicyCategory[]> {
    return Array.from(this.policyCategories.values());
  }

  async createPolicyCategory(
    data: Omit<PolicyCategory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PolicyCategory> {
    const id = `policy-${Date.now()}`;
    const category: PolicyCategory = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.policyCategories.set(id, category);
    return category;
  }

  async logAudit(data: {
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    // Audit logging is handled by user-service
    this.logger.log('Audit', {
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
    });
  }
}
