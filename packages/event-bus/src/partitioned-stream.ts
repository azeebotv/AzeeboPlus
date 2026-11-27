import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import type { Cluster } from 'ioredis';
import { DomainEvent } from './index.js';

export type RedisClient = Redis | Cluster;

/**
 * High-velocity partitioned streaming utilities for Azeebo+ Event Bus.
 * Designed for high-throughput live broadcasts (reality TV voting, live chat, tipping).
 * Uses Redis cluster-safe hash tags `{p_<index>}` ensuring even shard distribution.
 */
export class PartitionedStreamManager {
  private static readonly logger = new Logger(PartitionedStreamManager.name);

  /**
   * Deterministic 32-bit FNV-1a hash to map keys uniformly across partitions.
   */
  static getPartition(key: string, numPartitions = 8): number {
    if (numPartitions <= 1) return 0;
    let hash = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return Math.abs(hash % numPartitions);
  }

  /**
   * Formats a Redis Cluster-safe channel key using `{p_<index>}` hashtag.
   * This guarantees all keys within the partition land on the same Redis cluster node.
   */
  static getPartitionChannel(prefix: string, eventType: string, partition: number): string {
    return `${prefix}:${eventType}:{p_${partition}}`;
  }

  /**
   * Publishes an event to a partitioned channel.
   */
  static async publishPartitioned<T = Record<string, unknown>>(
    publisher: RedisClient,
    prefix: string,
    eventType: string,
    partitionKey: string,
    event: DomainEvent<T>,
    numPartitions = 8
  ): Promise<{ partition: number; channel: string }> {
    const partition = this.getPartition(partitionKey, numPartitions);
    const channel = this.getPartitionChannel(prefix, eventType, partition);
    const message = JSON.stringify({
      ...event,
      metadata: {
        ...event.metadata,
        partition,
        partitionKey,
      },
    });

    await publisher.publish(channel, message);
    this.logger.debug(
      `Published partitioned event ${eventType} to ${channel} (key: ${partitionKey})`
    );
    return { partition, channel };
  }
}

export interface QueuedVote {
  showId: string;
  contestantId: string;
  quantity: number;
  userId: string;
  timestamp: number;
}

export interface VoteAggregation {
  showId: string;
  contestantId: string;
  totalVotes: number;
  uniqueVoters: Set<string>;
}

export interface VoteBatchFlushResult {
  flushedCount: number;
  aggregations: Array<{
    showId: string;
    contestantId: string;
    totalVotes: number;
    voterCount: number;
  }>;
}

/**
 * High-Velocity In-Memory / Redis Vote Buffer.
 * Aggregates high-frequency votes during live shows and flushes them in batches,
 * reducing database write pressure by up to 98% during live elimination finales.
 */
export class HighVelocityVoteBuffer {
  private readonly logger = new Logger(HighVelocityVoteBuffer.name);
  private buffer: Map<string, VoteAggregation> = new Map();
  private count = 0;
  private readonly maxBufferSize: number;
  private readonly flushIntervalMs: number;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onFlushCallback?: (result: VoteBatchFlushResult) => Promise<void>;

  constructor(options?: {
    maxBufferSize?: number;
    flushIntervalMs?: number;
    onFlush?: (result: VoteBatchFlushResult) => Promise<void>;
  }) {
    this.maxBufferSize = options?.maxBufferSize ?? 500;
    this.flushIntervalMs = options?.flushIntervalMs ?? 1000;
    this.onFlushCallback = options?.onFlush;

    if (this.onFlushCallback && this.flushIntervalMs > 0) {
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.logger.error(`Automated vote flush failed: ${err.message}`);
      });
    }, this.flushIntervalMs);
  }

  /**
   * Enqueues a vote into the buffer with instant in-memory aggregation.
   */
  recordVote(showId: string, contestantId: string, quantity = 1, userId: string): void {
    const key = `${showId}:${contestantId}`;
    const existing = this.buffer.get(key);

    if (existing) {
      existing.totalVotes += quantity;
      existing.uniqueVoters.add(userId);
    } else {
      this.buffer.set(key, {
        showId,
        contestantId,
        totalVotes: quantity,
        uniqueVoters: new Set([userId]),
      });
    }

    this.count += quantity;

    if (this.count >= this.maxBufferSize) {
      this.flush().catch((err) => {
        this.logger.error(`Threshold vote flush failed: ${err.message}`);
      });
    }
  }

  /**
   * Returns current pending tally without draining the buffer.
   */
  getPendingTally(showId: string, contestantId: string): number {
    const key = `${showId}:${contestantId}`;
    return this.buffer.get(key)?.totalVotes ?? 0;
  }

  /**
   * Current total count of votes pending in buffer.
   */
  get pendingCount(): number {
    return this.count;
  }

  /**
   * Flushes and drains the vote buffer, executing the batch handler.
   */
  async flush(): Promise<VoteBatchFlushResult> {
    if (this.buffer.size === 0) {
      return { flushedCount: 0, aggregations: [] };
    }

    const currentBuffer = this.buffer;
    const currentCount = this.count;

    // Reset buffer immediately to capture incoming concurrent writes
    this.buffer = new Map();
    this.count = 0;

    const aggregations: VoteBatchFlushResult['aggregations'] = [];

    for (const item of currentBuffer.values()) {
      aggregations.push({
        showId: item.showId,
        contestantId: item.contestantId,
        totalVotes: item.totalVotes,
        voterCount: item.uniqueVoters.size,
      });
    }

    const result: VoteBatchFlushResult = {
      flushedCount: currentCount,
      aggregations,
    };

    if (this.onFlushCallback) {
      await this.onFlushCallback(result);
    }

    this.logger.log(
      `Flushed ${currentCount} buffered votes across ${aggregations.length} contestants`
    );
    return result;
  }

  /**
   * Cleanly disposes timer and flushes any pending votes.
   */
  async dispose(): Promise<VoteBatchFlushResult> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    return this.flush();
  }
}
