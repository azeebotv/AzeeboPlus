import {Inject,  Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ModerationRepository,
  ModerationScan,
  ModerationCase,
  SafetyAction,
  Appeal,
  TrustScore,
} from './moderation.repository.js';
import { PrismaService } from '../database/prisma.service.js';

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

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @Inject(ModerationRepository) private readonly moderationRepository: ModerationRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async scanContent(contentId: string, type: string = 'malware'): Promise<ScanResult> {
    try {
      const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to scan content: ${error}`);
      throw error;
    }
  }

  private async performScan(
    content: { id: string; title: string; description?: string | null; mediaUrl?: string | null },
    type: string
  ): Promise<{
    riskScore: number;
    provider: string;
    providerResponse: Record<string, unknown>;
    flaggedLabels: string[];
  }> {
    const flaggedLabels: string[] = [];
    let riskScore = 0;

    const textToScan = [content.title, content.description].filter(Boolean).join(' ').toLowerCase();

    if (type === 'malware' || type === 'spam') {
      const malwarePatterns = [
        { pattern: /bit\.ly|goo\.gl|tinyurl|t\.co/gi, label: 'url_shortener' },
        { pattern: /click here|act now|limited time|offer expires/gi, label: 'urgency_marketing' },
        { pattern: /free money|you won|\$1,000,000/gi, label: 'scam_language' },
        { pattern: /password|credit card|ssn|bank account/gi, label: 'sensitive_data_request' },
      ];

      for (const { pattern, label } of malwarePatterns) {
        if (pattern.test(textToScan)) {
          flaggedLabels.push(label);
          riskScore += 20;
        }
      }
    }

    return {
      riskScore: Math.min(100, riskScore),
      provider: 'internal_scanner',
      providerResponse: { scanned: true, type },
      flaggedLabels,
    };
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  async getRiskAssessment(contentId: string): Promise<RiskAssessment> {
    try {
      const scans = await this.moderationRepository.getScansByContentId(contentId);

      const contributingFactors = scans.map((scan) => ({
        factor: scan.type,
        weight: scan.riskScore,
        score: scan.riskScore,
      }));

      const avgRiskScore =
        scans.length > 0 ? scans.reduce((sum, scan) => sum + scan.riskScore, 0) / scans.length : 0;

      const recommendations: string[] = [];
      if (avgRiskScore > 50) recommendations.push('Manual review recommended');
      if (avgRiskScore > 80) recommendations.push('Content should be blocked');

      return {
        contentId,
        riskScore: Math.round(avgRiskScore),
        riskLevel: this.calculateRiskLevel(avgRiskScore),
        contributingFactors,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to get risk assessment: ${error}`);
      throw error;
    }
  }

  async resolveCase(
    caseId: string,
    _data: { resolution: string; resolvedBy: string; notes?: string }
  ): Promise<ModerationCase> {
    try {
      const moderationCase = await this.moderationRepository.getCase(caseId);
      if (!moderationCase) {
        throw new NotFoundException('Moderation case not found');
      }

      const updated = await this.moderationRepository.updateCase(caseId, {
        status: 'resolved',
        resolvedAt: new Date(),
      });

      return updated!;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to resolve case: ${error}`);
      throw error;
    }
  }

  async assignCase(caseId: string, userId: string): Promise<ModerationCase> {
    try {
      const moderationCase = await this.moderationRepository.getCase(caseId);
      if (!moderationCase) {
        throw new NotFoundException('Moderation case not found');
      }

      const updated = await this.moderationRepository.updateCase(caseId, {
        assignedTo: userId,
        status: 'under_review',
      });

      return updated!;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to assign case: ${error}`);
      throw error;
    }
  }

  async createCase(data: {
    contentId: string;
    type: string;
    severity: string;
    priority: string;
    policyCategory: string;
    description: string;
    evidence?: Record<string, unknown>;
    assignedTo?: string;
  }): Promise<ModerationCase> {
    try {
      return this.moderationRepository.createCase({
        contentId: data.contentId,
        type: data.type as 'content' | 'user' | 'comment' | 'message',
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        status: 'open',
        assignedTo: data.assignedTo,
        priority: data.priority as 'low' | 'medium' | 'high',
        policyCategory: data.policyCategory,
        description: data.description,
        evidence: data.evidence || {},
      });
    } catch (error) {
      this.logger.error(`Failed to create case: ${error}`);
      throw error;
    }
  }

  async getCases(filters?: { status?: string; type?: string }): Promise<ModerationCase[]> {
    try {
      return this.moderationRepository.getCases(filters);
    } catch (error) {
      this.logger.error(`Failed to get cases: ${error}`);
      throw error;
    }
  }

  async getCaseById(caseId: string): Promise<ModerationCase> {
    try {
      const moderationCase = await this.moderationRepository.getCase(caseId);
      if (!moderationCase) {
        throw new NotFoundException('Moderation case not found');
      }
      return moderationCase;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get case by id: ${error}`);
      throw error;
    }
  }

  async executeAction(data: {
    caseId: string;
    type: string;
    targetId: string;
    targetType: string;
    reason: string;
    performedBy: string;
    expiresAt?: Date;
  }): Promise<SafetyAction> {
    try {
      const action = await this.moderationRepository.createSafetyAction({
        caseId: data.caseId,
        type: data.type,
        targetId: data.targetId,
        targetType: data.targetType,
        reason: data.reason,
        performedBy: data.performedBy,
        status: 'executed',
        expiresAt: data.expiresAt,
      });

      if (data.type === 'content_removal') {
        await this.prisma.contentItem.update({
          where: { id: data.targetId },
          data: { status: 'removed' },
        });
      }

      return action;
    } catch (error) {
      this.logger.error(`Failed to execute action: ${error}`);
      throw error;
    }
  }

  async submitAppeal(data: { caseId: string; userId: string; reason: string }): Promise<Appeal> {
    try {
      return this.moderationRepository.createAppeal({
        caseId: data.caseId,
        userId: data.userId,
        reason: data.reason,
        status: 'pending',
      });
    } catch (error) {
      this.logger.error(`Failed to submit appeal: ${error}`);
      throw error;
    }
  }

  async reviewAppeal(
    appealId: string,
    reviewerId: string,
    decision: 'successful' | 'rejected',
    notes?: string
  ): Promise<Appeal> {
    try {
      const appeal = await this.moderationRepository.getAppeal(appealId);
      if (!appeal) {
        throw new NotFoundException('Appeal not found');
      }

      const updated = await this.moderationRepository.updateAppeal(appealId, {
        status: decision,
        resolvedBy: reviewerId,
        resolutionReason: notes,
        resolvedAt: new Date(),
      });

      return updated!;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to review appeal: ${error}`);
      throw error;
    }
  }

  async updateTrustScore(
    userId: string,
    data: { violation?: boolean; positiveAction?: boolean }
  ): Promise<TrustScore> {
    try {
      const existing = await this.moderationRepository.getTrustScore(userId);
      let score = existing?.score || 100;

      if (data.violation) {
        score = Math.max(0, score - 10);
      }
      if (data.positiveAction) {
        score = Math.min(100, score + 2);
      }

      return this.moderationRepository.updateTrustScore(userId, score, existing?.factors || {});
    } catch (error) {
      this.logger.error(`Failed to update trust score: ${error}`);
      throw error;
    }
  }

  async getTrustScore(userId: string): Promise<TrustScore | null> {
    try {
      return this.moderationRepository.getTrustScore(userId);
    } catch (error) {
      this.logger.error(`Failed to get trust score: ${error}`);
      throw error;
    }
  }

  async getContentScans(contentId: string): Promise<ModerationScan[]> {
    try {
      return this.moderationRepository.getScansByContentId(contentId);
    } catch (error) {
      this.logger.error(`Failed to get content scans: ${error}`);
      throw error;
    }
  }

  async getSafetyActionsByCase(caseId: string): Promise<SafetyAction[]> {
    try {
      return this.moderationRepository.getSafetyActionsByCaseId(caseId);
    } catch (error) {
      this.logger.error(`Failed to get safety actions by case: ${error}`);
      throw error;
    }
  }

  async getModerationStats(): Promise<{
    openCases: number;
    underReviewCases: number;
    resolvedToday: number;
    averageResolutionTime: number;
    topPolicyCategories: { category: string; count: number }[];
  }> {
    try {
      const cases = await this.moderationRepository.getCases();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const openCases = cases.filter((c) => c.status === 'open').length;
      const underReviewCases = cases.filter((c) => c.status === 'under_review').length;
      const resolvedToday = cases.filter(
        (c) => c.status === 'resolved' && c.resolvedAt && c.resolvedAt >= today
      ).length;

      const resolvedCases = cases.filter((c) => c.resolvedAt);
      const totalResolutionTime = resolvedCases.reduce((sum, c) => {
        if (c.resolvedAt) {
          return sum + (c.resolvedAt.getTime() - c.createdAt.getTime());
        }
        return sum;
      }, 0);

      const categoryCounts: Record<string, number> = {};
      cases.forEach((c) => {
        categoryCounts[c.policyCategory] = (categoryCounts[c.policyCategory] || 0) + 1;
      });

      const topPolicyCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      return {
        openCases,
        underReviewCases,
        resolvedToday,
        averageResolutionTime:
          resolvedCases.length > 0
            ? totalResolutionTime / resolvedCases.length / (1000 * 60 * 60)
            : 0,
        topPolicyCategories,
      };
    } catch (error) {
      this.logger.error(`Failed to get moderation stats: ${error}`);
      throw error;
    }
  }
}
