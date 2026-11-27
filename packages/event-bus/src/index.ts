import {
  Logger,
  Module,
  Global,
  DynamicModule,
  Provider,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';
import { randomUUID } from 'crypto';
import { EventSchemaRegistry } from './schema-registry.js';
import { DeadLetterQueue } from './dead-letter-queue.js';
import { AggregateOrdering, OrderedEvent } from './aggregate-ordering.js';
import {
  PartitionedStreamManager,
  HighVelocityVoteBuffer,
  RedisClient,
  VoteBatchFlushResult,
} from './partitioned-stream.js';

export { PartitionedStreamManager, HighVelocityVoteBuffer, RedisClient, VoteBatchFlushResult };

// ============================================================================
// Event Types
// ============================================================================

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: T;
  metadata?: {
    userId?: string;
    correlationId?: string;
    [key: string]: unknown;
  };
}

export type EventHandler<T = Record<string, unknown>> = (event: DomainEvent<T>) => Promise<void>;

export interface EventBusConfig {
  redisUrl?: string;
  clusterNodes?: Array<{ host: string; port: number }> | string[];
  sentinels?: Array<{ host: string; port: number }>;
  sentinelMaster?: string;
  isCluster?: boolean;
  prefix?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  /**
   * Per-event consumer toggle, typically backed by the `events_consume_*`
   * feature flags: `(eventType) => featureFlagService.isEnabled('events_consume_' + eventType)`.
   * When the resolver returns false, messages for that event type are skipped
   * (logged + acknowledged) so a flipped flag pauses consumption without loss.
   * Absent, all events are consumed (backwards compatible).
   */
  consumerToggle?: (eventType: string) => Promise<boolean>;
}

/** Canonical per-event consumption flag key, e.g. `events_consume_user.created`. */
export const eventConsumeFlagKey = (eventType: string): string => `events_consume_${eventType}`;

// ============================================================================
// Pre-defined Event Types
// ============================================================================

export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ERASURE_REQUESTED: 'user.erasure.requested',
  USER_ERASURE_COMPLETED: 'user.erasure.completed',

  // Wallet events
  WALLET_FUNDED: 'wallet.funded',
  WALLET_DEBITED: 'wallet.debited',
  WALLET_TRANSFERRED: 'wallet.transferred',

  // Content events
  CONTENT_CREATED: 'content.created',
  CONTENT_UPDATED: 'content.updated',
  CONTENT_PUBLISHED: 'content.published',
  CONTENT_DELETED: 'content.deleted',

  // Payment events
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Notification events
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',

  // Engagement events
  REWARD_EARNED: 'reward.earned',
  REFERRAL_COMPLETED: 'referral.completed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',

  // Moderation events
  CONTENT_REPORTED: 'content.reported',
  CONTENT_MODERATED: 'content.moderated',
  USER_SUSPENDED: 'user.suspended',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ============================================================================
// Injection Tokens
// ============================================================================

export const EVENT_BUS_SERVICE = 'EVENT_BUS_SERVICE';
export const EVENT_SCHEMA_REGISTRY = 'EVENT_SCHEMA_REGISTRY';
export const DEAD_LETTER_QUEUE = 'DEAD_LETTER_QUEUE';
export const AGGREGATE_ORDERING = 'AGGREGATE_ORDERING';

// ============================================================================
// Event Bus Service (enhanced with SchemaRegistry, DLQ, AggregateOrdering)
// ============================================================================

export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly redis: Redis | Cluster;
  private readonly subscribers: Map<string, Set<EventHandler>> = new Map();
  private readonly publisher: Redis | Cluster;
  private readonly subscriber: Redis | Cluster;
  private readonly prefix: string;
  private readonly serviceName: string;
  private readonly enableRetry: boolean;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly consumerToggle?: (eventType: string) => Promise<boolean>;

  // Enhanced services (optional — only available when wired via module)
  readonly schemaRegistry?: EventSchemaRegistry;
  readonly deadLetterQueue?: DeadLetterQueue;
  readonly aggregateOrdering?: AggregateOrdering;

  constructor(
    config: EventBusConfig,
    serviceName: string,
    enhanced?: {
      schemaRegistry?: EventSchemaRegistry;
      deadLetterQueue?: DeadLetterQueue;
      aggregateOrdering?: AggregateOrdering;
    }
  ) {
    this.prefix = config.prefix || 'azeebo:events';
    this.serviceName = serviceName;
    this.enableRetry = config.enableRetry !== false;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
    this.consumerToggle = config.consumerToggle;

    this.schemaRegistry = enhanced?.schemaRegistry;
    this.deadLetterQueue = enhanced?.deadLetterQueue;
    this.aggregateOrdering = enhanced?.aggregateOrdering;

    const clusterNodes =
      config.clusterNodes ||
      (process.env.REDIS_CLUSTER_NODES
        ? process.env.REDIS_CLUSTER_NODES.split(',').map((n) => {
            const [host, port] = n.trim().split(':');
            return { host, port: Number(port) || 6379 };
          })
        : undefined);

    if (config.isCluster || (clusterNodes && clusterNodes.length > 0)) {
      this.logger.log('Initializing EventBus in Redis Cluster mode');
      const clusterInst = new Cluster(clusterNodes as Array<{ host: string; port: number }>, {
        clusterRetryStrategy: (times: number) => Math.min(times * 50, 2000),
        redisOptions: {
          maxRetriesPerRequest: 3,
        },
      });
      this.redis = clusterInst;
      this.publisher = clusterInst;
      this.subscriber = clusterInst.duplicate();
    } else if (config.sentinels || config.sentinelMaster || process.env.REDIS_SENTINEL_HOSTS) {
      this.logger.log('Initializing EventBus in Redis Sentinel mode');
      const sentinels =
        config.sentinels ||
        (process.env.REDIS_SENTINEL_HOSTS
          ? process.env.REDIS_SENTINEL_HOSTS.split(',').map((h) => {
              const [host, port] = h.trim().split(':');
              return { host, port: Number(port) || 26379 };
            })
          : []);
      const sentinelClient = new Redis({
        sentinels,
        name: config.sentinelMaster || process.env.REDIS_SENTINEL_MASTER || 'mymaster',
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });
      this.redis = sentinelClient;
      this.publisher = sentinelClient;
      this.subscriber = sentinelClient.duplicate();
    } else {
      const url = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      const standaloneClient = new Redis(url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });
      this.redis = standaloneClient;
      this.publisher = standaloneClient;
      this.subscriber = standaloneClient.duplicate();
    }

    this.redis.on('error', (err: Error) => {
      this.logger.error(`Event bus Redis error: ${err.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Event bus connected to Redis');
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Publishes an event to a partitioned channel across Redis shards.
   * Ideal for high-throughput live broadcasts (reality voting, live event reactions).
   */
  async publishPartitioned<T = Record<string, unknown>>(
    eventType: string,
    partitionKey: string,
    data: T,
    metadata?: DomainEvent['metadata'],
    numPartitions = 8
  ): Promise<{ partition: number; channel: string }> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      type: eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };
    return PartitionedStreamManager.publishPartitioned(
      this.publisher,
      this.prefix,
      eventType,
      partitionKey,
      event,
      numPartitions
    );
  }

  /**
   * Publish an event to the event bus.
   * If schemaRegistry is available, validates the event schema before publishing.
   * If aggregateOrdering is available, assigns a sequence number.
   */
  async publish<T = Record<string, unknown>>(
    eventType: string,
    data: T,
    metadata?: DomainEvent['metadata']
  ): Promise<void> {
    // Schema validation (if registry is available)
    if (this.schemaRegistry) {
      const validation = this.schemaRegistry.validateEvent(
        eventType,
        data as Record<string, unknown>
      );
      if (!validation.valid) {
        this.logger.warn(
          `Schema validation failed for ${eventType}: ${validation.errors.join(', ')}`
        );
        // Log but don't block — schemas may not be registered yet
      }
    }

    const event: DomainEvent<T> = {
      id: randomUUID(),
      type: eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    // Aggregate ordering (if available and metadata includes aggregate info)
    let sequenceNumber: number | undefined;
    if (this.aggregateOrdering && metadata?.aggregateId) {
      sequenceNumber = await this.aggregateOrdering.getNextSequence(metadata.aggregateId as string);
    }

    const channel = `${this.prefix}:${eventType}`;
    const message = JSON.stringify({
      ...event,
      ...(sequenceNumber !== undefined && { sequenceNumber }),
    });

    try {
      await this.publisher.publish(channel, message);
      this.logger.debug(
        `Published event: ${eventType} (id: ${event.id}${sequenceNumber !== undefined ? `, seq: ${sequenceNumber}` : ''})`
      );
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Subscribe to an event type
   */
  async subscribe<T = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<void> {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
      const channel = `${this.prefix}:${eventType}`;
      await this.subscriber.subscribe(channel);
      this.logger.debug(`Subscribed to channel: ${channel}`);
    }

    this.subscribers.get(eventType)!.add(handler as EventHandler);
    this.logger.debug(`Added handler for event: ${eventType}`);
  }

  /**
   * Unsubscribe from an event type
   */
  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
        const channel = `${this.prefix}:${eventType}`;
        await this.subscriber.unsubscribe(channel);
        this.logger.debug(`Unsubscribed from channel: ${channel}`);
      }
    }
  }

  /**
   * Handle incoming messages.
   * Integrates with DLQ for failed handlers and aggregate ordering for ordering.
   */
  private async handleMessage(_channel: string, message: string): Promise<void> {
    try {
      const event: DomainEvent & { sequenceNumber?: number } = JSON.parse(message);
      const eventType = event.type;

      this.logger.debug(`Received event: ${eventType} (id: ${event.id})`);

      // Per-event consumer pause: when the toggle resolves false the message is
      // skipped (acknowledged) so a flipped events_consume_* flag drains the
      // channel without losing or reprocessing anything.
      if (this.consumerToggle && !(await this.consumerToggle(eventType))) {
        this.logger.warn(`Skipping event ${eventType} (id: ${event.id}): consumption disabled`);
        return;
      }

      // Aggregate ordering: check for out-of-order events
      if (this.aggregateOrdering && event.metadata?.aggregateId && event.sequenceNumber) {
        const orderedEvent: OrderedEvent = {
          eventId: event.id,
          aggregateId: event.metadata.aggregateId as string,
          aggregateType: eventType.split('.')[0],
          sequenceNumber: event.sequenceNumber,
          eventType,
          payload: event.data,
          occurredAt: event.timestamp,
        };

        const check = await this.aggregateOrdering.checkOutOfOrder(orderedEvent);
        if (check.outOfOrder) {
          this.logger.warn(
            `Out-of-order event ${eventType} for aggregate ${orderedEvent.aggregateId}: ` +
              `expected seq ${check.expectedSequence}, got ${check.actualSequence}`
          );
          // Store for later replay
          await this.aggregateOrdering.storeEvent(orderedEvent);
        }
      }

      const handlers = this.subscribers.get(eventType);
      if (!handlers || handlers.size === 0) {
        this.logger.warn(`No handlers for event type: ${eventType}`);
        return;
      }

      for (const handler of handlers) {
        await this.executeWithRetry(handler, event);
      }
    } catch (error) {
      this.logger.error(`Failed to handle message: ${(error as Error).message}`);
    }
  }

  /**
   * Execute handler with retry logic.
   * If DLQ is available, enqueues failed events after exhausting retries.
   */
  private async executeWithRetry(handler: EventHandler, event: DomainEvent): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= (this.enableRetry ? this.maxRetries : 1); attempt++) {
      try {
        await handler(event);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Handler failed for event ${event.type} (attempt ${attempt}/${this.maxRetries}): ${lastError.message}`
        );

        if (attempt < this.maxRetries && this.enableRetry) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt));
        }
      }
    }

    // All retries exhausted — enqueue to DLQ if available
    if (this.deadLetterQueue) {
      await this.deadLetterQueue.enqueue({
        eventType: event.type,
        payload: event.data,
        error: {
          message: lastError?.message || 'Unknown error',
          stack: lastError?.stack,
        },
        maxRetries: this.maxRetries,
        owner: this.serviceName,
        correlationId: event.metadata?.correlationId as string,
      });
      this.logger.error(
        `Event ${event.type} (id: ${event.id}) enqueued to DLQ after ${this.maxRetries} failed attempts`
      );
    } else {
      this.logger.error(
        `Handler failed after ${this.maxRetries} attempts for event ${event.type}: ${lastError?.message}`
      );
    }
  }

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: string): number {
    return this.subscribers.get(eventType)?.size || 0;
  }

  /** Whether consumption of an event type is currently enabled (default true). */
  async isConsumptionEnabled(eventType: string): Promise<boolean> {
    if (!this.consumerToggle) return true;
    return this.consumerToggle(eventType);
  }

  /**
   * Check if connected to Redis
   */
  isConnected(): boolean {
    return this.redis.status === 'ready';
  }

  /**
   * Gracefully disconnect
   */
  async disconnect(): Promise<void> {
    await this.subscriber.disconnect();
    await this.publisher.disconnect();
    this.logger.log('Event bus disconnected');
  }
}

// ============================================================================
// NestJS Module
// ============================================================================

@Global()
@Module({})
export class EventBusModule {
  /**
   * Configure the event bus with optional enhanced services.
   * SchemaRegistry, DeadLetterQueue, and AggregateOrdering are automatically
   * created from the same Redis connection when enableEnhanced is true.
   */
  static forRoot(
    config: EventBusConfig,
    serviceName: string,
    options?: { enableEnhanced?: boolean }
  ): DynamicModule {
    const prefix = config.prefix || 'azeebo:events';
    const enableEnhanced = options?.enableEnhanced !== false; // default true

    const redisProvider: Provider = {
      provide: 'EVENT_BUS_REDIS',
      useFactory: () => {
        const client = new Redis(
          config.redisUrl ||
            process.env.EVENT_BUS_REDIS_URL ||
            process.env.REDIS_URL ||
            'redis://localhost:6379',
          {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => Math.min(times * 50, 2000),
          }
        );
        client.on('error', (err: Error) => {
          console.error(`[EventBusModule] Redis error: ${err.message}`);
        });
        return client;
      },
    };

    const schemaRegistryProvider: Provider = {
      provide: EVENT_SCHEMA_REGISTRY,
      useFactory: (redis: Redis) => new EventSchemaRegistry(redis, `${prefix}:schemas`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const dlqProvider: Provider = {
      provide: DEAD_LETTER_QUEUE,
      useFactory: (redis: Redis) => new DeadLetterQueue(redis, `${prefix}:dlq`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const aggregateOrderingProvider: Provider = {
      provide: AGGREGATE_ORDERING,
      useFactory: (redis: Redis) => new AggregateOrdering(redis, `${prefix}:ordering`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const eventBusProvider: Provider = {
      provide: EVENT_BUS_SERVICE,
      useFactory: (
        schemaRegistry: EventSchemaRegistry,
        dlq: DeadLetterQueue,
        aggregateOrdering: AggregateOrdering
      ) =>
        new EventBusService(
          config,
          serviceName,
          enableEnhanced ? { schemaRegistry, deadLetterQueue: dlq, aggregateOrdering } : undefined
        ),
      inject: enableEnhanced ? [EVENT_SCHEMA_REGISTRY, DEAD_LETTER_QUEUE, AGGREGATE_ORDERING] : [],
    };

    const providers = enableEnhanced
      ? [
          redisProvider,
          schemaRegistryProvider,
          dlqProvider,
          aggregateOrderingProvider,
          eventBusProvider,
        ]
      : [eventBusProvider];

    const exports_ = enableEnhanced
      ? [eventBusProvider, schemaRegistryProvider, dlqProvider, aggregateOrderingProvider]
      : [eventBusProvider];

    return {
      module: EventBusModule,
      providers,
      exports: exports_,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => EventBusConfig;
    inject?: unknown[];
    serviceName: string;
    enableEnhanced?: boolean;
  }): DynamicModule {
    const enableEnhanced = options.enableEnhanced !== false;
    const prefix = 'azeebo:events';

    const redisProvider: Provider = {
      provide: 'EVENT_BUS_REDIS',
      useFactory: (config: EventBusConfig) => {
        const client = new Redis(
          config.redisUrl ||
            process.env.EVENT_BUS_REDIS_URL ||
            process.env.REDIS_URL ||
            'redis://localhost:6379',
          {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => Math.min(times * 50, 2000),
          }
        );
        client.on('error', (err: Error) => {
          console.error(`[EventBusModule] Redis error: ${err.message}`);
        });
        return client;
      },
      inject: (options.inject as (InjectionToken | OptionalFactoryDependency)[]) || [],
    };

    const schemaRegistryProvider: Provider = {
      provide: EVENT_SCHEMA_REGISTRY,
      useFactory: (redis: Redis) => new EventSchemaRegistry(redis, `${prefix}:schemas`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const dlqProvider: Provider = {
      provide: DEAD_LETTER_QUEUE,
      useFactory: (redis: Redis) => new DeadLetterQueue(redis, `${prefix}:dlq`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const aggregateOrderingProvider: Provider = {
      provide: AGGREGATE_ORDERING,
      useFactory: (redis: Redis) => new AggregateOrdering(redis, `${prefix}:ordering`),
      inject: ['EVENT_BUS_REDIS'],
    };

    const eventBusProvider: Provider = {
      provide: EVENT_BUS_SERVICE,
      useFactory: (
        config: EventBusConfig,
        schemaRegistry: EventSchemaRegistry,
        dlq: DeadLetterQueue,
        aggregateOrdering: AggregateOrdering
      ) =>
        new EventBusService(
          config,
          options.serviceName,
          enableEnhanced ? { schemaRegistry, deadLetterQueue: dlq, aggregateOrdering } : undefined
        ),
      inject: enableEnhanced
        ? [
            ...(options.inject as (InjectionToken | OptionalFactoryDependency)[]),
            EVENT_SCHEMA_REGISTRY,
            DEAD_LETTER_QUEUE,
            AGGREGATE_ORDERING,
          ]
        : (options.inject as (InjectionToken | OptionalFactoryDependency)[]) || [],
    };

    const providers = enableEnhanced
      ? [
          redisProvider,
          schemaRegistryProvider,
          dlqProvider,
          aggregateOrderingProvider,
          eventBusProvider,
        ]
      : [eventBusProvider];

    const exports_ = enableEnhanced
      ? [eventBusProvider, schemaRegistryProvider, dlqProvider, aggregateOrderingProvider]
      : [eventBusProvider];

    return {
      module: EventBusModule,
      providers,
      exports: exports_,
    };
  }
}
