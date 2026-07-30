import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import type { SafetyScan } from '../../prisma/client/index.js';
import axios from 'axios';

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

export interface SafetyApiConfig {
  apiKey: string;
  endpoint: string;
  timeout: number;
}

@Injectable()
export class SafetyScanningService {
  private readonly logger = new Logger(SafetyScanningService.name);
  private readonly scanningEnabled: boolean;
  private readonly useMockScanning: boolean;

  // Circuit breaker state
  private malwareFailures = 0;
  private contentSafetyFailures = 0;
  private copyrightFailures = 0;
  private static readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private static readonly CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute
  private malwareCircuitOpenUntil = 0;
  private contentSafetyCircuitOpenUntil = 0;
  private copyrightCircuitOpenUntil = 0;

  private readonly malwareApiConfig: SafetyApiConfig;
  private readonly contentSafetyApiConfig: SafetyApiConfig;
  private readonly copyrightApiConfig: SafetyApiConfig;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.scanningEnabled = this.configService.get<boolean>('SAFETY_SCANNING_ENABLED', true);
    this.useMockScanning = this.configService.get<boolean>('USE_MOCK_SCANNING', false);

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    if (isProduction && this.useMockScanning) {
      throw new Error(
        'USE_MOCK_SCANNING cannot be enabled in production - set NODE_ENV != production or disable USE_MOCK_SCANNING'
      );
    }

    this.malwareApiConfig = {
      apiKey: this.configService.get<string>('MALWARE_SCAN_API_KEY', ''),
      endpoint: this.configService.get<string>(
        'MALWARE_SCAN_API_ENDPOINT',
        'https://api.virustotal.com/v3/files'
      ),
      timeout: this.configService.get<number>('MALWARE_SCAN_TIMEOUT', 30000),
    };

    this.contentSafetyApiConfig = {
      apiKey: this.configService.get<string>('CONTENT_SAFETY_API_KEY', ''),
      endpoint: this.configService.get<string>(
        'CONTENT_SAFETY_API_ENDPOINT',
        'https://vision.googleapis.com/v1/images:annotate'
      ),
      timeout: this.configService.get<number>('CONTENT_SAFETY_TIMEOUT', 30000),
    };

    this.copyrightApiConfig = {
      apiKey: this.configService.get<string>('COPYRIGHT_API_KEY', ''),
      endpoint: this.configService.get<string>(
        'COPYRIGHT_API_ENDPOINT',
        'https://api.copyright.com/v1/search'
      ),
      timeout: this.configService.get<number>('COPYRIGHT_TIMEOUT', 30000),
    };

    if (this.useMockScanning) {
      this.logger.warn('WARNING: Mock scanning is enabled - this must not be used in production');
    }
  }

  /**
   * Validates a URL to prevent SSRF attacks before forwarding to external scanning APIs.
   * Only allows HTTPS URLs and rejects private/internal IP ranges.
   */
  private validateMediaUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid media URL format');
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Only HTTPS URLs are allowed for external scanning');
    }

    const hostname = parsed.hostname;
    const privatePatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^localhost$/i,
      /^\[::1\]$/,
      /^::1$/,
    ];

    if (privatePatterns.some((pattern) => pattern.test(hostname))) {
      throw new BadRequestException(' URLs pointing to private/internal networks are not allowed');
    }
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
    try {
      return await this.prisma.safetyScan.findUnique({
        where: { id: scanId },
      });
    } catch (error) {
      this.logger.error(`Failed to get scan by ID ${scanId}: ${(error as Error).message}`);
      return null;
    }
  }

  async getScansByContentId(contentId: string): Promise<SafetyScan[]> {
    try {
      return await this.prisma.safetyScan.findMany({
        where: { contentId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get scans for content ${contentId}: ${(error as Error).message}`);
      return [];
    }
  }

  async checkContentSafety(
    contentId: string
  ): Promise<{ isSafe: boolean; lastScan?: SafetyScan; issues: string[] }> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to check content safety for ${contentId}: ${(error as Error).message}`);
      return { isSafe: false, issues: ['Failed to check content safety'] };
    }
  }

  private async performScan(scanType: string, mediaUrl: string): Promise<ScanResult> {
    if (this.useMockScanning) {
      return this.performMockScan(scanType, mediaUrl);
    }

    switch (scanType) {
      case 'malware':
        return this.performMalwareScan(mediaUrl);
      case 'content_safety':
        return this.performContentSafetyScan(mediaUrl);
      case 'copyright':
        return this.performCopyrightScan(mediaUrl);
      default:
        return { result: 'clean' };
    }
  }

  private async performMockScan(scanType: string, _mediaUrl: string): Promise<ScanResult> {
    switch (scanType) {
      case 'malware':
        return this.mockMalwareScan();
      case 'content_safety':
        return this.mockContentSafetyScan();
      case 'copyright':
        return this.mockCopyrightScan();
      default:
        return { result: 'clean' };
    }
  }

  private async performMalwareScan(mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing real malware scan');

    if (this.isCircuitOpen('malware')) {
      this.logger.warn('Malware scan circuit breaker OPEN — returning pending status');
      return { result: 'flagged', threatLevel: 'low', categories: ['scan_circuit_open'] };
    }

    this.validateMediaUrl(mediaUrl);

    if (!this.malwareApiConfig.apiKey) {
      this.logger.warn('Malware scan API key not configured, falling back to mock');
      return this.mockMalwareScan();
    }

    try {
      const response = await axios.post(
        `${this.malwareApiConfig.endpoint}/analyse`,
        { url: mediaUrl },
        {
          headers: { 'x-apikey': this.malwareApiConfig.apiKey },
          timeout: this.malwareApiConfig.timeout,
        }
      );

      const data = response.data;
      this.recordSuccess('malware');

      if (data.data.attributes.last_analysis_stats.malicious > 0) {
        return {
          result: 'blocked',
          threatLevel: 'critical',
          categories: ['malware_detected'],
          details: {
            positives: data.data.attributes.last_analysis_stats.malicious,
            total: data.data.attributes.last_analysis_stats.total,
            scanDate: data.data.attributes.last_analysis_date,
          },
        };
      }

      if (data.data.attributes.last_analysis_stats.suspicious > 0) {
        return {
          result: 'flagged',
          threatLevel: 'medium',
          categories: ['suspicious_content'],
          details: {
            suspicious: data.data.attributes.last_analysis_stats.suspicious,
            total: data.data.attributes.last_analysis_stats.total,
          },
        };
      }

      return { result: 'clean' };
    } catch (error) {
      this.recordFailure('malware');
      this.logger.error(`Malware scan failed: ${(error as Error).message}`);
      return this.mockMalwareScan();
    }
  }

  private async performContentSafetyScan(mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing real content safety scan');

    if (this.isCircuitOpen('content_safety')) {
      this.logger.warn('Content safety scan circuit breaker OPEN — returning pending status');
      return { result: 'flagged', threatLevel: 'low', categories: ['scan_circuit_open'] };
    }

    this.validateMediaUrl(mediaUrl);

    if (!this.contentSafetyApiConfig.apiKey) {
      this.logger.warn('Content safety API key not configured, falling back to mock');
      return this.mockContentSafetyScan();
    }

    try {
      const response = await axios.post(
        this.contentSafetyApiConfig.endpoint,
        {
          requests: [
            {
              image: { source: { imageUri: mediaUrl } },
              features: [{ type: 'SAFE_SEARCH_DETECTION' }],
            },
          ],
        },
        {
          headers: { key: this.contentSafetyApiConfig.apiKey },
          timeout: this.contentSafetyApiConfig.timeout,
        }
      );

      const annotations = response.data.responses[0].safeSearchAnnotation;
      this.recordSuccess('content_safety');
      const categories: string[] = [];
      const threatLevels: string[] = [];

      const safetyThreshold = 0.7;

      if (annotations.adult && annotations.adult > safetyThreshold) {
        categories.push('adult_content');
        threatLevels.push('high');
      }
      if (annotations.violence && annotations.violence > safetyThreshold) {
        categories.push('violence');
        threatLevels.push('high');
      }
      if (annotations.racy && annotations.racy > safetyThreshold) {
        categories.push('racy_content');
        threatLevels.push('medium');
      }
      if (annotations.spoof && annotations.spoof > safetyThreshold) {
        categories.push('spoof');
        threatLevels.push('low');
      }
      if (annotations.medical && annotations.medical > safetyThreshold) {
        categories.push('medical_content');
        threatLevels.push('medium');
      }

      if (categories.length > 0) {
        const maxThreatLevel = threatLevels.includes('high')
          ? 'high'
          : threatLevels.includes('medium')
            ? 'medium'
            : 'low';

        if (maxThreatLevel === 'high') {
          return {
            result: 'blocked',
            threatLevel: maxThreatLevel as 'high',
            categories,
            details: {
              model: 'google-safe-search',
              confidence: Math.max(
                ...(Object.values(annotations).filter((v) => typeof v === 'number') as number[])
              ),
            },
          };
        }

        return {
          result: 'flagged',
          threatLevel: maxThreatLevel as 'low' | 'medium',
          categories,
          details: {
            model: 'google-safe-search',
            annotations,
          },
        };
      }

      return { result: 'clean' };
    } catch (error) {
      this.recordFailure('content_safety');
      this.logger.error(`Content safety scan failed: ${(error as Error).message}`);
      return this.mockContentSafetyScan();
    }
  }

  private async performCopyrightScan(mediaUrl: string): Promise<ScanResult> {
    this.logger.debug('Performing real copyright scan');

    if (this.isCircuitOpen('copyright')) {
      this.logger.warn('Copyright scan circuit breaker OPEN — returning pending status');
      return { result: 'flagged', threatLevel: 'low', categories: ['scan_circuit_open'] };
    }

    this.validateMediaUrl(mediaUrl);

    if (!this.copyrightApiConfig.apiKey) {
      this.logger.warn('Copyright API key not configured, falling back to mock');
      return this.mockCopyrightScan();
    }

    try {
      const response = await axios.get(this.copyrightApiConfig.endpoint, {
        params: {
          url: mediaUrl,
          api_key: this.copyrightApiConfig.apiKey,
        },
        timeout: this.copyrightApiConfig.timeout,
      });

      const matches = response.data.matches || [];
      this.recordSuccess('copyright');

      if (matches.length > 0 && matches.some((m: { confidence: number }) => m.confidence > 0.9)) {
        return {
          result: 'blocked',
          threatLevel: 'high',
          categories: ['copyright_infringement'],
          details: {
            matchCount: matches.length,
            highConfidenceMatches: matches.filter((m: { confidence: number }) => m.confidence > 0.9)
              .length,
            matchType: 'fingerprint',
          },
        };
      }

      if (matches.length > 0) {
        return {
          result: 'flagged',
          threatLevel: 'medium',
          categories: ['potential_copyright'],
          details: {
            matchCount: matches.length,
            confidence:
              matches.reduce((acc: number, m: { confidence: number }) => acc + m.confidence, 0) /
              matches.length,
          },
        };
      }

      return { result: 'clean' };
    } catch (error) {
      this.recordFailure('copyright');
      this.logger.error(`Copyright scan failed: ${(error as Error).message}`);
      return this.mockCopyrightScan();
    }
  }

  private mockMalwareScan(): ScanResult {
    this.logger.warn('Malware scan unavailable — content pending manual review');
    return { result: 'flagged', threatLevel: 'low', categories: ['scan_pending'] };
  }

  private mockContentSafetyScan(): ScanResult {
    this.logger.warn('Content safety scan unavailable — content pending manual review');
    return { result: 'flagged', threatLevel: 'low', categories: ['scan_pending'] };
  }

  private mockCopyrightScan(): ScanResult {
    this.logger.warn('Copyright scan unavailable — content pending manual review');
    return { result: 'flagged', threatLevel: 'low', categories: ['scan_pending'] };
  }

  private isCircuitOpen(type: 'malware' | 'content_safety' | 'copyright'): boolean {
    const now = Date.now();
    if (type === 'malware') return now < this.malwareCircuitOpenUntil;
    if (type === 'content_safety') return now < this.contentSafetyCircuitOpenUntil;
    return now < this.copyrightCircuitOpenUntil;
  }

  private recordFailure(type: 'malware' | 'content_safety' | 'copyright'): void {
    const now = Date.now();
    if (type === 'malware') {
      this.malwareFailures++;
      if (this.malwareFailures >= SafetyScanningService.CIRCUIT_BREAKER_THRESHOLD) {
        this.malwareCircuitOpenUntil = now + SafetyScanningService.CIRCUIT_BREAKER_RESET_MS;
        this.logger.warn(
          `Malware scan circuit breaker OPEN — ${this.malwareFailures} consecutive failures`
        );
      }
    } else if (type === 'content_safety') {
      this.contentSafetyFailures++;
      if (this.contentSafetyFailures >= SafetyScanningService.CIRCUIT_BREAKER_THRESHOLD) {
        this.contentSafetyCircuitOpenUntil = now + SafetyScanningService.CIRCUIT_BREAKER_RESET_MS;
        this.logger.warn(
          `Content safety scan circuit breaker OPEN — ${this.contentSafetyFailures} consecutive failures`
        );
      }
    } else {
      this.copyrightFailures++;
      if (this.copyrightFailures >= SafetyScanningService.CIRCUIT_BREAKER_THRESHOLD) {
        this.copyrightCircuitOpenUntil = now + SafetyScanningService.CIRCUIT_BREAKER_RESET_MS;
        this.logger.warn(
          `Copyright scan circuit breaker OPEN — ${this.copyrightFailures} consecutive failures`
        );
      }
    }
  }

  private recordSuccess(type: 'malware' | 'content_safety' | 'copyright'): void {
    if (type === 'malware') this.malwareFailures = 0;
    else if (type === 'content_safety') this.contentSafetyFailures = 0;
    else this.copyrightFailures = 0;
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
