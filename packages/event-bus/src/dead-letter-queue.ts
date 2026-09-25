import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

// ============================================================================
// Dead Letter Queue (TAA §80)
// ============================================================================

export interface DLQEntry {
  /** Unique identifier for this DLQ entry */
  id: string;
  /** Original event type */
  eventType: string;
  /** Original event payload */
  payload: Record<string, unknown>;
  /** Error that caused the failure */
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retries allowed */
  maxRetries: number;
  /** When the event first failed */
  firstFailedAt: string;
  /** When the event last failed */
  lastFailedAt: string;
  /** Next scheduled retry time */
  nextRetryAt?: string;
  /** Current status */
  status: 'pending' | 'retrying' | 'quarantined' | 'resolved' | 'expired';
  /** Service that owns this event */
  owner: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface DLQStats {
  total: number;
  pending: number;
  retrying: number;
  quarantined: number;
  resolved: number;
  expired: number;
}

export class DeadLetterQueue {
  private readonly logger = new Logger(DeadLetterQueue.name);
  private readonly redis: Redis;
  private readonly prefix: string;
  private readonly baseRetryDelayMs: number;

  constructor(redis: Redis, prefix = 'azeebo:events:dlq', _maxRetries = 3, retryDelayMs = 1000) {
    this.redis = redis;
    this.prefix = prefix;
    this.baseRetryDelayMs = retryDelayMs;
  }

  /**
   * Add a failed event to the DLQ
   */
  async enqueue(
    entry: Omit<DLQEntry, 'id' | 'firstFailedAt' | 'lastFailedAt' | 'retryCount' | 'status'>
  ): Promise<DLQEntry> {
    const id = `dlq:${entry.eventType}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    const dlqEntry: DLQEntry = {
      ...entry,
      id,
      firstFailedAt: now,
      lastFailedAt: now,
      retryCount: 0,
      status: 'pending',
      nextRetryAt: new Date(Date.now() + this.baseRetryDelayMs).toISOString(),
    };

    await this.redis.set(`${this.prefix}:${id}`, JSON.stringify(dlqEntry));

    // Add to pending queue
    await this.redis.zadd(`${this.prefix}:pending`, Date.now(), id);

    // Update stats
    await this.redis.hincrby(`${this.prefix}:stats`, 'total', 1);
    await this.redis.hincrby(`${this.prefix}:stats`, 'pending', 1);

    this.logger.warn(`Event ${entry.eventType} added to DLQ: ${id}`);
    return dlqEntry;
  }

  /**
   * Get entries ready for retry
   */
  async getRetryableEntries(batchSize = 10): Promise<DLQEntry[]> {
    const now = Date.now();
    const entryIds = await this.redis.zrangebyscore(
      `${this.prefix}:pending`,
      0,
      now,
      'LIMIT',
      0,
      batchSize
    );

    const entries: DLQEntry[] = [];
    for (const id of entryIds) {
      const data = await this.redis.get(`${this.prefix}:${id}`);
      if (data) {
        const entry = JSON.parse(data) as DLQEntry;
        if (entry.status === 'pending' || entry.status === 'retrying') {
          entries.push(entry);
        }
      }
    }

    return entries;
  }

  /**
   * Mark an entry as retrying
   */
  async markRetrying(entryId: string): Promise<void> {
    const data = await this.redis.get(`${this.prefix}:${entryId}`);
    if (!data) return;

    const entry = JSON.parse(data) as DLQEntry;
    entry.status = 'retrying';
    entry.retryCount++;
    entry.lastFailedAt = new Date().toISOString();

    const delay = this.baseRetryDelayMs * Math.pow(2, entry.retryCount);
    entry.nextRetryAt = new Date(Date.now() + delay).toISOString();

    await this.redis.set(`${this.prefix}:${entryId}`, JSON.stringify(entry));

    // Move from pending to retrying
    await this.redis.zrem(`${this.prefix}:pending`, entryId);
    await this.redis.zadd(`${this.prefix}:retrying`, Date.now() + delay, entryId);

    // Update stats
    await this.redis.hincrby(`${this.prefix}:stats`, 'pending', -1);
    await this.redis.hincrby(`${this.prefix}:stats`, 'retrying', 1);
  }

  /**
   * Mark an entry as resolved (successfully processed)
   */
  async markResolved(entryId: string): Promise<void> {
    const data = await this.redis.get(`${this.prefix}:${entryId}`);
    if (!data) return;

    const entry = JSON.parse(data) as DLQEntry;
    entry.status = 'resolved';

    await this.redis.set(`${this.prefix}:${entryId}`, JSON.stringify(entry));

    // Remove from retrying/pending
    await this.redis.zrem(`${this.prefix}:pending`, entryId);
    await this.redis.zrem(`${this.prefix}:retrying`, entryId);

    // Update stats
    await this.redis.hincrby(`${this.prefix}:stats`, 'retrying', -1);
    await this.redis.hincrby(`${this.prefix}:stats`, 'resolved', 1);

    this.logger.log(`DLQ entry ${entryId} resolved`);
  }

  /**
   * Quarantine an entry (exceeded max retries)
   */
  async quarantine(entryId: string): Promise<void> {
    const data = await this.redis.get(`${this.prefix}:${entryId}`);
    if (!data) return;

    const entry = JSON.parse(data) as DLQEntry;
    entry.status = 'quarantined';

    await this.redis.set(`${this.prefix}:${entryId}`, JSON.stringify(entry));

    // Remove from retrying/pending
    await this.redis.zrem(`${this.prefix}:pending`, entryId);
    await this.redis.zrem(`${this.prefix}:retrying`, entryId);

    // Add to quarantined set
    await this.redis.sadd(`${this.prefix}:quarantined`, entryId);

    // Update stats
    await this.redis.hincrby(`${this.prefix}:stats`, 'retrying', -1);
    await this.redis.hincrby(`${this.prefix}:stats`, 'quarantined', 1);

    this.logger.error(`DLQ entry ${entryId} quarantined - exceeded max retries`);
  }

  /**
   * Get DLQ statistics
   */
  async getStats(): Promise<DLQStats> {
    const stats = await this.redis.hgetall(`${this.prefix}:stats`);
    return {
      total: parseInt(stats.total || '0'),
      pending: parseInt(stats.pending || '0'),
      retrying: parseInt(stats.retrying || '0'),
      quarantined: parseInt(stats.quarantined || '0'),
      resolved: parseInt(stats.resolved || '0'),
      expired: parseInt(stats.expired || '0'),
    };
  }

  /**
   * Get quarantined entries for investigation
   */
  async getQuarantinedEntries(): Promise<DLQEntry[]> {
    const entryIds = await this.redis.smembers(`${this.prefix}:quarantined`);
    const entries: DLQEntry[] = [];

    for (const id of entryIds) {
      const data = await this.redis.get(`${this.prefix}:${id}`);
      if (data) {
        entries.push(JSON.parse(data));
      }
    }

    return entries;
  }

  /**
   * Manually retry a quarantined entry
   */
  async retryQuarantined(entryId: string): Promise<void> {
    const data = await this.redis.get(`${this.prefix}:${entryId}`);
    if (!data) return;

    const entry = JSON.parse(data) as DLQEntry;
    entry.status = 'pending';
    entry.retryCount = 0;
    entry.nextRetryAt = new Date().toISOString();

    await this.redis.set(`${this.prefix}:${entryId}`, JSON.stringify(entry));

    // Remove from quarantined, add to pending
    await this.redis.srem(`${this.prefix}:quarantined`, entryId);
    await this.redis.zadd(`${this.prefix}:pending`, Date.now(), entryId);

    // Update stats
    await this.redis.hincrby(`${this.prefix}:stats`, 'quarantined', -1);
    await this.redis.hincrby(`${this.prefix}:stats`, 'pending', 1);

    this.logger.log(`DLQ entry ${entryId} queued for retry`);
  }
}
