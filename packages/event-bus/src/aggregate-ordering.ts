import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

// ============================================================================
// Aggregate Ordering (TAA §80)
// ============================================================================

export interface OrderedEvent {
  /** Event ID */
  eventId: string;
  /** Aggregate identifier (e.g., user ID, content ID) */
  aggregateId: string;
  /** Aggregate type (e.g., "user", "content", "payment") */
  aggregateType: string;
  /** Sequence number within the aggregate */
  sequenceNumber: number;
  /** Event type */
  eventType: string;
  /** Event payload */
  payload: Record<string, unknown>;
  /** Timestamp when event occurred */
  occurredAt: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface OutOfOrderResult {
  /** Whether the event is out of order */
  outOfOrder: boolean;
  /** Expected sequence number */
  expectedSequence: number;
  /** Actual sequence number */
  actualSequence: number;
  /** Events that were skipped (if any) */
  skippedEvents: OrderedEvent[];
}

export class AggregateOrdering {
  private readonly logger = new Logger(AggregateOrdering.name);
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(redis: Redis, prefix = 'azeebo:events:ordering') {
    this.redis = redis;
    this.prefix = prefix;
  }

  /**
   * Get the next sequence number for an aggregate
   */
  async getNextSequence(aggregateId: string): Promise<number> {
    const key = `${this.prefix}:seq:${aggregateId}`;
    const current = await this.redis.get(key);
    const nextSequence = (current ? parseInt(current) : 0) + 1;
    await this.redis.set(key, nextSequence.toString());
    return nextSequence;
  }

  /**
   * Get the current sequence number for an aggregate
   */
  async getCurrentSequence(aggregateId: string): Promise<number> {
    const key = `${this.prefix}:seq:${aggregateId}`;
    const current = await this.redis.get(key);
    return current ? parseInt(current) : 0;
  }

  /**
   * Check if an event is out of order
   */
  async checkOutOfOrder(event: OrderedEvent): Promise<OutOfOrderResult> {
    const currentSequence = await this.getCurrentSequence(event.aggregateId);
    const expectedSequence = currentSequence + 1;

    const outOfOrder = event.sequenceNumber !== expectedSequence;

    let skippedEvents: OrderedEvent[] = [];

    if (outOfOrder && event.sequenceNumber > expectedSequence) {
      // Check for skipped events
      const skippedSequenceRange = `${expectedSequence}:${event.sequenceNumber - 1}`;
      const skippedIds = await this.redis.lrange(
        `${this.prefix}:skipped:${event.aggregateId}:${skippedSequenceRange}`,
        0,
        -1
      );

      skippedEvents = skippedIds.map((id) => ({
        eventId: id,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        sequenceNumber: 0, // Will be filled from storage
        eventType: 'unknown',
        payload: {},
        occurredAt: new Date().toISOString(),
      }));
    }

    return {
      outOfOrder,
      expectedSequence,
      actualSequence: event.sequenceNumber,
      skippedEvents,
    };
  }

  /**
   * Store an event in order
   */
  async storeEvent(event: OrderedEvent): Promise<void> {
    const key = `${this.prefix}:events:${event.aggregateId}:${event.sequenceNumber}`;
    await this.redis.set(key, JSON.stringify(event));

    // Add to aggregate's event list
    await this.redis.lpush(`${this.prefix}:list:${event.aggregateId}`, event.eventId);

    this.logger.debug(
      `Stored event ${event.eventId} for aggregate ${event.aggregateId} at sequence ${event.sequenceNumber}`
    );
  }

  /**
   * Get events for an aggregate in sequence order
   */
  async getAggregateEvents(
    aggregateId: string,
    fromSequence = 1,
    toSequence?: number
  ): Promise<OrderedEvent[]> {
    const events: OrderedEvent[] = [];
    const limit = toSequence || (await this.getCurrentSequence(aggregateId));

    for (let seq = fromSequence; seq <= limit; seq++) {
      const key = `${this.prefix}:events:${aggregateId}:${seq}`;
      const data = await this.redis.get(key);
      if (data) {
        events.push(JSON.parse(data));
      }
    }

    return events;
  }

  /**
   * Detect gaps in event sequence
   */
  async detectGaps(aggregateId: string): Promise<number[]> {
    const currentSequence = await this.getCurrentSequence(aggregateId);
    const gaps: number[] = [];

    for (let seq = 1; seq <= currentSequence; seq++) {
      const key = `${this.prefix}:events:${aggregateId}:${seq}`;
      const exists = await this.redis.exists(key);
      if (!exists) {
        gaps.push(seq);
      }
    }

    return gaps;
  }

  /**
   * Replay events for an aggregate from a specific sequence
   */
  async replayFromSequence(aggregateId: string, fromSequence: number): Promise<OrderedEvent[]> {
    this.logger.log(`Replaying events for aggregate ${aggregateId} from sequence ${fromSequence}`);

    const events = await this.getAggregateEvents(aggregateId, fromSequence);

    // Mark as replay
    for (const event of events) {
      event.metadata = {
        ...event.metadata,
        replay: true,
        replayedAt: new Date().toISOString(),
      };
    }

    return events;
  }
}
