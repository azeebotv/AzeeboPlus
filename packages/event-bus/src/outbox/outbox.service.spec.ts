import { OutboxService, OutboxStorage, EventPublisher } from './outbox.service';

describe('OutboxService', () => {
  let service: OutboxService;
  let mockStorage: jest.Mocked<OutboxStorage>;
  let mockPublisher: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      create: jest.fn(),
      findPending: jest.fn(),
      updateStatus: jest.fn(),
      incrementRetry: jest.fn(),
    };

    mockPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    service = new OutboxService(mockStorage, mockPublisher);
  });

  describe('createOutboxEntry', () => {
    it('should create a pending outbox entry via storage', async () => {
      const entry = {
        id: 'outbox-1',
        aggregateType: 'user',
        aggregateId: 'user-1',
        eventType: 'user.created',
        payload: { name: 'Test' },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      };
      mockStorage.create.mockResolvedValue(entry);

      const result = await service.createOutboxEntry('user', 'user-1', 'user.created', {
        name: 'Test',
      });

      expect(result.id).toBe('outbox-1');
      expect(mockStorage.create).toHaveBeenCalledWith({
        aggregateType: 'user',
        aggregateId: 'user-1',
        eventType: 'user.created',
        payload: { name: 'Test' },
        metadata: undefined,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      });
    });

    it('should pass metadata when provided', async () => {
      const metadata = { correlationId: 'corr-1' };
      mockStorage.create.mockResolvedValue({} as never);

      await service.createOutboxEntry('user', 'u1', 'user.updated', {}, metadata);

      expect(mockStorage.create).toHaveBeenCalledWith(expect.objectContaining({ metadata }));
    });
  });

  describe('publishEntry', () => {
    it('should publish a pending entry successfully', async () => {
      const entry = {
        id: 'outbox-1',
        aggregateType: 'user',
        aggregateId: 'user-1',
        eventType: 'user.created',
        payload: { name: 'Test' },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      };
      mockStorage.findPending.mockResolvedValue([entry]);

      const result = await service.publishEntry('outbox-1');

      expect(result.success).toBe(true);
      expect(result.entryId).toBe('outbox-1');
      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'user.created',
        { name: 'Test' },
        undefined
      );
      expect(mockStorage.updateStatus).toHaveBeenCalledWith(
        'outbox-1',
        'published',
        expect.any(Date)
      );
    });

    it('should return failure when entry not found', async () => {
      mockStorage.findPending.mockResolvedValue([]);

      const result = await service.publishEntry('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entry not found or already published');
    });

    it('should handle publisher errors and increment retry', async () => {
      const entry = {
        id: 'outbox-1',
        aggregateType: 'user',
        aggregateId: 'user-1',
        eventType: 'user.created',
        payload: {},
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      };
      mockStorage.findPending.mockResolvedValue([entry]);
      mockPublisher.publish.mockRejectedValue(new Error('Redis down'));

      const result = await service.publishEntry('outbox-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis down');
      expect(mockStorage.incrementRetry).toHaveBeenCalledWith('outbox-1', 'Redis down');
    });
  });

  describe('publishPendingEntries', () => {
    it('should batch publish multiple entries', async () => {
      const entries = [
        {
          id: 'e1',
          eventType: 'user.created',
          payload: {},
          status: 'pending' as const,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          aggregateType: 'user',
          aggregateId: 'u1',
        },
        {
          id: 'e2',
          eventType: 'content.published',
          payload: {},
          status: 'pending' as const,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          aggregateType: 'content',
          aggregateId: 'c1',
        },
      ];
      mockStorage.findPending.mockResolvedValue(entries);

      const results = await service.publishPendingEntries(10);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockPublisher.publish).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no pending entries', async () => {
      mockStorage.findPending.mockResolvedValue([]);

      const results = await service.publishPendingEntries();
      expect(results).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return pending count', async () => {
      mockStorage.findPending.mockResolvedValue([{ id: 'e1' } as never, { id: 'e2' } as never]);

      const stats = await service.getStats();
      expect(stats.pending).toBe(2);
      expect(stats.total).toBe(2);
    });
  });
});
