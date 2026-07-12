import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import axios from 'axios';

type ModerationStatusResult = {
  reports: number;
  openReports: number;
  moderationCases: number;
  currentStatus: string;
};

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly moderationServiceUrl: string;
  private readonly safetyScanEnabled: boolean;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.moderationServiceUrl = this.configService.get<string>(
      'MODERATION_SERVICE_URL',
      'http://moderation-service:3022'
    );
    this.safetyScanEnabled = this.configService.get<boolean>('SAFETY_SCAN_ENABLED', true);
  }

  async checkContentSafety(
    contentId: string
  ): Promise<{ isSafe: boolean; issues: string[]; scanId?: string }> {
    if (!this.safetyScanEnabled) {
      this.logger.warn('Safety scanning is disabled, skipping safety check');
      return { isSafe: true, issues: ['safety_scan_disabled'] };
    }

    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
        include: { mediaAsset: true },
      });

      if (!content?.mediaAsset?.originalUrl) {
        this.logger.warn(`No media asset found for content ${contentId}, skipping scan`);
        return { isSafe: true, issues: ['no_media_asset'] };
      }

      const response = await axios.post(
        `${this.moderationServiceUrl}/api/moderation/scan`,
        {
          contentId,
          mediaUrl: content.mediaAsset.originalUrl,
          scanTypes: ['malware', 'content_safety'],
        },
        { timeout: 10000 }
      );

      const result = response.data;

      if (!result.success) {
        return { isSafe: false, issues: ['Safety scan failed'], scanId: result.data?.scanId };
      }

      const scanResult = result.data;

      if (scanResult.result === 'blocked') {
        return {
          isSafe: false,
          issues: [`Content blocked due to: ${scanResult.threatLevel || 'safety concerns'}`],
          scanId: scanResult.scanId,
        };
      }

      if (scanResult.result === 'flagged') {
        return {
          isSafe: false,
          issues: [`Content flagged: ${scanResult.threatLevel || 'potential issue'}`],
          scanId: scanResult.scanId,
        };
      }

      return { isSafe: true, issues: [], scanId: scanResult.scanId };
    } catch (error) {
      this.logger.error(`Safety scan failed for content ${contentId}: ${(error as Error).message}`);
      throw new BadRequestException('Safety scan failed, please try again later');
    }
  }

  async scanContentForSafety(contentId: string): Promise<{
    success: boolean;
    data: { scanId: string; result: string; threatLevel?: string; categories?: string[] };
  }> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      include: { mediaAsset: true },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!content.mediaAsset?.originalUrl) {
      throw new BadRequestException('Content has no media asset to scan');
    }

    try {
      const response = await axios.post(
        `${this.moderationServiceUrl}/api/moderation/scan`,
        {
          contentId,
          mediaUrl: content.mediaAsset.originalUrl,
          scanTypes: ['malware', 'content_safety'],
        },
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Safety scan failed for content ${contentId}: ${(error as Error).message}`);
      throw new BadRequestException('Safety scan failed, please try again later');
    }
  }

  async reportContent(
    userId: string,
    contentId: string,
    reportData: {
      type: string;
      reason: string;
    }
  ): Promise<{ success: boolean; data: { reportId: string; message: string } }> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    try {
      const response = await fetch(`${this.moderationServiceUrl}/moderation/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportingUserId: userId,
          type: reportData.type,
          contentId,
          reason: reportData.reason,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Moderation service returned ${response.status} for content report`);
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          reportId: result.data?.reportId || `report_${Date.now()}`,
          message: 'Content reported successfully',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to report content to moderation service: ${(error as Error).message}`
      );
      throw new BadRequestException('Failed to submit report. Please try again later.');
    }
  }

  async getContentModerationStatus(contentId: string): Promise<{
    success: boolean;
    data: ModerationStatusResult;
  }> {
    try {
      const response = await fetch(
        `${this.moderationServiceUrl}/moderation/content/${contentId}/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: {
              reports: 0,
              openReports: 0,
              moderationCases: 0,
              currentStatus: 'none',
            },
          };
        }
        this.logger.warn(`Moderation service returned ${response.status} for status check`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      this.logger.error(`Failed to get moderation status: ${(error as Error).message}`);
      return {
        success: true,
        data: {
          reports: 0,
          openReports: 0,
          moderationCases: 0,
          currentStatus: 'unknown',
        },
      };
    }
  }
}
