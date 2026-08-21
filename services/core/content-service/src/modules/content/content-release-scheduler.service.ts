import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { EventBusService, EventTypes } from '@azeebo/event-bus';
import { Inject } from '@nestjs/common';

/**
 * Content Release Scheduler (TAA §21, AZP-CMS-003)
 *
 * Responsibilities:
 * - Auto-publish content when `releaseDate` is reached
 * - Enforce streaming window restrictions (windowType, windowEndDate)
 * - Auto-archive content after window expires
 * - Fire domain events for scheduled publishes
 */
@Injectable()
export class ContentReleaseSchedulerService {
  private readonly logger = new Logger(ContentReleaseSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Optional() @Inject(EventBusService) private readonly eventBus?: EventBusService
  ) {}

  /**
   * Check for draft content whose releaseDate has passed — auto-publish it.
   * Runs every minute.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublishes(): Promise<void> {
    try {
      const now = new Date();

      const readyToPublish = await this.prisma.contentItem.findMany({
        where: {
          status: 'draft',
          releaseDate: { lte: now },
        },
        include: { universe: true },
      });

      if (readyToPublish.length === 0) return;

      this.logger.log(`Publishing ${readyToPublish.length} scheduled content items`);

      for (const item of readyToPublish) {
        try {
          await this.prisma.contentItem.update({
            where: { id: item.id },
            data: {
              status: 'published',
              publishedAt: now,
              updatedAt: now,
            },
            include: { universe: true },
          });

          await this.cache.delete(cacheKey('content', item.id));

          if (this.eventBus) {
            await this.eventBus.publish(EventTypes.CONTENT_PUBLISHED, {
              contentId: item.id,
              creatorId: item.creatorId,
              universeId: item.universeId,
              title: item.title,
              scheduledAt: item.releaseDate?.toISOString(),
            });
          }

          this.logger.log(`Auto-published content: ${item.id} ("${item.title}")`);
        } catch (err) {
          this.logger.error(`Failed to auto-publish content ${item.id}: ${(err as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Scheduled publish check failed: ${(error as Error).message}`);
    }
  }

  /**
   * Auto-archive content whose streaming window has ended.
   * Runs every 15 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleWindowExpiry(): Promise<void> {
    try {
      const now = new Date();

      const expiredContent = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          windowEndDate: { lte: now },
          windowType: { not: 'permanent' },
        },
      });

      if (expiredContent.length === 0) return;

      this.logger.log(`Archiving ${expiredContent.length} expired content items`);

      for (const item of expiredContent) {
        try {
          await this.prisma.contentItem.update({
            where: { id: item.id },
            data: {
              status: 'archived',
              updatedAt: now,
            },
          });

          await this.cache.delete(cacheKey('content', item.id));

          this.logger.log(`Auto-archived content: ${item.id} (window expired)`);
        } catch (err) {
          this.logger.error(`Failed to archive content ${item.id}: ${(err as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Window expiry check failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate release window constraints before publishing.
   */
  validateReleaseWindow(params: {
    releaseDate?: Date | null;
    theatricalReleaseDate?: Date | null;
    streamingReleaseDate?: Date | null;
    windowEndDate?: Date | null;
    windowType?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.releaseDate && params.windowEndDate) {
      if (params.releaseDate >= params.windowEndDate) {
        errors.push('releaseDate must be before windowEndDate');
      }
    }

    if (params.theatricalReleaseDate && params.streamingReleaseDate) {
      if (params.theatricalReleaseDate > params.streamingReleaseDate) {
        errors.push('theatricalReleaseDate must be before streamingReleaseDate');
      }
    }

    if (params.windowType === 'premium' && !params.windowEndDate) {
      errors.push('Premium window type requires a windowEndDate');
    }

    const validWindowTypes = ['standard', 'premium', 'exclusive', 'permanent'];
    if (params.windowType && !validWindowTypes.includes(params.windowType)) {
      errors.push(
        `Invalid windowType: ${params.windowType}. Must be one of: ${validWindowTypes.join(', ')}`
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get content with active streaming windows for a user's region.
   */
  async getAvailableContent(universeId?: string): Promise<string[]> {
    const now = new Date();

    const where: Record<string, unknown> = {
      status: 'published',
      OR: [{ windowEndDate: null }, { windowEndDate: { gt: now } }, { windowType: 'permanent' }],
    };

    if (universeId) {
      where.universeId = universeId;
    }

    const content = await this.prisma.contentItem.findMany({
      where,
      select: { id: true },
    });

    return content.map((c) => c.id);
  }
}
