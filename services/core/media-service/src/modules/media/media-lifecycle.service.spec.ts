import { Test, TestingModule } from '@nestjs/testing';
import { MediaLifecycleService } from './media-lifecycle.service';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '@azeebo/shared-services';

describe('MediaLifecycleService', () => {
  let service: MediaLifecycleService;

  const mockPrisma = {
    transcodingJob: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mediaUpload: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockCache = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaLifecycleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<MediaLifecycleService>(MediaLifecycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purgeCDN', () => {
    it('should purge URLs and patterns', async () => {
      const result = await service.purgeCDN({
        urls: ['https://cdn.example.com/video.mp4'],
        patterns: ['/static/*'],
      });

      expect(result.purged).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty request', async () => {
      const result = await service.purgeCDN({ urls: [] });

      expect(result.purged).toBe(0);
    });
  });

  describe('getTranscodingStatus', () => {
    it('should return transcoding status', async () => {
      mockPrisma.transcodingJob.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'processing',
      });

      const result = await service.getTranscodingStatus('job-1');

      expect(result).toEqual({ id: 'job-1', status: 'processing' });
    });

    it('should return null when job not found', async () => {
      mockPrisma.transcodingJob.findUnique.mockResolvedValue(null);

      const result = await service.getTranscodingStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateTranscodingStatus', () => {
    it('should update transcoding status', async () => {
      mockPrisma.transcodingJob.findUnique.mockResolvedValue({ id: 'job-1' });
      mockPrisma.transcodingJob.update.mockResolvedValue({});

      await service.updateTranscodingStatus('job-1', { status: 'completed' });

      expect(mockPrisma.transcodingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'completed' },
      });
    });

    it('should not throw when job not found', async () => {
      mockPrisma.transcodingJob.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTranscodingStatus('nonexistent', { status: 'completed' })
      ).resolves.not.toThrow();
    });
  });

  describe('cleanupOrphanedMedia', () => {
    it('should delete orphaned media uploads', async () => {
      mockPrisma.mediaUpload.findMany.mockResolvedValue([
        { id: 'upload-1', metadata: { orphaned: true } },
        { id: 'upload-2', metadata: {} },
      ]);
      mockPrisma.mediaUpload.deleteMany.mockResolvedValue({ count: 1 });
      mockCache.delete.mockResolvedValue(undefined);

      const result = await service.cleanupOrphanedMedia();

      expect(result.cleaned).toBe(1);
      expect(mockPrisma.mediaUpload.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['upload-1'] } },
      });
    });

    it('should return 0 cleaned when no orphans', async () => {
      mockPrisma.mediaUpload.findMany.mockResolvedValue([]);

      const result = await service.cleanupOrphanedMedia();

      expect(result.cleaned).toBe(0);
    });
  });

  describe('generatePremiumUrl', () => {
    it('should generate URL with expiration', async () => {
      mockPrisma.mediaUpload.findUnique.mockResolvedValue({
        id: 'upload-1',
        cdnUrl: 'https://cdn.example.com/premium.mp4',
        fileName: 'premium.mp4',
      });

      const result = await service.generatePremiumUrl('upload-1', { expiresIn: 7200 });

      expect(result.url).toBe('https://cdn.example.com/premium.mp4');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should use default CDN URL when cdnUrl not set', async () => {
      mockPrisma.mediaUpload.findUnique.mockResolvedValue({
        id: 'upload-1',
        cdnUrl: null,
        fileName: 'video.mp4',
      });

      const result = await service.generatePremiumUrl('upload-1');

      expect(result.url).toContain('video.mp4');
    });

    it('should throw when media not found', async () => {
      mockPrisma.mediaUpload.findUnique.mockResolvedValue(null);

      await expect(service.generatePremiumUrl('nonexistent')).rejects.toThrow('not found');
    });
  });
});
