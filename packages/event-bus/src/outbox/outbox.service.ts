import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Transactional Outbox Pattern (TAA §15, ADR-006)
// ============================================================================

export interface OutboxEntry {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'published' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  publishedAt?: Date;
  lastError?: string;
}

export interface OutboxPublishResult {
  success: boolean;
  entryId: string;
  error?: string;
}

/**
 * Abstract outbox storage interface - services implement this to use the outbox pattern.
 * This avoids direct dependency on Prisma in the event-bus package.
 */
export interface OutboxStorage {
  create(data: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    status: string;
    retryCount: number;
    maxRetries: number;
  }): Promise<OutboxEntry>;
  findPending(limit: number): Promise<OutboxEntry[]>;
  updateStatus(id: string, status: string, publishedAt?: Date): Promise<void>;
  incrementRetry(id: string, error: string): Promise<void>;
}

/**
 * Abstract event publisher interface - decouples from Redis implementation.
 */
export interface EventPublisher {
  publish(
    eventType: string,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly storage: OutboxStorage,
    private readonly publisher: EventPublisher
  ) {}

  /**
   * Create an outbox entry within a transaction.
   * This should be called within the same transaction as the business state change.
   */
  async createOutboxEntry(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<OutboxEntry> {
    this.logger.debug(`Creating outbox entry for ${aggregateType}:${aggregateId} - ${eventType}`);

    return this.storage.create({
      aggregateType,
      aggregateId,
      eventType,
      payload,
      metadata,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
    });
  }

  /**
   * Publish pending outbox entries.
   * This is typically called by a scheduled job or event processor.
   */
  async publishPendingEntries(batchSize = 100): Promise<OutboxPublishResult[]> {
    const results: OutboxPublishResult[] = [];

    const pendingEntries = await this.storage.findPending(batchSize);

    for (const entry of pendingEntries) {
      const result = await this.publishEntry(entry.id);
      results.push(result);
    }

    this.logger.log(
      `Published ${results.filter((r) => r.success).length}/${results.length} outbox entries`
    );
    return results;
  }

  /**
   * Publish a single outbox entry
   */
  async publishEntry(entryId: string): Promise<OutboxPublishResult> {
    try {
      const pendingEntries = await this.storage.findPending(1);
      const entry = pendingEntries.find((e) => e.id === entryId);

      if (!entry) {
        return { success: false, entryId, error: 'Entry not found or already published' };
      }

      // Publish via event publisher
      await this.publisher.publish(entry.eventType, entry.payload, entry.metadata);

      // Mark as published
      await this.storage.updateStatus(entryId, 'published', new Date());

      this.logger.debug(`Published outbox entry ${entryId}: ${entry.eventType}`);
      return { success: true, entryId };
    } catch (error) {
      this.logger.error(`Failed to publish outbox entry ${entryId}: ${(error as Error).message}`);

      // Update retry count
      await this.storage.incrementRetry(entryId, (error as Error).message);

      return { success: false, entryId, error: (error as Error).message };
    }
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<{
    pending: number;
    published: number;
    failed: number;
    total: number;
  }> {
    const pendingEntries = await this.storage.findPending(10000);
    return {
      pending: pendingEntries.length,
      published: 0, // Would need additional storage methods
      failed: 0,
      total: pendingEntries.length,
    };
  }
}
