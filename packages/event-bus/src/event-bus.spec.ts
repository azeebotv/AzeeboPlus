import { EventBusService, EventTypes, EventBusModule, EVENT_BUS_SERVICE, eventConsumeFlagKey } from './index';

jest.mock('ioredis', () => {
  const inst: any = {};
  inst.on = jest.fn().mockReturnValue(inst);
  inst.publish = jest.fn().mockResolvedValue(1);
  inst.subscribe = jest.fn().mockResolvedValue(undefined);
  inst.unsubscribe = jest.fn().mockResolvedValue(undefined);
  inst.disconnect = jest.fn().mockResolvedValue(undefined);
  inst.ping = jest.fn().mockResolvedValue('PONG');
  inst.duplicate = jest.fn(() => inst);
  inst.status = 'ready';
  return jest.fn(() => inst);
});

/** Helper to get the active mock Redis instance from the latest EventBusService */
function getMockRedis(eventBus: EventBusService): any {
  return (eventBus as any).redis;
}

describe('EventTypes', () => {
  it('should define user events', () => {
    expect(EventTypes.USER_CREATED).toBe('user.created');
    expect(EventTypes.USER_UPDATED).toBe('user.updated');
    expect(EventTypes.USER_DELETED).toBe('user.deleted');
  });
  it('should define wallet events', () => {
    expect(EventTypes.WALLET_FUNDED).toBe('wallet.funded');
    expect(EventTypes.WALLET_DEBITED).toBe('wallet.debited');
    expect(EventTypes.WALLET_TRANSFERRED).toBe('wallet.transferred');
  });
  it('should define content events', () => {
    expect(EventTypes.CONTENT_CREATED).toBe('content.created');
    expect(EventTypes.CONTENT_PUBLISHED).toBe('content.published');
  });
  it('should define payment events', () => {
    expect(EventTypes.PAYMENT_SUCCESS).toBe('payment.success');
    expect(EventTypes.PAYMENT_FAILED).toBe('payment.failed');
  });
});

describe('EventBusService', () => {
  let eventBus: EventBusService;
  const mockConfig = {
    redisUrl: 'redis://localhost:6379',
    prefix: 'test:events',
    enableRetry: true,
    maxRetries: 3,
    retryDelayMs: 100,
  };
  const serviceName = 'test-service';

  beforeEach(() => {
    jest.clearAllMocks();
    eventBus = new EventBusService(mockConfig, serviceName);
  });

  afterEach(async () => {
    await eventBus.disconnect();
  });

  describe('constructor', () => {
    it('should initialize with custom config', () => {
      expect(eventBus).toBeDefined();
      expect((eventBus as any).prefix).toBe('test:events');
      expect((eventBus as any).serviceName).toBe('test-service');
      expect((eventBus as any).maxRetries).toBe(3);
    });

    it('should use default config values', () => {
      const bus = new EventBusService({ redisUrl: 'redis://localhost:6379' }, 'default');
      expect((bus as any).prefix).toBe('azeebo:events');
      expect((bus as any).maxRetries).toBe(3);
    });

    it('should disable retry when configured', () => {
      const bus = new EventBusService({ redisUrl: 'redis://localhost:6379', enableRetry: false }, 'no-retry');
      expect((bus as any).enableRetry).toBe(false);
    });
  });

  describe('publish', () => {
    it('should publish an event to Redis', async () => {
      await eventBus.publish('user.created', { userId: '123' });

      const redis = getMockRedis(eventBus);
      expect(redis.publish).toHaveBeenCalledWith('test:events:user.created', expect.any(String));

      const msg = JSON.parse(redis.publish.mock.calls[0][1]);
      expect(msg.type).toBe('user.created');
      expect(msg.source).toBe('test-service');
      expect(msg.data).toEqual({ userId: '123' });
    });

    it('should include metadata when provided', async () => {
      await eventBus.publish('user.created', { userId: '123' }, {
        userId: '123',
        correlationId: 'corr-456',
      });

      const redis = getMockRedis(eventBus);
      const msg = JSON.parse(redis.publish.mock.calls[0][1]);
      expect(msg.metadata).toEqual({ userId: '123', correlationId: 'corr-456' });
    });

    it('should throw when Redis publish fails', async () => {
      const redis = getMockRedis(eventBus);
      redis.publish.mockRejectedValue(new Error('Redis connection lost'));

      await expect(eventBus.publish('user.created', { userId: '123' })).rejects.toThrow('Redis connection lost');
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('should subscribe to an event type', async () => {
      const handler = jest.fn();
      await eventBus.subscribe('user.created', handler);

      const redis = getMockRedis(eventBus);
      expect(redis.subscribe).toHaveBeenCalledWith('test:events:user.created');
      expect((eventBus as any).subscribers.get('user.created')?.has(handler)).toBe(true);
    });

    it('should not subscribe twice to the same channel', async () => {
      const redis = getMockRedis(eventBus);
      await eventBus.subscribe('user.created', jest.fn());
      await eventBus.subscribe('user.created', jest.fn());

      expect(redis.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe a handler', async () => {
      const handler = jest.fn();
      await eventBus.subscribe('user.created', handler);
      await eventBus.unsubscribe('user.created', handler);

      // When all handlers are removed, the event type is removed from the map
      expect((eventBus as any).subscribers.has('user.created')).toBe(false);
    });

    it('should unsubscribe from Redis channel when no handlers remain', async () => {
      const redis = getMockRedis(eventBus);
      const handler = jest.fn();
      await eventBus.subscribe('user.created', handler);
      await eventBus.unsubscribe('user.created', handler);

      expect(redis.unsubscribe).toHaveBeenCalledWith('test:events:user.created');
      expect((eventBus as any).subscribers.has('user.created')).toBe(false);
    });
  });

  describe('getSubscriberCount', () => {
    it('should return 0 for unsubscribed event', () => {
      expect(eventBus.getSubscriberCount('nonexistent')).toBe(0);
    });

    it('should return correct subscriber count', async () => {
      await eventBus.subscribe('user.created', jest.fn());
      await eventBus.subscribe('user.created', jest.fn());
      await eventBus.subscribe('user.updated', jest.fn());

      expect(eventBus.getSubscriberCount('user.created')).toBe(2);
      expect(eventBus.getSubscriberCount('user.updated')).toBe(1);
    });
  });

  describe('isConnected', () => {
    it('should return true when Redis is ready', () => {
      const redis = getMockRedis(eventBus);
      redis.status = 'ready';
      expect(eventBus.isConnected()).toBe(true);
    });

    it('should return false when Redis is not ready', () => {
      const redis = getMockRedis(eventBus);
      redis.status = 'connecting';
      expect(eventBus.isConnected()).toBe(false);
    });
  });

  describe('handleMessage', () => {
    it('should call handlers for matching event types', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await eventBus.subscribe('user.updated', handler);

      const message = JSON.stringify({
        id: 'evt-1',
        type: 'user.updated',
        source: 'auth-service',
        timestamp: new Date().toISOString(),
        data: { userId: '123' },
      });
      await (eventBus as any).handleMessage('test:events:user.updated', message);

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt-1', type: 'user.updated' }));
    });

    it('should warn when no handlers for event type', async () => {
      const logWarn = jest.spyOn((eventBus as any).logger, 'warn').mockImplementation();
      const message = JSON.stringify({ id: 'evt-1', type: 'unknown.event', source: 'test', timestamp: new Date().toISOString(), data: {} });
      await (eventBus as any).handleMessage('test:events:unknown.event', message);
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('unknown.event'));
    });

    it('should handle malformed JSON gracefully', async () => {
      const logError = jest.spyOn((eventBus as any).logger, 'error').mockImplementation();
      await (eventBus as any).handleMessage('test:events:test', 'invalid-json');
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('Failed to handle message'));
    });

    it('should skip events when the consumer toggle resolves false', async () => {
      const toggle = jest.fn(async () => false);
      const toggledBus = new EventBusService({ ...mockConfig, consumerToggle: toggle }, 'test');
      const handler = jest.fn().mockResolvedValue(undefined);
      await toggledBus.subscribe('payment.success', handler);

      const message = JSON.stringify({
        id: 'evt-2',
        type: 'payment.success',
        source: 'payment-service',
        timestamp: new Date().toISOString(),
        data: {},
      });
      const logWarn = jest.spyOn((toggledBus as any).logger, 'warn').mockImplementation();
      await (toggledBus as any).handleMessage('test:events:payment.success', message);

      expect(toggle).toHaveBeenCalledWith('payment.success');
      expect(handler).not.toHaveBeenCalled();
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('consumption disabled'));
    });

    it('should dispatch events when the consumer toggle resolves true', async () => {
      const toggle = jest.fn(async () => true);
      const toggledBus = new EventBusService({ ...mockConfig, consumerToggle: toggle }, 'test');
      const handler = jest.fn().mockResolvedValue(undefined);
      await toggledBus.subscribe('payment.success', handler);

      const message = JSON.stringify({
        id: 'evt-3',
        type: 'payment.success',
        source: 'payment-service',
        timestamp: new Date().toISOString(),
        data: {},
      });
      await (toggledBus as any).handleMessage('test:events:payment.success', message);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('isConsumptionEnabled returns true when no toggle is configured', async () => {
      expect(await eventBus.isConsumptionEnabled('user.created')).toBe(true);
    });
  });

  describe('eventConsumeFlagKey', () => {
    it('builds canonical events_consume_* flag keys', () => {
      expect(eventConsumeFlagKey('user.created')).toBe('events_consume_user.created');
      expect(eventConsumeFlagKey('payment.success')).toBe('events_consume_payment.success');
    });
  });

  describe('executeWithRetry', () => {
    beforeEach(() => jest.useFakeTimers({ legacyFakeTimers: false }));
    afterEach(() => jest.useRealTimers());

    it('should succeed on first attempt', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const event = { id: 'evt-1', type: 'test.event', source: 'test', timestamp: new Date().toISOString(), data: {} };
      await (eventBus as any).executeWithRetry(handler, event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const handler = jest.fn().mockRejectedValueOnce(new Error('temp')).mockResolvedValueOnce(undefined);
      const event = { id: 'evt-1', type: 'test.event', source: 'test', timestamp: new Date().toISOString(), data: {} };
      const p = (eventBus as any).executeWithRetry(handler, event);
      await jest.runAllTimersAsync();
      await p;
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('persistent'));
      const event = { id: 'evt-1', type: 'test.event', source: 'test', timestamp: new Date().toISOString(), data: {} };
      const p = (eventBus as any).executeWithRetry(handler, event);
      await jest.runAllTimersAsync();
      await p;
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('disconnect', () => {
    it('should disconnect both connections', async () => {
      const redis = getMockRedis(eventBus);
      await eventBus.disconnect();
      expect(redis.disconnect).toHaveBeenCalledTimes(2); // publisher + subscriber
    });
  });
});

describe('EventBusModule', () => {
  it('should create a dynamic module with forRoot', () => {
    const mod = EventBusModule.forRoot({ redisUrl: 'redis://localhost:6379' }, 'test');
    expect(mod.module).toBe(EventBusModule);
    expect(mod.providers).toBeDefined();
    expect(mod.exports).toBeDefined();
  });

  it('should create a dynamic module with forRootAsync', () => {
    const mod = EventBusModule.forRootAsync({ useFactory: () => ({ redisUrl: 'redis://localhost:6379' }), inject: [], serviceName: 'test' });
    expect(mod.module).toBe(EventBusModule);
    expect(mod.providers).toBeDefined();
    expect(mod.exports).toBeDefined();
  });

  it('should export EVENT_BUS_SERVICE token', () => {
    const mod = EventBusModule.forRoot({ redisUrl: 'redis://localhost:6379' }, 'test');
    expect(EVENT_BUS_SERVICE).toBe('EVENT_BUS_SERVICE');
    expect(mod.providers?.[0]).toHaveProperty('provide', EVENT_BUS_SERVICE);
  });
});
