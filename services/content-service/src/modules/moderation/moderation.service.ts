import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ModerationRepository, ModerationScan, ModerationCase, SafetyAction, Appeal, TrustScore } from './moderation.repository';
import { PrismaService } from '../database/prisma.service';

export interface ScanResult {
  scanId: string;
  contentId: string;
  status: 'clean' | 'flagged' | 'blocked';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flaggedCategories: string[];
  provider: string;
}

export interface RiskAssessment {
  contentId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: { factor: string; weight: number; score: number }[];
  recommendations: string[];
}

interface ContentItem {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  mediaUrl?: string;
  creatorId?: string;
  status?: string;
  createdAt: Date;
}

@Injectable()
export class ModerationService {
  constructor(
    private readonly moderationRepository: ModerationRepository,
    private readonly prisma: PrismaService
  ) {}

  async scanContent(
    contentId: string,
    type: 'malware' | 'nsfw' | 'hate_speech' | 'violence' | 'copyright' | 'spam' | 'misinformation' = 'malware'
  ): Promise<ScanResult> {
    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } }) as ContentItem | null;
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const scanData = await this.performScan(content, type);
    const riskLevel = this.calculateRiskLevel(scanData.riskScore);

    const scan = await this.moderationRepository.createScan({
      contentId,
      type,
      status: riskLevel === 'critical' ? 'blocked' : riskLevel === 'high' ? 'flagged' : 'clean',
      riskScore: scanData.riskScore,
      riskLevel,
      provider: scanData.provider,
      providerResponse: scanData.providerResponse,
      flaggedLabels: scanData.flaggedLabels,
    });

    return {
      scanId: scan.id,
      contentId: scan.contentId,
      status: scan.status as 'clean' | 'flagged' | 'blocked',
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel as 'low' | 'medium' | 'high' | 'critical',
      flaggedCategories: scan.flaggedLabels,
      provider: scan.provider,
    };
  }

  private async performScan(
    content: ContentItem,
    type: string
  ): Promise<{ riskScore: number; provider: string; providerResponse: Record<string, unknown>; flaggedLabels: string[] }> {
    const flaggedLabels: string[] = [];
    let riskScore = 0;

    const textToScan = [content.title, content.description, content.content].filter(Boolean).join(' ').toLowerCase();

    if (type === 'malware' || type === 'spam') {
      const malwarePatterns = [
        { pattern: /bit\.ly|goo\.gl|tinyurl|t\.co/gi, label: 'url_shortener' },
        { pattern: /click here|act now|limited time|offer expires/gi, label: 'urgency_marketing' },
        { pattern: /free money|you won|\$1,000,000/gi, label: 'scam_language' },
        { pattern: /password|credit card|ssn|bank account/gi, label: 'sensitive_data_request' },
        { pattern: /\.exe|\.apk|\.bat|\.cmd|\.sh$/gi, label: 'executable_file_reference' },
      ];

      for (const { pattern, label } of malwarePatterns) {
        if (pattern.test(textToScan)) {
          flaggedLabels.push(label);
          riskScore += 20;
        }
      }
    }

    if (type === 'nsfw' || type === 'hate_speech' || type === 'violence') {
      const contentPolicyViolations = [
        { keywords: ['explicit', 'nsfw', 'adult content', '18+'], label: 'adult_content', weight: 25 },
        { keywords: ['hate', 'racist', 'discrimination', 'slur'], label: 'hate_speech', weight: 30 },
        { keywords: ['violence', 'gore', 'blood', 'kill', 'attack'], label: 'violence', weight: 20 },
        { keywords: ['weapon', 'gun', 'knife', 'bomb'], label: 'weapon_reference', weight: 15 },
      ];

      for (const policy of contentPolicyViolations) {
        const matches = policy.keywords.filter((kw) => textToScan.includes(kw)).length;
        if (matches > 0) {
          flaggedLabels.push(policy.label);
          riskScore += policy.weight * Math.min(matches, 3);
        }
      }
    }

    if (type === 'copyright' || type === 'misinformation') {
      const copyrightPatterns = [
        { pattern: /©|\(c\)|copyright|all rights reserved/gi, label: 'copyright_notice', weight: 10 },
        { pattern: /fake|hoax|conspiracy|debunked/gi, label: 'misinformation_indicator', weight: 20 },
      ];

      for (const { pattern, label, weight } of copyrightPatterns) {
        if (pattern.test(textToScan)) {
          flaggedLabels.push(label);
          riskScore += weight;
        }
      }
    }

    const spamPatterns = [
      { pattern: /(.)\1{4,}/gi, label: 'repeated_character', weight: 10 },
      { pattern: /[A-Z]{10,}/g, label: 'excessive_caps', weight: 10 },
      { pattern: /!!!!+|???+/g, label: 'excessive_punctuation', weight: 5 },
    ];

    for (const { pattern, label, weight } of spamPatterns) {
      if (pattern.test(textToScan)) {
        flaggedLabels.push(label);
        riskScore += weight;
      }
    }

    if (content.mediaUrl) {
      if (content.mediaUrl.match(/\.(exe|apk|bat|cmd|sh|vbs|js)$/i)) {
        flaggedLabels.push('suspicious_file_extension');
        riskScore += 25;
      }
    }

    return {
      riskScore: Math.min(100, riskScore),
      provider: 'internal_rule_engine',
      providerResponse: {
        scannedAt: new Date().toISOString(),
        contentType: type,
        textLength: textToScan.length,
      },
      flaggedLabels,
    };
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  async assessContentRisk(contentId: string): Promise<RiskAssessment> {
    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } }) as ContentItem | null;
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const scans = await this.moderationRepository.getScanByContentId(contentId);
    const contributingFactors: { factor: string; weight: number; score: number }[] = [];
    let totalRiskScore = 0;

    if (scans.length > 0) {
      const avgRiskScore = scans.reduce((sum, s) => sum + s.riskScore, 0) / scans.length;
      contributingFactors.push({ factor: 'historical_scans', weight: 0.3, score: avgRiskScore });
      totalRiskScore += avgRiskScore * 0.3;
    }

    const textToAnalyze = [content.title, content.description].filter(Boolean).join(' ').toLowerCase();
    if (textToAnalyze.length < 20) {
      contributingFactors.push({ factor: 'short_content', weight: 0.1, score: 20 });
      totalRiskScore += 20 * 0.1;
    }

    const ageInHours = (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      contributingFactors.push({ factor: 'newly_created', weight: 0.15, score: 25 });
      totalRiskScore += 25 * 0.15;
    }

    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urlCount = (textToAnalyze.match(urlPattern) || []).length;
    if (urlCount > 3) {
      contributingFactors.push({ factor: 'multiple_urls', weight: 0.2, score: Math.min(urlCount * 10, 40) });
      totalRiskScore += Math.min(urlCount * 10, 40) * 0.2;
    }

    const recommendations: string[] = [];
    const finalRiskScore = Math.min(100, Math.round(totalRiskScore));
    const riskLevel = this.calculateRiskLevel(finalRiskScore);

    if (riskLevel === 'critical') {
      recommendations.push('Immediately remove content from public view');
      recommendations.push('Escalate to senior moderator');
      recommendations.push('Consider automatic user suspension');
    } else if (riskLevel === 'high') {
      recommendations.push('Queue for priority review');
      recommendations.push('Reduce content visibility pending review');
    } else if (riskLevel === 'medium') {
      recommendations.push('Add to review queue');
    } else {
      recommendations.push('Content appears safe');
    }

    return {
      contentId,
      riskScore: finalRiskScore,
      riskLevel,
      contributingFactors,
      recommendations,
    };
  }

  async createModerationCase(data: {
    contentId: string;
    type: 'content' | 'user' | 'comment' | 'message';
    severity: 'low' | 'medium' | 'high' | 'critical';
    priority: 'low' | 'medium' | 'high';
    policyCategory: string;
    description: string;
    evidence?: Record<string, unknown>;
    assignedTo?: string;
  }): Promise<ModerationCase> {
    return this.moderationRepository.createCase(data);
  }

  async getCase(caseId: string): Promise<ModerationCase> {
    const caseData = await this.moderationRepository.getCaseById(caseId);
    if (!caseData) {
      throw new NotFoundException('Moderation case not found');
    }
    return caseData;
  }

  async getCases(filters: {
    status?: 'open' | 'under_review' | 'resolved' | 'escalated' | 'dismissed';
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
    page?: number;
    limit?: number;
  }): Promise<{ data: ModerationCase[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const result = await this.moderationRepository.getCases({
      status: filters.status,
      assignedTo: filters.assignedTo,
      priority: filters.priority,
      limit,
      offset,
    });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async assignCase(caseId: string, moderatorId: string): Promise<ModerationCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) {
      throw new NotFoundException('Moderation case not found');
    }

    const updated = await this.moderationRepository.updateCase(caseId, {
      assignedTo: moderatorId,
      status: 'under_review',
    });

    await this.moderationRepository.createAuditLog({
      action: 'CASE_ASSIGNED',
      entityType: 'moderation_case',
      entityId: caseId,
      actorId: moderatorId,
      details: { previousStatus: caseData.status },
    });

    return updated;
  }

  async resolveCase(
    caseId: string,
    moderatorId: string,
    resolution: 'resolved' | 'dismissed' | 'escalated',
    notes?: string
  ): Promise<ModerationCase> {
    const caseData = await this.getCase(caseId);

    const updated = await this.moderationRepository.updateCase(caseId, {
      status: resolution,
      resolvedAt: new Date(),
    });

    await this.moderationRepository.createAuditLog({
      action: `CASE_${resolution.toUpperCase()}`,
      entityType: 'moderation_case',
      entityId: caseId,
      actorId: moderatorId,
      details: { notes, previousStatus: caseData.status },
    });

    return updated;
  }

  async executeSafetyAction(data: {
    caseId: string;
    type: 'warning' | 'content_removal' | 'account_suspension' | 'account_ban' | 'content_aging' | 'visibility_reduction';
    targetId: string;
    targetType: 'user' | 'content' | 'comment';
    reason: string;
    performedBy: string;
    durationDays?: number;
  }): Promise<SafetyAction> {
    const caseData = await this.getCase(data.caseId);
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const expiresAt = data.durationDays
      ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
      : undefined;

    const action = await this.moderationRepository.createSafetyAction({
      caseId: data.caseId,
      type: data.type,
      targetId: data.targetId,
      targetType: data.targetType,
      reason: data.reason,
      performedBy: data.performedBy,
      status: 'pending',
      expiresAt,
    });

    await this.executeActionContent(action);

    await this.moderationRepository.updateSafetyActionStatus(action.id, { status: 'executed' });

    await this.moderationRepository.createAuditLog({
      action: 'SAFETY_ACTION_EXECUTED',
      entityType: 'safety_action',
      entityId: action.id,
      actorId: data.performedBy,
      details: {
        actionType: data.type,
        targetId: data.targetId,
        targetType: data.targetType,
        reason: data.reason,
        expiresAt,
      },
    });

    return action;
  }

  private async executeActionContent(action: SafetyAction): Promise<void> {
    switch (action.type) {
      case 'content_removal':
        await this.prisma.contentItem.update({
          where: { id: action.targetId },
          data: { status: 'removed' },
        });
        break;
      case 'account_suspension':
      case 'account_ban':
        await this.prisma.user.update({
          where: { id: action.targetId },
          data: {
            status: action.type === 'account_ban' ? 'banned' : 'suspended',
            suspendedAt: new Date(),
          },
        });
        break;
      case 'visibility_reduction':
        await this.prisma.contentItem.update({
          where: { id: action.targetId },
          data: { visibilityScore: 0 },
        });
        break;
    }
  }

  async submitAppeal(data: {
    caseId: string;
    actionId: string;
    appellantId: string;
    reason: string;
    evidence?: Record<string, unknown>;
  }): Promise<Appeal> {
    const appeal = await this.moderationRepository.createAppeal({
      caseId: data.caseId,
      actionId: data.actionId,
      appellantId: data.appellantId,
      reason: data.reason,
      evidence: data.evidence || {},
      status: 'pending',
    });

    await this.moderationRepository.createAuditLog({
      action: 'APPEAL_SUBMITTED',
      entityType: 'appeal',
      entityId: appeal.id,
      actorId: data.appellantId,
      details: { caseId: data.caseId, actionId: data.actionId },
    });

    return appeal;
  }

  async reviewAppeal(
    appealId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<Appeal> {
    const appeal = await this.moderationRepository.getAppealById(appealId);
    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    const updated = await this.moderationRepository.updateAppeal(appealId, {
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });

    if (decision === 'approved') {
      const actions = await this.moderationRepository.getSafetyActionsByCaseId(appeal.caseId);
      const targetAction = actions.find((a) => a.id === appeal.actionId);
      if (targetAction) {
        await this.moderationRepository.updateSafetyActionStatus(targetAction.id, { status: 'reversed' });
        await this.reverseActionContent(targetAction);
      }
    }

    await this.moderationRepository.createAuditLog({
      action: `APPEAL_${decision.toUpperCase()}`,
      entityType: 'appeal',
      entityId: appealId,
      actorId: reviewerId,
      details: { decision, notes },
    });

    return updated;
  }

  private async reverseActionContent(action: SafetyAction): Promise<void> {
    switch (action.type) {
      case 'content_removal':
        await this.prisma.contentItem.update({
          where: { id: action.targetId },
          data: { status: 'published' },
        });
        break;
      case 'account_suspension':
      case 'account_ban':
        await this.prisma.user.update({
          where: { id: action.targetId },
          data: {
            status: 'active',
            suspendedAt: null,
          },
        });
        break;
      case 'visibility_reduction':
        await this.prisma.contentItem.update({
          where: { id: action.targetId },
          data: { visibilityScore: 50 },
        });
        break;
    }
  }

  async updateTrustScore(
    userId: string,
    data: {
      violation?: boolean;
      violationType?: string;
      positiveAction?: boolean;
    }
  ): Promise<TrustScore> {
    let trustScore = await this.moderationRepository.getTrustScore(userId);
    const factors: Record<string, number> = trustScore?.factors || {};

    if (!trustScore) {
      trustScore = await this.moderationRepository.upsertTrustScore(userId, {
        score: 100,
        tier: 'regular',
        factors: {},
        violationCount: 0,
      });
    }

    let newScore = trustScore.score;

    if (data.violation) {
      const violationWeights: Record<string, number> = {
        spam: 10,
        harassment: 20,
        hate_speech: 30,
        violence: 35,
        explicit_content: 25,
        copyright: 15,
        misinformation: 15,
      };

      const weight = data.violationType ? violationWeights[data.violationType] || 10 : 10;
      newScore = Math.max(0, newScore - weight);
      factors[data.violationType || 'general'] = (factors[data.violationType || 'general'] || 0) + weight;
    }

    if (data.positiveAction) {
      newScore = Math.min(100, newScore + 2);
      factors.positiveEngagement = (factors.positiveEngagement || 0) + 2;
    }

    const tier = this.calculateTrustTier(newScore);
    const violationCount = data.violation ? trustScore.violationCount + 1 : trustScore.violationCount;

    return this.moderationRepository.upsertTrustScore(userId, {
      score: newScore,
      tier,
      factors,
      violationCount,
      lastViolationAt: data.violation ? new Date() : trustScore.lastViolationAt,
    });
  }

  private calculateTrustTier(score: number): 'trusted' | 'regular' | 'monitored' | 'restricted' {
    if (score >= 90) return 'trusted';
    if (score >= 70) return 'regular';
    if (score >= 40) return 'monitored';
    return 'restricted';
  }

  async getTrustScore(userId: string): Promise<TrustScore | null> {
    return this.moderationRepository.getTrustScore(userId);
  }

  async getContentScans(contentId: string): Promise<ModerationScan[]> {
    return this.moderationRepository.getScanByContentId(contentId);
  }

  async getSafetyActionsByCase(caseId: string): Promise<SafetyAction[]> {
    return this.moderationRepository.getSafetyActionsByCaseId(caseId);
  }

  async getModerationStats(): Promise<{
    openCases: number;
    underReviewCases: number;
    resolvedToday: number;
    averageResolutionTime: number;
    topPolicyCategories: { category: string; count: number }[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openCases, underReviewCases, resolvedToday, allCases] = await Promise.all([
      this.prisma.moderationCase.count({ where: { status: 'open' } }),
      this.prisma.moderationCase.count({ where: { status: 'under_review' } }),
      this.prisma.moderationCase.count({ where: { status: 'resolved', resolvedAt: { gte: today } } }),
      this.prisma.moderationCase.findMany({
        where: { status: 'resolved', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true, policyCategory: true },
      }),
    ]);

    let totalResolutionTime = 0;
    const categoryCounts: Record<string, number> = {};

    for (const c of allCases) {
      if (c.resolvedAt) {
        totalResolutionTime += c.resolvedAt.getTime() - c.createdAt.getTime();
      }
      categoryCounts[c.policyCategory] = (categoryCounts[c.policyCategory] || 0) + 1;
    }

    const topPolicyCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      openCases,
      underReviewCases,
      resolvedToday,
      averageResolutionTime: allCases.length > 0 ? totalResolutionTime / allCases.length / (1000 * 60 * 60) : 0,
      topPolicyCategories,
    };
  }
}