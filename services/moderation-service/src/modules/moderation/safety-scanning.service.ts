import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { SafetyScan } from '../../prisma/client';

export interface ScanResult {
  result: 'clean' | 'flagged' | 'blocked';
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  categories?: string[];
  details?: { [key: string]: unknown };
}

export interface ScanRequest {
  contentId?: string;
  mediaUrl: string;
  scanTypes?: ('malware' | 'content_safety' | 'copyright')[];
}

@Injectable()
export class SafetyScanningService {
  private readonly logger = new Logger(SafetyScanningService.name);
  private readonly scanningEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.scanningEnabled = this.configService.get<boolean>('SAFETY_SCANNING_ENABLED', true);
  }

  async scanMedia(request: ScanRequest): Promise<ScanResult> {
    if (!this.scanningEnabled) {
      this.logger.warn('Safety scanning is disabled, returning clean result');
      return { result: 'clean' };
    }

    const scanTypes = request.scanTypes || ['malware', 'content_safety'];

    const scanResults: ScanResult[] = await Promise.all(
      scanTypes.map((type) => this.performScan(type, request.mediaUrl))
    );

    return this.aggregateResults(scanResults);
  }

  async scanAndPersist(request: ScanRequest): Promise<{ scanId: string; result: ScanResult }> {
    const scanRecord = await this.prisma.safetyScan.create({
      data: {
        contentId: request.contentId || null,
        mediaUrl: request.mediaUrl,
        scanType: request.scanTypes?.join(',') || 'malware,content_safety',
        status: 'scanning',
        result: 'clean',
      },
    });

    try {
      const result = await this.scanMedia(request);

      await this.prisma.safetyScan.update({
        where: { id: scanRecord.id },
        data: {
          status: 'completed',
          result: result.result,
          threatLevel: result.threatLevel || null,
          categories: result.categories as unknown as object,
          details: result.details as unknown as object,
          completedAt: new Date(),
        },
      });

      return { scanId: scanRecord.id, result };
    } catch (error) {
      await this.prisma.safetyScan.update({
        where: { id: scanRecord.id },
        data: {
          status: 'failed',
          result: 'blocked',
          details: { error: (error as Error).message } as unknown as object,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async getScanById(scanId: string): Promise<SafetyScan | null> {
    return this.prisma.safetyScan.findUnique({
      where: { id: scanId },
    });
  }

  async getScansByContentId(contentId: string): Promise<SafetyScan[]> {
    return this.prisma.safetyScan.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkContentSafety(
    contentId: string
  ): Promise<{ isSafe: boolean; lastScan?: SafetyScan; issues: string[] }> {
    const scans = await this.getScansByContentId(contentId);

    if (scans.length === 0) {
      return { isSafe: false, issues: ['No safety scan found'] };
    }

    const lastScan = scans[0];

    if (lastScan.status !== 'completed') {
      return { isSafe: false, lastScan, issues: ['Scan not completed'] };
    }

    if (lastScan.result === 'blocked') {
      return {
        isSafe: false,
        lastScan,
        issues: [`Content blocked: ${lastScan.threatLevel || 'unknown threat'}`],
      };
    }

    if (lastScan.result === 'flagged') {
      return {
        isSafe: false,
        lastScan,
        issues: [`Content flagged: ${lastScan.threatLevel || 'potential issue'}`],
      };
    }

    return { isSafe: true, lastScan, issues: [] };
  }

  private async performScan(scanType: string, mediaUrl: string): Promise<ScanResult> {
    switch (scanType) {
      case 'malware':
        return this.scanForMalware(mediaUrl);
      case 'content_safety':
        return this.scanForContentSafety(mediaUrl);
      case 'copyright':
        return this.scanForCopyright(mediaUrl);
      default:
        return { result: 'clean' };
    }
  }

  private async scanForMalware(_mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing malware scan');

    const mockRisk = Math.random();
    if (mockRisk < 0.02) {
      return {
        result: 'blocked',
        threatLevel: 'critical',
        categories: ['malware_detected'],
        details: {
          signature: 'EICAR_TEST',
          confidence: 0.98,
        },
      };
    }
    if (mockRisk < 0.05) {
      return {
        result: 'flagged',
        threatLevel: 'medium',
        categories: ['suspicious_content'],
        details: {
          heuristicMatch: true,
          confidence: 0.72,
        },
      };
    }
    return { result: 'clean' };
  }

  private async scanForContentSafety(_mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing content safety scan');

    const mockRisk = Math.random();
    const safetyCategories = [
      'violence',
      'adult_content',
      'hate_speech',
      'graphic_content',
      'harmful_content',
    ];

    if (mockRisk < 0.03) {
      const detectedCategories = safetyCategories.slice(0, Math.floor(Math.random() * 2) + 1);
      return {
        result: 'blocked',
        threatLevel: 'high',
        categories: detectedCategories,
        details: {
          model: 'azeebo-safety-v2',
          confidence: 0.95,
        },
      };
    }
    if (mockRisk < 0.1) {
      return {
        result: 'flagged',
        threatLevel: 'low',
        categories: ['potentially_inappropriate'],
        details: {
          model: 'azeebo-safety-v2',
          confidence: 0.65,
        },
      };
    }
    return { result: 'clean' };
  }

  private async scanForCopyright(_mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing copyright scan');

    const mockRisk = Math.random();
    if (mockRisk < 0.08) {
      return {
        result: 'flagged',
        threatLevel: 'medium',
        categories: ['copyright_match'],
        details: {
          matchCount: Math.floor(Math.random() * 5) + 1,
          matchType: 'fingerprint',
          confidence: 0.88,
        },
      };
    }
    return { result: 'clean' };
  }

  private aggregateResults(results: ScanResult[]): ScanResult {
    const aggregated: ScanResult = { result: 'clean' };
    const allCategories: string[] = [];
    const allDetails: { [key: string]: unknown } = {};

    for (const result of results) {
      if (result.categories) {
        allCategories.push(...result.categories);
      }
      if (result.details) {
        Object.assign(allDetails, result.details);
      }

      if (result.result === 'blocked') {
        aggregated.result = 'blocked';
        aggregated.threatLevel = 'critical';
        break;
      }
      if (result.result === 'flagged' && aggregated.result !== 'blocked') {
        aggregated.result = 'flagged';
        if (
          !aggregated.threatLevel ||
          (result.threatLevel &&
            this.getThreatLevelPriority(result.threatLevel) >
              this.getThreatLevelPriority(aggregated.threatLevel))
        ) {
          aggregated.threatLevel = result.threatLevel;
        }
      }
    }

    if (allCategories.length > 0) {
      aggregated.categories = allCategories;
    }
    if (Object.keys(allDetails).length > 0) {
      aggregated.details = allDetails;
    }

    return aggregated;
  }

  private getThreatLevelPriority(level?: string): number {
    const priorities: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorities[level || ''] || 0;
  }
}
