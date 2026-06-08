import { Injectable, Logger } from '@nestjs/common';
import {
  SupportAnalyticsEvent,
  SupportTicketCreatedEvent,
  RefundProcessedEvent,
  UserSuspendedEvent,
} from './support-analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private events: Array<{ event: string; data: Record<string, unknown>; timestamp: Date }> = [];

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
    const eventRecord = { event, data, timestamp: new Date() };
    this.events.push(eventRecord);
    this.logger.log(JSON.stringify(eventRecord), 'AnalyticsEvent');
  }

  getEvents() {
    return this.events;
  }
}
