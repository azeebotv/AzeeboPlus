import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { RedisService } from '@azeebo/shared-services';
import { FeatureFlagService, mediaFlags } from '@azeebo/feature-flags';
import { FileValidationService } from '../../common/services/file-validation.service';
import { CdnInvalidationQueueService } from './cdn-invalidation-queue.service';
import { PrismaService } from '../database/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UploadService', () => {
  let service: UploadService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    getSignedUrl: jest.fn(),
    putBuffer: jest.fn(),
    getObjectBuffer: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scanKeys: jest.fn().mockResolvedValue([]),
  };

  const mockFileValidationService = {
    validateFile: jest.fn(),
    validatePresignedUpload: jest.fn(),
  };

  const mockFeatureFlagService = {
    // Everything on EXCEPT the off-by-default safety features (virus scan,
    // chunked uploads) so upload tests don't trip the fail-closed hooks.
    isEnabled: jest
      .fn()
      .mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      ),
  };

  const mockPrismaService = {
    mediaUpload: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  };

  const mockInvalidationQueue = {
    enqueue: jest.fn().mockResolvedValue({ queued: true }),
  };

  beforeEach(async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: RedisService, useValue: mockRedisService },
        { provide: FileValidationService, useValue: mockFileValidationService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: CdnInvalidationQueueService, useValue: mockInvalidationQueue },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload an image', async () => {
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/test.jpg' });

      const result = await service.uploadImage(mockFile);
      expect(result).toBeDefined();
    });

    it('should return a public immutable cache-control when media_cdn_edge_cache is on', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      );
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/test.jpg' });

      const result = await service.uploadImage(mockFile);

      expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(mediaFlags.cdnEdgeCache);
      expect(result.cacheControl).toBe('public, max-age=31536000, immutable');
      expect(result.cachePolicy).toBe('immutable');
    });

    it('should return a no-store cache-control when media_cdn_edge_cache is off', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/test.jpg' });

      const result = await service.uploadImage(mockFile);

      expect(result.cacheControl).toBe('private, no-store');
      expect(result.cachePolicy).toBe('no-store');
    });
  });

  describe('per-type cache-control (media_cdn_edge_cache)', () => {
    const upload = async (mimetype: string) => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      );
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/file' });
      const file = {
        originalname: 'file',
        mimetype,
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      return service.uploadImage(file);
    };

    it('keeps immutable year-long caching for images', async () => {
      expect((await upload('image/jpeg')).cacheControl).toBe('public, max-age=31536000, immutable');
      expect((await upload('image/jpeg')).cachePolicy).toBe('immutable');
    });

    it('uses a short TTL for videos (re-encodes replace the object)', async () => {
      const result = await upload('video/mp4');
      expect(result.cacheControl).toBe('public, max-age=86400');
      expect(result.cachePolicy).toBe('medium-lived');
    });

    it('uses a week-long TTL for audio and documents', async () => {
      expect((await upload('audio/mpeg')).cacheControl).toBe('public, max-age=604800');
      expect((await upload('audio/mpeg')).cachePolicy).toBe('long-lived');
      expect((await upload('application/pdf')).cacheControl).toBe('public, max-age=604800');
      expect((await upload('application/pdf')).cachePolicy).toBe('long-lived');
    });

    it('falls back to a conservative TTL for unknown types', async () => {
      const result = await upload('text/plain');
      expect(result.cacheControl).toBe('public, max-age=3600');
      expect(result.cachePolicy).toBe('short-lived');
    });
  });

  describe('media_upload analytics event', () => {
    it('emits one event per upload with content type and applied cache directive', async () => {
      mockS3Service.uploadFile.mockResolvedValue({
        url: 'https://example.com/video.mp4',
        key: 'videos/video.mp4',
      });
      const file = {
        originalname: 'video.mp4',
        mimetype: 'video/mp4',
        buffer: Buffer.from('test'),
        size: 2048,
      } as Express.Multer.File;

      const result = await service.uploadVideo(file, 'user-42');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://analytics-service:3008/analytics/track',
        expect.objectContaining({
          eventName: 'media_upload',
          userId: 'user-42',
          metadata: expect.objectContaining({
            contentType: 'video/mp4',
            uploadType: 'video',
            cacheControl: result.cacheControl,
            cachePolicy: result.cachePolicy,
            sizeBytes: 2048,
            filename: 'video.mp4',
            key: 'videos/video.mp4',
          }),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('includes the no-store directive when media_cdn_edge_cache is off', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/a.jpg' });
      const file = {
        originalname: 'a.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 512,
      } as Express.Multer.File;

      await service.uploadImage(file);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://analytics-service:3008/analytics/track',
        expect.objectContaining({
          eventName: 'media_upload',
          metadata: expect.objectContaining({
            contentType: 'image/jpeg',
            uploadType: 'image',
            cacheControl: 'private, no-store',
            cachePolicy: 'no-store',
          }),
        }),
        expect.anything()
      );
    });

    it('never fails the upload when analytics is unreachable', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('connection refused'));
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/b.jpg' });
      const file = {
        originalname: 'b.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 512,
      } as Express.Multer.File;

      await expect(service.uploadImage(file)).resolves.toBeDefined();
    });
  });

  describe('per-key CDN purge when caching is disabled', () => {
    // This suite has no global afterEach clearAllMocks, so call history can
    // bleed across tests — start each test with a clean slate.
    beforeEach(() => {
      mockInvalidationQueue.enqueue.mockClear();
      mockInvalidationQueue.enqueue.mockResolvedValue({ queued: true });
    });

    it('enqueues exactly the uploaded key when media_cdn_edge_cache is off', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      mockS3Service.uploadFile.mockResolvedValue({
        url: 'https://example.com/v.mp4',
        key: 'videos/v.mp4',
      });
      const file = {
        originalname: 'v.mp4',
        mimetype: 'video/mp4',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;

      await service.uploadVideo(file);

      // The no-store response must not be shadowed by a stale edge copy of
      // the same key (e.g. from when caching was on). The eviction is
      // queue-only: batched drain later coalesces it into one call.
      expect(mockInvalidationQueue.enqueue).toHaveBeenCalledWith('videos/v.mp4', 'reupload');
    });

    it('does not enqueue when caching is enabled (the new object is the cache)', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      );
      mockS3Service.uploadFile.mockResolvedValue({
        url: 'https://example.com/a.jpg',
        key: 'images/a.jpg',
      });
      const file = {
        originalname: 'a.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 512,
      } as Express.Multer.File;

      await service.uploadImage(file);

      expect(mockInvalidationQueue.enqueue).not.toHaveBeenCalled();
    });

    it('never fails the upload when the queue enqueue errors', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      mockInvalidationQueue.enqueue.mockRejectedValueOnce(new Error('db down'));
      mockS3Service.uploadFile.mockResolvedValue({
        url: 'https://example.com/c.jpg',
        key: 'images/c.jpg',
      });
      const file = {
        originalname: 'c.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 512,
      } as Express.Multer.File;

      await expect(service.uploadImage(file)).resolves.toBeDefined();
    });
  });

  describe('deleteFile (blob + queued CDN invalidation)', () => {
    beforeEach(() => {
      mockInvalidationQueue.enqueue.mockClear();
      mockInvalidationQueue.enqueue.mockResolvedValue({ queued: true });
      mockPrismaService.mediaUpload.findMany.mockClear();
      mockPrismaService.mediaUpload.update.mockClear();
      mockPrismaService.$transaction.mockClear();
    });

    it('deletes the blob and enqueues the edge invalidation for the key', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await service.deleteFile('videos/gone.mp4');

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('videos/gone.mp4');
      // Edge invalidation is queue-only: the batched drain later coalesces
      // this with any other pending deletes into ONE CloudFront call.
      expect(mockInvalidationQueue.enqueue).toHaveBeenCalledWith('videos/gone.mp4', 'delete');
    });

    it('propagates an S3 failure and never enqueues for a failed delete', async () => {
      mockS3Service.deleteFile.mockRejectedValueOnce(new Error('S3 unreachable'));

      await expect(service.deleteFile('videos/gone.mp4')).rejects.toThrow('S3 unreachable');
      // Invalidation must NOT fire for a failed delete — nothing changed.
      expect(mockInvalidationQueue.enqueue).not.toHaveBeenCalled();
    });

    it('stamps cdnPurgeStatus=queued on the media_uploads row (delete-time track)', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'row-1', metadata: { scanStatus: 'clean' } },
        { id: 'row-2', metadata: null },
      ]);

      await service.deleteFile('videos/gone.mp4');

      expect(mockPrismaService.mediaUpload.findMany).toHaveBeenCalledWith({
        where: { key: 'videos/gone.mp4' },
        select: { id: true, metadata: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.mediaUpload.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: {
          metadata: { scanStatus: 'clean', cdnPurgeStatus: 'queued' },
        },
      });
      expect(mockPrismaService.mediaUpload.update).toHaveBeenCalledWith({
        where: { id: 'row-2' },
        data: {
          metadata: { cdnPurgeStatus: 'queued' },
        },
      });
    });

    it('marks the row failed when the enqueue itself errors (nightly reconcile picks it up)', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockInvalidationQueue.enqueue.mockRejectedValueOnce(new Error('db down'));
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([
        { id: 'row-1', metadata: null },
      ]);

      await service.deleteFile('videos/gone.mp4');

      expect(mockPrismaService.mediaUpload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              cdnPurgeStatus: 'failed',
              cdnPurgeError: 'db down',
            }),
          }),
        })
      );
    });

    it('never fails the delete when the outcome write errors', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.mediaUpload.findMany.mockRejectedValueOnce(new Error('db down'));

      await expect(service.deleteFile('videos/gone.mp4')).resolves.toBeUndefined();
    });

    it('skips the DB write entirely when no row references the key', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([]);

      await service.deleteFile('videos/never-tracked.mp4');

      expect(mockPrismaService.mediaUpload.update).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('never fails the delete when enqueueing errors and no rows exist', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockInvalidationQueue.enqueue.mockRejectedValueOnce(new Error('queue db down'));
      mockPrismaService.mediaUpload.findMany.mockResolvedValueOnce([]);

      await expect(service.deleteFile('videos/gone.mp4')).resolves.toBeUndefined();
    });

    it('does not touch the row when upload-time eviction purges (track=false)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      mockS3Service.uploadFile.mockResolvedValue({ url: 'https://example.com/r.jpg', key: 'images/r.jpg' });
      const file = {
        originalname: 'r.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 512,
      } as Express.Multer.File;

      await service.uploadImage(file);

      expect(mockInvalidationQueue.enqueue).toHaveBeenCalledWith('images/r.jpg', 'reupload');
      expect(mockPrismaService.mediaUpload.findMany).not.toHaveBeenCalled();
    });
  });

  describe('cache TTLs configurable via env', () => {
    // ConfigService returns the raw .env value (a string) when set; the
    // constructor must parse it and fall back on garbage.
    const env: Record<string, string | number> = {
      MEDIA_CACHE_TTL_IMAGE: '86400',
      MEDIA_CACHE_TTL_VIDEO: '172800',
      MEDIA_CACHE_TTL_AUDIO: '1209600',
      MEDIA_CACHE_TTL_DOCUMENT: '1209600',
      MEDIA_CACHE_TTL_DEFAULT: '7200',
    };

    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string, fallback?: unknown) =>
        key in env ? env[key] : fallback
      );
      // Implementations persist across clearAllMocks: re-establish the flag
      // default in case an earlier test left isEnabled=false.
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      );
      // TTLs are read once at construction, so rebuild the service with the
      // env mock in place (the module-level beforeEach compiled with the
      // default mock, which yields the fallback TTLs).
      service = new UploadService(
        mockS3Service as unknown as S3Service,
        mockConfigService as unknown as ConfigService,
        mockRedisService as unknown as RedisService,
        mockFileValidationService as unknown as FileValidationService,
        mockFeatureFlagService as unknown as FeatureFlagService,
        mockInvalidationQueue as unknown as CdnInvalidationQueueService,
        mockPrismaService as unknown as PrismaService
      );
    });

    afterEach(() => {
      mockConfigService.get.mockReset();
    });

    async function upload(mimetype: string) {
      const file = {
        originalname: 'file',
        mimetype,
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      return service.uploadImage(file);
    }

    it('uses the env-tuned TTLs per content type', async () => {
      expect((await upload('image/jpeg')).cacheControl).toBe('public, max-age=86400, immutable');
      expect((await upload('image/jpeg')).cachePolicy).toBe('immutable');
      expect((await upload('video/mp4')).cacheControl).toBe('public, max-age=172800');
      expect((await upload('video/mp4')).cachePolicy).toBe('medium-lived');
      expect((await upload('audio/mpeg')).cacheControl).toBe('public, max-age=1209600');
      expect((await upload('audio/mpeg')).cachePolicy).toBe('long-lived');
      expect((await upload('application/pdf')).cacheControl).toBe('public, max-age=1209600');
      expect((await upload('application/pdf')).cachePolicy).toBe('long-lived');
      expect((await upload('text/plain')).cacheControl).toBe('public, max-age=7200');
      expect((await upload('text/plain')).cachePolicy).toBe('short-lived');
    });

    it('re-bands the policy when a tuned TTL crosses a band boundary', async () => {
      env.MEDIA_CACHE_TTL_VIDEO = '1209600'; // 14 days — same as audio default
      service = new UploadService(
        mockS3Service as unknown as S3Service,
        mockConfigService as unknown as ConfigService,
        mockRedisService as unknown as RedisService,
        mockFileValidationService as unknown as FileValidationService,
        mockFeatureFlagService as unknown as FeatureFlagService,
        mockInvalidationQueue as unknown as CdnInvalidationQueueService,
        mockPrismaService as unknown as PrismaService
      );
      const video = await upload('video/mp4');
      expect(video.cacheControl).toBe('public, max-age=1209600');
      // Policy tracks the resolved TTL, not the content type.
      expect(video.cachePolicy).toBe('long-lived');
    });

    it('keeps the immutable directive on images regardless of TTL', async () => {
      expect((await upload('image/png')).cacheControl).toBe('public, max-age=86400, immutable');
    });

    it('falls back to defaults when an env TTL is invalid', async () => {
      env.MEDIA_CACHE_TTL_VIDEO = 'not-a-number';
      // Rebuild so the invalid value is what the constructor sees.
      service = new UploadService(
        mockS3Service as unknown as S3Service,
        mockConfigService as unknown as ConfigService,
        mockRedisService as unknown as RedisService,
        mockFileValidationService as unknown as FileValidationService,
        mockFeatureFlagService as unknown as FeatureFlagService,
        mockInvalidationQueue as unknown as CdnInvalidationQueueService,
        mockPrismaService as unknown as PrismaService
      );
      expect((await upload('video/mp4')).cacheControl).toBe('public, max-age=86400');
    });
  });

  describe('chunked upload (media_upload_chunked)', () => {
    const session = {
      userId: 'user-1',
      filename: 'movie.mp4',
      contentType: 'video/mp4',
      totalChunks: 2,
      uploadType: 'video',
      received: [0, 1],
      createdAt: Date.now(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === mediaFlags.uploadChunked)
      );
    });

    it('creates a session and stores it in Redis', async () => {
      const result = await service.initChunkedUpload(
        {
          filename: 'movie.mp4',
          contentType: 'video/mp4',
          totalChunks: 2,
          uploadType: 'video',
        },
        'user-1'
      );

      expect(result.uploadId).toBeTruthy();
      expect(result.totalChunks).toBe(2);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^chunked_upload:/),
        expect.stringContaining('"totalChunks":2'),
        24 * 3600
      );
    });

    it('rejects init when the flag is off (fail-closed)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      await expect(
        service.initChunkedUpload({
          filename: 'a.mp4',
          contentType: 'video/mp4',
          totalChunks: 1,
          uploadType: 'video',
        })
      ).rejects.toThrow(ForbiddenException);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('stores a chunk to staging and records progress', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify({ ...session, received: [0] }));

      const file = {
        originalname: 'c1',
        mimetype: 'video/mp4',
        buffer: Buffer.from('chunk-1'),
        size: 7,
      } as Express.Multer.File;

      const result = await service.uploadChunk('session-1', 1, file);

      expect(mockS3Service.putBuffer).toHaveBeenCalledWith(
        expect.stringContaining('uploads/chunks/session-1/1'),
        file.buffer,
        'video/mp4'
      );
      expect(result.received).toBe(2);
      expect(result.totalChunks).toBe(2);
    });

    it('rejects a duplicate chunk index', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(session));
      const file = {
        originalname: 'c0',
        mimetype: 'video/mp4',
        buffer: Buffer.from('x'),
        size: 1,
      } as Express.Multer.File;

      await expect(service.uploadChunk('session-1', 0, file)).rejects.toThrow(BadRequestException);
      expect(mockS3Service.putBuffer).not.toHaveBeenCalled();
    });

    it('assembles all chunks through the validated upload path and cleans up', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(session));
      mockS3Service.getObjectBuffer
        .mockResolvedValueOnce(Buffer.from('part-a'))
        .mockResolvedValueOnce(Buffer.from('part-b'));
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'videos/abc.mp4',
        url: 'https://example.com/videos/abc.mp4',
        cdnUrl: 'https://cdn.example.com/videos/abc.mp4',
        duration: 60,
      });
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      const result = await service.completeChunkedUpload('session-1');

      // Assembled buffer 'part-apart-b' passed through uploadVideo.
      expect(mockS3Service.uploadFile).toHaveBeenCalled();
      expect(result.key).toBe('videos/abc.mp4');
      // Staging chunks + session cleaned up.
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('uploads/chunks/session-1/0')
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(expect.stringMatching(/^chunked_upload:/));
    });

    it('rejects completing an incomplete session', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify({ ...session, received: [0] }));

      await expect(service.completeChunkedUpload('session-1')).rejects.toThrow(BadRequestException);
      expect(mockS3Service.getObjectBuffer).not.toHaveBeenCalled();
    });
  });

  describe('virus scan (media_virus_scan)', () => {
    const mockFile = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 1024,
    } as Express.Multer.File;

    it('skips scanning entirely while the flag is off', async () => {
      jest.clearAllMocks();
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== mediaFlags.virusScan && key !== mediaFlags.uploadChunked)
      );
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'documents/x.pdf',
        url: 'https://example.com/x.pdf',
      });

      const result = await service.uploadDocument(mockFile);

      expect(result.scanStatus).toBeUndefined();
      expect(mockedAxios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/scan'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('rejects the upload when scanning is on but no scanner is configured (fail-closed)', async () => {
      jest.clearAllMocks();
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === mediaFlags.virusScan)
      );
      mockConfigService.get.mockReturnValue(undefined);
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'documents/x.pdf',
        url: 'https://example.com/x.pdf',
      });

      await expect(service.uploadDocument(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('returns scanStatus clean when the scanner confirms', async () => {
      jest.clearAllMocks();
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === mediaFlags.virusScan)
      );
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'MEDIA_VIRUS_SCAN_URL') return 'http://scanner:8080';
        return undefined;
      });
      mockedAxios.post.mockResolvedValue({ data: { clean: true } });
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'documents/x.pdf',
        url: 'https://example.com/x.pdf',
      });

      const result = await service.uploadDocument(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/scan'),
        expect.objectContaining({ key: 'documents/x.pdf', mimetype: 'application/pdf' }),
        expect.any(Object)
      );
      expect(result.scanStatus).toBe('clean');
    });

    it('rejects the upload when the scanner reports a non-clean verdict', async () => {
      jest.clearAllMocks();
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === mediaFlags.virusScan)
      );
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'MEDIA_VIRUS_SCAN_URL') return 'http://scanner:8080';
        return undefined;
      });
      mockedAxios.post.mockResolvedValue({ data: { clean: false } });
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'documents/x.pdf',
        url: 'https://example.com/x.pdf',
      });

      await expect(service.uploadDocument(mockFile)).rejects.toThrow(BadRequestException);
    });
  });
});
