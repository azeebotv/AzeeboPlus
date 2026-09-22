import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileAccessPolicyService } from './file-access-policy.service';
import { PremiumContentService } from './premium-content.service';
import { CdnInvalidationQueueService } from './cdn-invalidation-queue.service';
import { MediaLifecycleService } from '../media/media-lifecycle.service';
import { BlobReconcileService } from '../media/blob-reconcile.service';
import { UploadTtlSweeperService } from '../media/upload-ttl-sweeper.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { RateLimitService } from '@azeebo/security';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { JwtService } from '@nestjs/jwt';

/**
 * Unit spec for the presigned-URL and metadata GET handlers.
 *
 * Contracts under test:
 *  - getPresignedUploadUrl: only parameter *presence* is validated at the
 *    controller; type/extension/contentType legality is the service's job.
 *    The raw service result is returned unwrapped.
 *  - getPresignedDownloadUrl: three-layer key validation (presence → format
 *    → prefix), a probe of the object's existence that maps a content-type-
 *    less probe result to "File not found", and passthrough of probe
 *    outages (a circuit-open 503 must never be re-mapped to a 4xx).
 *  - getFileMetadata: presence + format validation, raw passthrough of the
 *    service result and of service errors.
 */
describe('UploadController presigned-URL + metadata routes', () => {
  let controller: UploadController;

  const mockUploadService = {
    getFileMetadata: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
  };

  const validMetadata = {
    contentType: 'video/mp4',
    contentLength: 2048,
    lastModified: new Date('2026-09-17T09:00:00Z'),
    metadata: { userId: 'user-1' },
  };

  const presignedUploadResult = {
    uploadUrl: 'https://bucket.s3.amazonaws.com/videos/f.mp4?X-Amz-Signature=abc',
    key: 'videos/f.mp4',
    cdnUrl: 'https://cdn.azeeboplus.com/videos/f.mp4',
    expiresIn: 3600,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        // Guards attached at controller/method level resolve their own deps —
        // stub them so guards instantiate (and stay inert) in this unit context.
        { provide: RateLimitService, useValue: { checkRateLimit: jest.fn() } },
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: UploadService, useValue: mockUploadService },
        // Pure decision logic — the real policy, no mocking needed.
        FileAccessPolicyService,
        { provide: PremiumContentService, useValue: {} },
        { provide: CdnInvalidationQueueService, useValue: { enqueue: jest.fn().mockResolvedValue({ queued: true }) } },
        { provide: MediaLifecycleService, useValue: {} },
        { provide: BlobReconcileService, useValue: {} },
        { provide: UploadTtlSweeperService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get<UploadController>(UploadController);
  });

  describe('GET /media/presigned/upload', () => {
    it('returns the raw service result when all required parameters are present', async () => {
      mockUploadService.getPresignedUploadUrl.mockResolvedValue(presignedUploadResult);

      // @Query values arrive as strings at runtime (the controller's TS
      // signature types them as number via the default — hence the casts);
      // the controller must coerce before calling the service.
      const result = await controller.getPresignedUploadUrl(
        'video',
        'file-1',
        'mp4',
        'video/mp4',
        '3600' as unknown as number
      );

      expect(result).toEqual(presignedUploadResult);
      expect(mockUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'video',
        'file-1',
        'mp4',
        'video/mp4',
        3600
      );
    });

    it('coerces a string expiresIn to a number before calling the service', async () => {
      mockUploadService.getPresignedUploadUrl.mockResolvedValue(presignedUploadResult);

      await controller.getPresignedUploadUrl(
        'video',
        'file-1',
        'mp4',
        'video/mp4',
        '120' as unknown as number
      );

      expect(mockUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'video',
        'file-1',
        'mp4',
        'video/mp4',
        120
      );
    });

    it.each([
      ['type', '', 'file-1', 'mp4', 'video/mp4'],
      ['fileId', 'video', '', 'mp4', 'video/mp4'],
      ['extension', 'video', 'file-1', '', 'video/mp4'],
      ['contentType', 'video', 'file-1', 'mp4', ''],
    ])(
      'rejects with 400 and never calls the service when %s is missing',
      async (_param, type, fileId, extension, contentType) => {
        await expect(
          controller.getPresignedUploadUrl(
            type as 'video',
            fileId,
            extension,
            contentType,
            '3600' as unknown as number
          )
        ).rejects.toThrow(
          new BadRequestException(
            'Missing required parameters: type, fileId, extension, contentType'
          )
        );
        expect(mockUploadService.getPresignedUploadUrl).not.toHaveBeenCalled();
      }
    );

    it('does not validate type legality at the controller (service-owned validation)', async () => {
      // An unknown type passes the presence gate; the service is responsible
      // for rejecting it — the controller must not silently swallow it.
      mockUploadService.getPresignedUploadUrl.mockRejectedValue(
        new BadRequestException('Unsupported upload type')
      );

      await expect(
        controller.getPresignedUploadUrl(
          'hologram' as 'video',
          'f',
          'mp4',
          'video/mp4',
          '3600' as unknown as number
        )
      ).rejects.toThrow(BadRequestException);
      expect(mockUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'hologram',
        'f',
        'mp4',
        'video/mp4',
        3600
      );
    });
  });

  describe('GET /media/presigned/download — key validation', () => {
    it('returns a wrapped URL + expiresIn on the happy path', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);
      mockUploadService.getPresignedDownloadUrl.mockResolvedValue(
        'https://bucket.s3.amazonaws.com/videos/live.mp4?X-Amz-Signature=xyz'
      );

      const result = await controller.getPresignedDownloadUrl(
        'videos/live.mp4',
        '300' as unknown as number
      );

      expect(result).toEqual(
        ApiResponseWrapper.success({
          url: 'https://bucket.s3.amazonaws.com/videos/live.mp4?X-Amz-Signature=xyz',
          expiresIn: 300,
        })
      );
      expect(mockUploadService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'videos/live.mp4',
        300
      );
    });

    it('defaults expiresIn to 3600 when the query parameter is absent', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);
      mockUploadService.getPresignedDownloadUrl.mockResolvedValue('https://signed');

      await controller.getPresignedDownloadUrl('videos/live.mp4');

      expect(mockUploadService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'videos/live.mp4',
        3600
      );
    });

    it('rejects a missing key with 400 and never probes', async () => {
      await expect(controller.getPresignedDownloadUrl('')).rejects.toThrow(
        new BadRequestException('Missing required parameter: key')
      );
      expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
    });

    it.each(['../etc/passwd', 'videos/../../etc/passwd', '/etc/passwd'])(
      'rejects traversal-style key %s with "Invalid key format" before any S3 call',
      async (key) => {
        await expect(controller.getPresignedDownloadUrl(key)).rejects.toThrow(
          new BadRequestException('Invalid key format')
        );
        expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
        expect(mockUploadService.getPresignedDownloadUrl).not.toHaveBeenCalled();
      }
    );

    it('rejects keys outside the allowed prefixes with "Invalid key prefix"', async () => {
      await expect(controller.getPresignedDownloadUrl('secrets/live.mp4')).rejects.toThrow(
        new BadRequestException('Invalid key prefix')
      );
      expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
      expect(mockUploadService.getPresignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('accepts every allowed prefix', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);
      mockUploadService.getPresignedDownloadUrl.mockResolvedValue('https://signed');

      for (const prefix of [
        'uploads/',
        'images/',
        'videos/',
        'audio/',
        'documents/',
        'thumbnails/',
        'avatars/',
        'banners/',
      ]) {
        jest.clearAllMocks();
        mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);
        mockUploadService.getPresignedDownloadUrl.mockResolvedValue('https://signed');

        await expect(controller.getPresignedDownloadUrl(`${prefix}f`)).resolves.toBeDefined();
        expect(mockUploadService.getFileMetadata).toHaveBeenCalledWith(`${prefix}f`);
      }
    });
  });

  describe('GET /media/presigned/download — existence probe + error mapping', () => {
    it('maps a probe result without a contentType to "File not found" and skips URL generation', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue({
        contentType: undefined,
        contentLength: undefined,
        lastModified: undefined,
        metadata: undefined,
      });

      await expect(controller.getPresignedDownloadUrl('videos/gone.mp4')).rejects.toThrow(
        new BadRequestException('File not found')
      );
      expect(mockUploadService.getPresignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('propagates a circuit-open 503 from the probe instead of mapping it to a 4xx', async () => {
      mockUploadService.getFileMetadata.mockRejectedValue(
        new ServiceUnavailableException(
          'File metadata service temporarily unavailable. Please try again later.'
        )
      );

      await expect(controller.getPresignedDownloadUrl('videos/live.mp4')).rejects.toThrow(
        ServiceUnavailableException
      );
      expect(mockUploadService.getPresignedDownloadUrl).not.toHaveBeenCalled();
    });

    it('propagates a circuit-open 503 raised by URL generation itself', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);
      mockUploadService.getPresignedDownloadUrl.mockRejectedValue(
        new ServiceUnavailableException('Signing service temporarily unavailable.')
      );

      await expect(controller.getPresignedDownloadUrl('videos/live.mp4')).rejects.toThrow(
        ServiceUnavailableException
      );
    });

    it('re-throws arbitrary non-shape probe errors unchanged', async () => {
      const boom = new Error('socket hang up');
      mockUploadService.getFileMetadata.mockRejectedValue(boom);

      await expect(controller.getPresignedDownloadUrl('videos/live.mp4')).rejects.toThrow(boom);
    });
  });

  describe('GET /media/metadata', () => {
    it('returns the raw metadata from the service (unwrapped) for the owner', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);

      const result = await controller.getFileMetadata(
        { user: { id: 'user-1', role: 'user' } },
        'videos/live.mp4'
      );

      expect(result).toEqual(validMetadata);
      expect(mockUploadService.getFileMetadata).toHaveBeenCalledWith('videos/live.mp4');
    });

    it('rejects a missing key with 400 and never calls the service', async () => {
      await expect(
        controller.getFileMetadata({ user: { id: 'user-1' } }, '')
      ).rejects.toThrow(new BadRequestException('Missing required parameter: key'));
      expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
    });

    it.each(['../etc/passwd', 'a/../b', '/absolute'])(
      'rejects traversal-style key %s with "Invalid key format" before any S3 call',
      async (key) => {
        await expect(
          controller.getFileMetadata({ user: { id: 'user-1' } }, key)
        ).rejects.toThrow(new BadRequestException('Invalid key format'));
        expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
      }
    );

    it('forbids a non-owner non-admin from reading metadata (ownership shared with delete)', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);

      await expect(
        controller.getFileMetadata({ user: { id: 'user-2', role: 'user' } }, 'videos/live.mp4')
      ).rejects.toThrow(
        new ForbiddenException('You can only read metadata your own files')
      );
    });

    it('allows an admin to read metadata for any object', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(validMetadata);

      const result = await controller.getFileMetadata(
        { user: { id: 'admin-9', role: 'admin' } },
        'videos/live.mp4'
      );
      expect(result).toEqual(validMetadata);
    });

    it('propagates a circuit-open 503 from the service unchanged', async () => {
      mockUploadService.getFileMetadata.mockRejectedValue(
        new ServiceUnavailableException(
          'File metadata service temporarily unavailable. Please try again later.'
        )
      );

      await expect(
        controller.getFileMetadata({ user: { id: 'user-1' } }, 'videos/live.mp4')
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('re-throws arbitrary service errors unchanged', async () => {
      const boom = new Error('connection reset');
      mockUploadService.getFileMetadata.mockRejectedValue(boom);

      await expect(
        controller.getFileMetadata({ user: { id: 'user-1' } }, 'videos/live.mp4')
      ).rejects.toThrow(boom);
    });
  });
});
