import {
  Logger,
  Module,
  Global,
  DynamicModule,
  Provider,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

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
  redisUrl: string;
  prefix?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

// ============================================================================
// Pre-defined Event Types
// ============================================================================

export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

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
// Event Bus Service
// ============================================================================

export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly redis: Redis;
  private readonly subscribers: Map<string, Set<EventHandler>> = new Map();
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly prefix: string;
  private readonly serviceName: string;
  private readonly enableRetry: boolean;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(config: EventBusConfig, serviceName: string) {
    this.prefix = config.prefix || 'azeebo:events';
    this.serviceName = serviceName;
    this.enableRetry = config.enableRetry !== false;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;

    this.redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.publisher = this.redis;
    this.subscriber = this.redis.duplicate();

    this.redis.on('error', (err) => {
      this.logger.error(`Event bus Redis error: ${err.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Event bus connected to Redis');
    });

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Publish an event to the event bus
   */
  async publish<T = Record<string, unknown>>(
    eventType: string,
    data: T,
    metadata?: DomainEvent['metadata']
  ): Promise<void> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      type: eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    const channel = `${this.prefix}:${eventType}`;
    const message = JSON.stringify(event);

    try {
      await this.publisher.publish(channel, message);
      this.logger.debug(`Published event: ${eventType} (id: ${event.id})`);
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
   * Handle incoming messages
   */
  private async handleMessage(_channel: string, message: string): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(message);
      const eventType = event.type;

      this.logger.debug(`Received event: ${eventType} (id: ${event.id})`);

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
   * Execute handler with retry logic
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

    this.logger.error(
      `Handler failed after ${this.maxRetries} attempts for event ${event.type}: ${lastError?.message}`
    );
  }

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: string): number {
    return this.subscribers.get(eventType)?.size || 0;
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

export const EVENT_BUS_SERVICE = 'EVENT_BUS_SERVICE';

@Global()
@Module({})
export class EventBusModule {
  static forRoot(config: EventBusConfig, serviceName: string): DynamicModule {
    const eventBusProvider: Provider = {
      provide: EVENT_BUS_SERVICE,
      useFactory: () => new EventBusService(config, serviceName),
    };

    return {
      module: EventBusModule,
      providers: [eventBusProvider],
      exports: [eventBusProvider],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => EventBusConfig;
    inject?: unknown[];
    serviceName: string;
  }): DynamicModule {
    const eventBusProvider: Provider = {
      provide: EVENT_BUS_SERVICE,
      useFactory: (config: EventBusConfig) => new EventBusService(config, options.serviceName),
      inject: (options.inject as (InjectionToken | OptionalFactoryDependency)[]) || [],
    };

    return {
      module: EventBusModule,
      providers: [eventBusProvider],
      exports: [eventBusProvider],
    };
  }
}
