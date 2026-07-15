import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  SupportAnalyticsEvent,
  SupportTicketCreatedEvent,
  RefundProcessedEvent,
  UserSuspendedEvent,
} from './support-analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async trackTicketCreated(data: SupportTicketCreatedEvent): Promise<void> {
    await this.track(SupportAnalyticsEvent.TICKET_CREATED, { ...data });
  }

  async trackRefundProcessed(data: RefundProcessedEvent): Promise<void> {
    await this.track(SupportAnalyticsEvent.REFUND_PROCESSED, { ...data });
  }

  async trackUserSuspended(data: UserSuspendedEvent): Promise<void> {
    await this.track(SupportAnalyticsEvent.USER_SUSPENDED, { ...data });
  }

  async trackUserReinstated(userId: string, suspendedBy: string): Promise<void> {
    await this.track(SupportAnalyticsEvent.USER_REINSTATED, { userId, reinstatedBy: suspendedBy });
  }

  async trackContentRemoved(contentId: string, reason: string): Promise<void> {
    await this.track(SupportAnalyticsEvent.CONTENT_REMOVED, { contentId, reason });
  }

  async trackContentRestored(contentId: string): Promise<void> {
    await this.track(SupportAnalyticsEvent.CONTENT_RESTORED, { contentId });
  }

  async trackAppealApproved(appealId: string, resourceType: string): Promise<void> {
    await this.track(SupportAnalyticsEvent.APPEAL_APPROVED, { appealId, resourceType });
  }

  async trackAppealRejected(appealId: string, reason: string): Promise<void> {
    await this.track(SupportAnalyticsEvent.APPEAL_REJECTED, { appealId, reason });
  }

  private async track(event: string, data: Record<string, unknown>): Promise<void> {
    try {
      await this.prisma.supportAnalyticsEvent.create({
        data: { event, data: data as Record<string, string> },
      });
      this.logger.log(JSON.stringify({ event, data }), 'AnalyticsEvent');
    } catch (error: unknown) {
      this.logger.error(
        `Failed to persist analytics event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getEvents(limit = 100): Promise<Array<{ event: string; data: unknown; createdAt: Date }>> {
    return this.prisma.supportAnalyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }
}
