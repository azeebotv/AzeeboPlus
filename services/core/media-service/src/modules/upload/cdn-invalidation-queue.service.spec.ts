import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CdnInvalidationQueueService } from './cdn-invalidation-queue.service';
import { CdnPurgeService } from './cdn-purge.service';
import { PrismaService } from '../database/prisma.service';

describe('CdnInvalidationQueueService', () => {
  let service: CdnInvalidationQueueService;

  const mockCdnPurgeService = {
    purgeKeys: jest.fn(),
    purgePrefix: jest.fn(),
  };

  const mockPrismaService = {
    cdnInvalidationQueue: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    mediaUpload: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  };

  const makeService = async (config: Record<string, unknown> = {}) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CdnInvalidationQueueService,
        { provide: CdnPurgeService, useValue: mockCdnPurgeService },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
      ],
    }).compile();
    return module.get<CdnInvalidationQueueService>(CdnInvalidationQueueService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.mediaUpload.findMany.mockResolvedValue([]);
    mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValue([]);
    service = await makeService();
  });

  describe('enqueue', () => {
    it('creates a pending row for a new key', async () => {
      mockPrismaService.cdnInvalidationQueue.findFirst.mockResolvedValueOnce(null);

      const result = await service.enqueue('videos/a.mp4', 'failed', 'cloudfront down');

      expect(result).toEqual({ queued: true });
      expect(mockPrismaService.cdnInvalidationQueue.create).toHaveBeenCalledWith({
        data: { key: 'videos/a.mp4', reason: 'failed', lastError: 'cloudfront down' },
      });
    });

    it('reuses an existing pending row without resetting the attempt budget', async () => {
      mockPrismaService.cdnInvalidationQueue.findFirst.mockResolvedValueOnce({
        id: 'q-1',
      });

      const result = await service.enqueue('videos/a.mp4', 'skipped', 'not configured');

      expect(result).toEqual({ queued: false });
      expect(mockPrismaService.cdnInvalidationQueue.create).not.toHaveBeenCalled();
      expect(mockPrismaService.cdnInvalidationQueue.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { lastError: 'not configured', reason: 'skipped' },
      });
    });
  });

  describe('reconcile', () => {
    it('enqueues rows whose metadata.cdnPurgeStatus is failed or skipped', async () => {
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'u-1', key: 'videos/a.mp4', metadata: { cdnPurgeStatus: 'failed', cdnPurgeError: 'boom' } },
        { id: 'u-2', key: 'images/b.jpg', metadata: { cdnPurgeStatus: 'skipped' } },
      ]);
      mockPrismaService.cdnInvalidationQueue.findFirst.mockResolvedValue(null);
      mockPrismaService.cdnInvalidationQueue.create.mockResolvedValue({ id: 'q-new' });

      const result = await service.reconcile();

      expect(result.scanned).toBe(2);
      expect(result.enqueued).toEqual([
        { key: 'videos/a.mp4', uploadId: 'u-1', reason: 'failed' },
        { key: 'images/b.jpg', uploadId: 'u-2', reason: 'skipped' },
      ]);
      expect(mockPrismaService.cdnInvalidationQueue.create).toHaveBeenCalledTimes(2);
    });

    it('skips rows that already have a pending queue entry', async () => {
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'u-1', key: 'videos/a.mp4', metadata: { cdnPurgeStatus: 'failed' } },
      ]);
      mockPrismaService.cdnInvalidationQueue.findFirst.mockResolvedValueOnce({ id: 'q-1' });

      const result = await service.reconcile();

      expect(result.alreadyQueued).toBe(1);
      expect(result.enqueued).toEqual([]);
      expect(mockPrismaService.cdnInvalidationQueue.create).not.toHaveBeenCalled();
    });

    it('continues past a per-row failure and reports it', async () => {
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'u-1', key: 'videos/a.mp4', metadata: { cdnPurgeStatus: 'failed' } },
        { id: 'u-2', key: 'images/b.jpg', metadata: { cdnPurgeStatus: 'failed' } },
      ]);
      mockPrismaService.cdnInvalidationQueue.findFirst.mockResolvedValue(null);
      mockPrismaService.cdnInvalidationQueue.create
        .mockRejectedValueOnce(new Error('db blip'))
        .mockResolvedValueOnce({ id: 'q-2' });

      const result = await service.reconcile();

      expect(result.enqueued).toEqual([
        { key: 'images/b.jpg', uploadId: 'u-2', reason: 'failed' },
      ]);
      expect(result.errors).toEqual([{ uploadId: 'u-1', reason: 'db blip' }]);
    });

    it('reports a total failure as a single wildcard error, never throws', async () => {
      mockPrismaService.mediaUpload.findMany.mockRejectedValueOnce(new Error('db down'));

      const result = await service.reconcile();

      expect(result.enqueued).toEqual([]);
      expect(result.errors).toEqual([{ uploadId: '*', reason: 'db down' }]);
    });
  });

  describe('drain', () => {
    const row = { id: 'q-1', key: 'videos/a.mp4', attempts: 0, reason: 'failed' };

    it('marks rows done and stamps the upload metadata on success', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([row]);
      mockCdnPurgeService.purgeKeys.mockResolvedValueOnce({
        invalidationId: 'I-777',
        purged: 1,
      });
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'u-1', metadata: { scanStatus: 'clean' } },
      ]);

      const result = await service.drain();

      expect(result.invalidations).toBe(1);
      expect(result.done).toEqual([{ id: 'q-1', key: 'videos/a.mp4', invalidationId: 'I-777' }]);
      expect(mockPrismaService.cdnInvalidationQueue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['q-1'] } },
        data: { status: 'done', attempts: { increment: 1 }, lastError: null },
      });
      expect(mockPrismaService.mediaUpload.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: {
          metadata: { scanStatus: 'clean', cdnPurgeStatus: 'invalidated', cdnPurgeInvalidationId: 'I-777' },
        },
      });
    });

    it('batches multiple exact keys into ONE CloudFront invalidation', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([
        { id: 'q-1', key: 'videos/a.mp4', attempts: 0, reason: 'delete' },
        { id: 'q-2', key: 'images/b.jpg', attempts: 0, reason: 'delete' },
      ]);
      mockCdnPurgeService.purgeKeys.mockResolvedValueOnce({ invalidationId: 'I-1', purged: 2 });

      const result = await service.drain();

      expect(mockCdnPurgeService.purgeKeys).toHaveBeenCalledTimes(1);
      expect(mockCdnPurgeService.purgeKeys).toHaveBeenCalledWith(['videos/a.mp4', 'images/b.jpg']);
      expect(result.invalidations).toBe(1);
      expect(result.done).toHaveLength(2);
    });

    it('submits each distinct wildcard prefix as its own invalidation', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([
        { id: 'q-1', key: 'uploads/*', attempts: 0, reason: 'flag-flip' },
        { id: 'q-2', key: 'videos/*', attempts: 0, reason: 'admin' },
      ]);
      mockCdnPurgeService.purgeKeys.mockResolvedValue({ invalidationId: 'I-w', purged: 1 });

      const result = await service.drain();

      expect(mockCdnPurgeService.purgeKeys).toHaveBeenCalledTimes(2);
      expect(mockCdnPurgeService.purgeKeys).toHaveBeenNthCalledWith(1, ['uploads/*']);
      expect(mockCdnPurgeService.purgeKeys).toHaveBeenNthCalledWith(2, ['videos/*']);
      expect(result.invalidations).toBe(2);
      expect(result.done).toHaveLength(2);
    });

    it('drains bursts larger than one invalidation cap in bounded passes', async () => {
      service = await makeService({ MEDIA_CDN_INVALIDATION_BATCH_SIZE: 2 });
      mockPrismaService.cdnInvalidationQueue.findMany
        .mockResolvedValueOnce([
          { id: 'q-1', key: 'videos/a.mp4', attempts: 0, reason: 'delete' },
          { id: 'q-2', key: 'videos/b.mp4', attempts: 0, reason: 'delete' },
        ])
        .mockResolvedValueOnce([
          { id: 'q-3', key: 'images/c.jpg', attempts: 0, reason: 'delete' },
          { id: 'q-4', key: 'images/d.jpg', attempts: 0, reason: 'delete' },
        ]);
      mockCdnPurgeService.purgeKeys.mockResolvedValue({ invalidationId: 'I-x', purged: 2 });

      const result = await service.drain();

      expect(result.scanned).toBe(4);
      expect(result.done).toHaveLength(4);
      expect(mockCdnPurgeService.purgeKeys).toHaveBeenCalledTimes(2);
      expect(result.invalidations).toBe(2);
    });

    it('retries (keeps pending) when the purge still skips and attempts remain', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([row]);
      mockCdnPurgeService.purgeKeys.mockResolvedValueOnce({ purged: 0 });

      const result = await service.drain();

      expect(result.retried).toEqual([
        expect.objectContaining({ id: 'q-1', attempts: 1 }),
      ]);
      expect(result.done).toEqual([]);
      expect(mockPrismaService.cdnInvalidationQueue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['q-1'] } },
        data: { attempts: { increment: 1 }, lastError: 'CDN not configured (no invalidation created)' },
      });
    });

    it('dead-letters when attempts are exhausted after a purge failure', async () => {
      service = await makeService({ MEDIA_CDN_INVALIDATION_MAX_ATTEMPTS: 5 });
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([
        { ...row, attempts: 4 },
      ]);
      mockCdnPurgeService.purgeKeys.mockRejectedValueOnce(new Error('cloudfront down'));

      const result = await service.drain();

      expect(result.deadLettered).toEqual([
        { id: 'q-1', key: 'videos/a.mp4', attempts: 5, error: 'cloudfront down' },
      ]);
      expect(mockPrismaService.cdnInvalidationQueue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['q-1'] } },
        data: { status: 'dead', attempts: { increment: 1 }, lastError: 'cloudfront down' },
      });
    });

    it('dead-letters a still-skipping purge once the attempt budget is gone', async () => {
      service = await makeService({ MEDIA_CDN_INVALIDATION_MAX_ATTEMPTS: 5 });
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValueOnce([
        { ...row, attempts: 4 },
      ]);
      mockCdnPurgeService.purgeKeys.mockResolvedValueOnce({ purged: 0 });

      const result = await service.drain();

      expect(result.deadLettered).toHaveLength(1);
      expect(result.retried).toEqual([]);
    });

    it('reports a batch bookkeeping failure and leaves rows pending (no false done)', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockResolvedValue([row]);
      mockCdnPurgeService.purgeKeys.mockResolvedValue({ invalidationId: 'I-1', purged: 1 });
      mockPrismaService.cdnInvalidationQueue.updateMany.mockRejectedValue(new Error('row locked'));

      const result = await service.drain();

      expect(result.done).toEqual([]);
      expect(result.errors).toEqual([{ id: 'q-1', reason: 'row locked' }]);
      // No-progress break: exactly one invalidation attempt, not a tight loop.
      expect(mockCdnPurgeService.purgeKeys).toHaveBeenCalledTimes(1);
    });

    it('returns an empty result instead of throwing when the queue read fails', async () => {
      mockPrismaService.cdnInvalidationQueue.findMany.mockRejectedValueOnce(new Error('db down'));

      const result = await service.drain();

      expect(result.scanned).toBe(0);
      expect(result.errors).toEqual([{ id: '*', reason: 'db down' }]);
    });
  });

  describe('config', () => {
    it('falls back to defaults on garbage config values', async () => {
      const svc = await makeService({
        MEDIA_CDN_INVALIDATION_NIGHTLY_HOUR: 99,
        MEDIA_CDN_INVALIDATION_MAX_ATTEMPTS: 0,
        MEDIA_CDN_INVALIDATION_BATCH_SIZE: -3,
      });
      expect(svc).toBeDefined();
    });
  });
});
