import {
  OutboxService,
  OutboxStorage,
  OutboxEntry,
  EventPublisher,
} from './outbox.service';

// ============================================================================
// In-Memory Implementations (simulate real infrastructure)
// ============================================================================

/**
 * In-memory outbox storage simulating a database.
 * Tracks all mutations for assertion.
 */
class InMemoryOutboxStorage implements OutboxStorage {
  private entries = new Map<string, OutboxEntry>();
  private autoId = 1;

  async create(data: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    status: string;
    retryCount: number;
    maxRetries: number;
  }): Promise<OutboxEntry> {
    const entry: OutboxEntry = {
      id: `outbox-${this.autoId++}`,
      ...data,
      status: data.status as OutboxEntry['status'],
      createdAt: new Date(),
    };
    this.entries.set(entry.id, entry);
    return entry;
  }

  async findPending(limit: number): Promise<OutboxEntry[]> {
    return Array.from(this.entries.values())
      .filter((e) => e.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
  }

  async updateStatus(id: string, status: string, publishedAt?: Date): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.status = status as OutboxEntry['status'];
      if (publishedAt) entry.publishedAt = publishedAt;
    }
  }

  async incrementRetry(id: string, error: string): Promise<void> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.retryCount++;
      entry.lastError = error;
      if (entry.retryCount >= entry.maxRetries) {
        entry.status = 'failed';
      }
    }
  }

  // Test helpers
  getEntry(id: string): OutboxEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): OutboxEntry[] {
    return Array.from(this.entries.values());
  }

  getEntryCount(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
    this.autoId = 1;
  }
}

/**
 * In-memory event publisher that tracks published events.
 * Can be configured to fail for specific event types.
 */
class InMemoryEventPublisher implements EventPublisher {
  publishedEvents: Array<{
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  failEventTypes = new Set<string>();
  failCount = 0;

  async publish(
    eventType: string,
    payload: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (this.failEventTypes.has(eventType)) {
      this.failCount++;
      throw new Error(`Simulated failure for event type: ${eventType}`);
    }

    this.publishedEvents.push({
      eventType,
      payload,
      metadata,
      timestamp: new Date(),
    });
  }

  shouldFail(eventType: string): void {
    this.failEventTypes.add(eventType);
  }

  shouldStopFailing(eventType: string): void {
    this.failEventTypes.delete(eventType);
  }

  clear(): void {
    this.publishedEvents = [];
    this.failEventTypes.clear();
    this.failCount = 0;
  }

  getEventsByType(eventType: string): typeof this.publishedEvents {
    return this.publishedEvents.filter((e) => e.eventType === eventType);
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Outbox Pattern Integration', () => {
  let outboxService: OutboxService;
  let storage: InMemoryOutboxStorage;
  let publisher: InMemoryEventPublisher;

  beforeEach(() => {
    storage = new InMemoryOutboxStorage();
    publisher = new InMemoryEventPublisher();
    outboxService = new OutboxService(storage, publisher);
  });

  // ==========================================================================
  // Atomicity: Business state + outbox in same transaction
  // ==========================================================================

  describe('Transactional Atomicity', () => {
    it('should create outbox entry alongside business state (simulated)', async () => {
      // Simulate a business transaction: create user + outbox entry atomically
      const userId = 'user-123';
      const userName = 'Alice';

      // In real code, this would be inside a Prisma transaction:
      // await prisma.$transaction(async (tx) => {
      //   await tx.user.create({ data: { id: userId, name: userName } });
      //   await outboxService.createOutboxEntry(...);
      // });

      const outboxEntry = await outboxService.createOutboxEntry(
        'user',
        userId,
        'user.created',
        { id: userId, name: userName },
        { correlationId: 'txn-001' },
      );

      // Verify entry was created with correct data
      expect(outboxEntry.id).toBeDefined();
      expect(outboxEntry.status).toBe('pending');
      expect(outboxEntry.eventType).toBe('user.created');
      expect(outboxEntry.payload).toEqual({ id: userId, name: userName });
      expect(outboxEntry.metadata?.correlationId).toBe('txn-001');

      // Verify it's stored and findable
      const stored = storage.getEntry(outboxEntry.id);
      expect(stored).toBeDefined();
      expect(stored!.status).toBe('pending');
    });

    it('should not publish until explicitly triggered (no dual-write)', async () => {
      // Create outbox entry — should NOT auto-publish
      await outboxService.createOutboxEntry('content', 'c1', 'content.published', {
        id: 'c1',
        title: 'My Post',
      });

      // Verify nothing was published yet
      expect(publisher.publishedEvents).toHaveLength(0);

      // Verify entry is pending
      const pending = await storage.findPending(10);
      expect(pending).toHaveLength(1);
    });

    it('should handle multiple outbox entries from one transaction', async () => {
      // Simulate creating multiple events in one transaction
      const entries = await Promise.all([
        outboxService.createOutboxEntry('user', 'u1', 'user.created', { name: 'Alice' }),
        outboxService.createOutboxEntry('wallet', 'w1', 'wallet.funded', { amount: 1000 }),
        outboxService.createOutboxEntry('notification', 'n1', 'notification.sent', {
          template: 'welcome',
        }),
      ]);

      expect(entries).toHaveLength(3);
      expect(entries.every((e) => e.status === 'pending')).toBe(true);

      // All should be pending
      const pending = await storage.findPending(10);
      expect(pending).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Publishing: Outbox → Event Bus flow
  // ==========================================================================

  describe('Event Publishing', () => {
    it('should publish pending entry and mark as published', async () => {
      const entry = await outboxService.createOutboxEntry(
        'content',
        'c1',
        'content.published',
        { id: 'c1', title: 'Article' },
      );

      const result = await outboxService.publishEntry(entry.id);

      expect(result.success).toBe(true);
      expect(result.entryId).toBe(entry.id);

      // Verify event was published to the bus
      expect(publisher.publishedEvents).toHaveLength(1);
      expect(publisher.publishedEvents[0].eventType).toBe('content.published');
      expect(publisher.publishedEvents[0].payload).toEqual({ id: 'c1', title: 'Article' });

      // Verify entry is now marked as published
      const stored = storage.getEntry(entry.id);
      expect(stored!.status).toBe('published');
      expect(stored!.publishedAt).toBeDefined();
    });

    it('should publish batch of pending entries in order', async () => {
      // Create entries in sequence
      const e1 = await outboxService.createOutboxEntry('user', 'u1', 'user.created', { seq: 1 });
      const e2 = await outboxService.createOutboxEntry('user', 'u1', 'user.updated', { seq: 2 });
      const e3 = await outboxService.createOutboxEntry('content', 'c1', 'content.published', {
        seq: 3,
      });

      const results = await outboxService.publishPendingEntries(10);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify events were published in order
      expect(publisher.publishedEvents).toHaveLength(3);
      expect(publisher.publishedEvents[0].eventType).toBe('user.created');
      expect(publisher.publishedEvents[1].eventType).toBe('user.updated');
      expect(publisher.publishedEvents[2].eventType).toBe('content.published');

      // All entries should be marked as published
      expect(storage.getEntry(e1.id)!.status).toBe('published');
      expect(storage.getEntry(e2.id)!.status).toBe('published');
      expect(storage.getEntry(e3.id)!.status).toBe('published');
    });

    it('should pass metadata through to published event', async () => {
      const metadata = {
        correlationId: 'corr-abc',
        causationId: 'event-xyz',
        userId: 'admin-1',
      };

      const entry = await outboxService.createOutboxEntry(
        'moderation',
        'm1',
        'content.moderated',
        { contentId: 'c1', action: 'approved' },
        metadata,
      );

      await outboxService.publishEntry(entry.id);

      expect(publisher.publishedEvents[0].metadata).toEqual(metadata);
    });

    it('should respect batch size limit', async () => {
      // Create 5 entries
      for (let i = 0; i < 5; i++) {
        await outboxService.createOutboxEntry('item', `i${i}`, 'item.created', { i });
      }

      // Publish with batch size of 2
      const results = await outboxService.publishPendingEntries(2);

      expect(results).toHaveLength(2);
      expect(publisher.publishedEvents).toHaveLength(2);

      // 3 entries should still be pending
      const remaining = await storage.findPending(10);
      expect(remaining).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Error Handling: Retry and Failure
  // ==========================================================================

  describe('Error Handling & Retry', () => {
    it('should increment retry count on publish failure', async () => {
      const entry = await outboxService.createOutboxEntry(
        'payment',
        'p1',
        'payment.success',
        { amount: 5000 },
      );

      // Make publisher fail for this event type
      publisher.shouldFail('payment.success');

      const result = await outboxService.publishEntry(entry.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Simulated failure');

      // Verify retry was incremented
      const stored = storage.getEntry(entry.id);
      expect(stored!.retryCount).toBe(1);
      expect(stored!.lastError).toContain('Simulated failure');
    });

    it('should mark entry as failed after max retries exhausted', async () => {
      const entry = await outboxService.createOutboxEntry(
        'payment',
        'p1',
        'payment.success',
        { amount: 5000 },
      );

      publisher.shouldFail('payment.success');

      // Fail 3 times (maxRetries = 3)
      await outboxService.publishEntry(entry.id); // retryCount: 1
      await outboxService.publishEntry(entry.id); // retryCount: 2
      await outboxService.publishEntry(entry.id); // retryCount: 3 → status: failed

      const stored = storage.getEntry(entry.id);
      expect(stored!.retryCount).toBe(3);
      expect(stored!.status).toBe('failed');
    });

    it('should not retry already-published entries', async () => {
      const entry = await outboxService.createOutboxEntry(
        'user',
        'u1',
        'user.created',
        { name: 'Alice' },
      );

      // Publish successfully
      await outboxService.publishEntry(entry.id);
      expect(publisher.publishedEvents).toHaveLength(1);

      // Try to publish again — should fail (not found in pending)
      const result = await outboxService.publishEntry(entry.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');

      // Should not have published twice
      expect(publisher.publishedEvents).toHaveLength(1);
    });

    it('should recover after publisher stops failing', async () => {
      const entry = await outboxService.createOutboxEntry(
        'payment',
        'p1',
        'payment.success',
        { amount: 1000 },
      );

      // Fail once
      publisher.shouldFail('payment.success');
      await outboxService.publishEntry(entry.id);
      expect(storage.getEntry(entry.id)!.retryCount).toBe(1);

      // Stop failing
      publisher.shouldStopFailing('payment.success');

      // Should succeed now
      const result = await outboxService.publishEntry(entry.id);
      expect(result.success).toBe(true);
      expect(storage.getEntry(entry.id)!.status).toBe('published');
    });
  });

  // ==========================================================================
  // Concurrent Publishing
  // ==========================================================================

  describe('Concurrent Publishing', () => {
    it('should handle concurrent batch publishes without duplicate delivery', async () => {
      // Create 10 entries
      const entries = [];
      for (let i = 0; i < 10; i++) {
        entries.push(
          await outboxService.createOutboxEntry('item', `i${i}`, 'item.created', { i }),
        );
      }

      // Publish in two concurrent batches
      const [results1, results2] = await Promise.all([
        outboxService.publishPendingEntries(5),
        outboxService.publishPendingEntries(5),
      ]);

      // All entries should be published
      const allResults = [...results1, ...results2];
      const successCount = allResults.filter((r) => r.success).length;
      expect(successCount).toBe(10);

      // Each event should be published exactly once
      expect(publisher.publishedEvents).toHaveLength(10);
    });
  });

  // ==========================================================================
  // Batch Publishing with Mixed Results
  // ==========================================================================

  describe('Batch Publishing with Mixed Results', () => {
    it('should handle batch with some successes and some failures', async () => {
      // Create entries — payment first so it's picked up early
      const ePay = await outboxService.createOutboxEntry('payment', 'p1', 'payment.success', {});
      const eUser = await outboxService.createOutboxEntry('user', 'u1', 'user.created', {});
      const eContent = await outboxService.createOutboxEntry('content', 'c1', 'content.published', {});

      // Make only payment fail
      publisher.shouldFail('payment.success');

      const results = await outboxService.publishPendingEntries(10);

      // payment should fail, others should succeed
      const failedResults = results.filter((r) => !r.success);
      const successResults = results.filter((r) => r.success);
      expect(failedResults).toHaveLength(1);
      expect(successResults).toHaveLength(2);

      // Only 2 events should be published (not payment)
      expect(publisher.publishedEvents).toHaveLength(2);
      expect(publisher.getEventsByType('payment.success')).toHaveLength(0);

      // payment entry should still be pending with retry incremented
      expect(storage.getEntry(ePay.id)!.status).toBe('pending');
      expect(storage.getEntry(ePay.id)!.retryCount).toBe(1);

      // user and content should be published
      expect(storage.getEntry(eUser.id)!.status).toBe('published');
      expect(storage.getEntry(eContent.id)!.status).toBe('published');
    });
  });

  // ==========================================================================
  // Statistics
  // ==========================================================================

  describe('Outbox Statistics', () => {
    it('should track pending entries', async () => {
      await outboxService.createOutboxEntry('user', 'u1', 'user.created', {});
      await outboxService.createOutboxEntry('user', 'u2', 'user.created', {});
      await outboxService.createOutboxEntry('content', 'c1', 'content.published', {});

      const stats = await outboxService.getStats();
      expect(stats.pending).toBe(3);
      expect(stats.total).toBe(3);
    });

    it('should decrease pending count after publishing', async () => {
      const e1 = await outboxService.createOutboxEntry('user', 'u1', 'user.created', {});
      await outboxService.createOutboxEntry('user', 'u2', 'user.created', {});

      await outboxService.publishEntry(e1.id);

      const stats = await outboxService.getStats();
      expect(stats.pending).toBe(1);
    });
  });

  // ==========================================================================
  // End-to-End Scenario: User Registration Flow
  // ==========================================================================

  describe('E2E: User Registration Flow', () => {
    it('should create user, fund wallet, and send welcome notification atomically', async () => {
      // Step 1: Simulate user registration transaction
      const userId = 'user-new-001';
      const userName = 'Alice';

      // In real code: prisma.$transaction(async (tx) => { ... })
      await Promise.all([
        outboxService.createOutboxEntry('user', userId, 'user.created', {
          id: userId,
          name: userName,
          email: 'alice@example.com',
        }),
        outboxService.createOutboxEntry('wallet', userId, 'wallet.funded', {
          userId,
          amount: 500,
          currency: 'NGN',
          source: 'signup_bonus',
        }),
        outboxService.createOutboxEntry('notification', userId, 'notification.sent', {
          userId,
          template: 'welcome',
          channel: 'email',
        }),
      ]);

      // Step 2: Verify all entries are pending
      const pending = await storage.findPending(10);
      expect(pending).toHaveLength(3);

      // Step 3: Process outbox (simulating a cron job)
      const results = await outboxService.publishPendingEntries(10);

      // Step 4: Verify all published successfully
      expect(results.every((r) => r.success)).toBe(true);
      expect(publisher.publishedEvents).toHaveLength(3);

      // Step 5: Verify event types and payloads
      const userEvents = publisher.getEventsByType('user.created');
      expect(userEvents).toHaveLength(1);
      expect(userEvents[0].payload).toEqual(
        expect.objectContaining({ id: userId, name: userName }),
      );

      const walletEvents = publisher.getEventsByType('wallet.funded');
      expect(walletEvents).toHaveLength(1);
      expect(walletEvents[0].payload).toEqual(
        expect.objectContaining({ amount: 500, currency: 'NGN' }),
      );

      const notificationEvents = publisher.getEventsByType('notification.sent');
      expect(notificationEvents).toHaveLength(1);
      expect(notificationEvents[0].payload).toEqual(
        expect.objectContaining({ template: 'welcome' }),
      );
    });
  });
});
