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
 * Unit spec for the idempotent DELETE /media/:key handler.
 *
 * The handler's contract:
 *  - S3 NotFound during the metadata probe is absorbed as a success with
 *    `alreadyGone: true` (same semantics as an S3 DELETE of a missing key).
 *  - Any other probe failure propagates — notably a circuit-open outage,
 *    which must surface as 503 and never be mistaken for a completed delete.
 *  - When the object exists, only its owner (or an admin) may delete it.
 */
describe('UploadController DELETE /media/:key (idempotent)', () => {
  let controller: UploadController;

  const mockUploadService = {
    getFileMetadata: jest.fn(),
    deleteFile: jest.fn(),
  };

  const ownerUser = { id: 'user-1', role: 'user' };
  const adminUser = { id: 'admin-9', role: 'admin' };

  const objectOwnedByUser1 = {
    contentType: 'video/mp4',
    contentLength: 1024,
    lastModified: new Date('2026-09-17T09:00:00Z'),
    metadata: { userId: 'user-1' },
  };

  const objectWithNoOwnerMetadata = { ...objectOwnedByUser1, metadata: undefined };

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

  describe('NotFound absorption (idempotent re-delete)', () => {
    it('returns alreadyGone success when the object does not exist, without calling deleteFile', async () => {
      const notFound = Object.assign(new Error('The specified key does not exist.'), {
        name: 'NotFound',
      });
      mockUploadService.getFileMetadata.mockRejectedValue(notFound);

      const result = await controller.deleteFile(
        { user: ownerUser },
        'videos/gone.mp4'
      );

      expect(result).toEqual(
        ApiResponseWrapper.success({
          message: 'File deleted successfully',
          alreadyGone: true,
        })
      );
      expect(mockUploadService.getFileMetadata).toHaveBeenCalledWith('videos/gone.mp4');
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('decodes the URL-encoded key before probing and deleting', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectOwnedByUser1);
      mockUploadService.deleteFile.mockResolvedValue(undefined);

      await controller.deleteFile({ user: ownerUser }, 'videos%2Fmy%20clip.mp4');

      expect(mockUploadService.getFileMetadata).toHaveBeenCalledWith('videos/my clip.mp4');
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('videos/my clip.mp4');
    });

    it('still rejects traversal-style keys before any S3 call', async () => {
      await expect(
        controller.deleteFile({ user: ownerUser }, '..%2F..%2Fetc%2Fpasswd')
      ).rejects.toThrow(BadRequestException);
      expect(mockUploadService.getFileMetadata).not.toHaveBeenCalled();
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('ownership enforcement', () => {
    it('deletes when the caller owns the object', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectOwnedByUser1);
      mockUploadService.deleteFile.mockResolvedValue(undefined);

      const result = await controller.deleteFile({ user: ownerUser }, 'videos/owned.mp4');

      expect(result).toEqual(
        ApiResponseWrapper.success({ message: 'File deleted successfully' })
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('videos/owned.mp4');
    });

    it('throws Forbidden when a non-owner non-admin tries to delete someone else’s file', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectOwnedByUser1);

      const otherUser = { id: 'user-2', role: 'user' };
      await expect(
        controller.deleteFile({ user: otherUser }, 'videos/owned.mp4')
      ).rejects.toThrow(ForbiddenException);
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('allows an admin to delete a file they do not own', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectOwnedByUser1);
      mockUploadService.deleteFile.mockResolvedValue(undefined);

      const result = await controller.deleteFile({ user: adminUser }, 'videos/owned.mp4');

      expect(result).toEqual(
        ApiResponseWrapper.success({ message: 'File deleted successfully' })
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('videos/owned.mp4');
    });

    it('allows deletion when the object carries no owner metadata (legacy objects)', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectWithNoOwnerMetadata);
      mockUploadService.deleteFile.mockResolvedValue(undefined);

      const otherUser = { id: 'user-2', role: 'user' };
      const result = await controller.deleteFile({ user: otherUser }, 'videos/legacy.mp4');

      expect(result).toEqual(
        ApiResponseWrapper.success({ message: 'File deleted successfully' })
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('videos/legacy.mp4');
    });
  });

  describe('circuit-open passthrough', () => {
    it('propagates a circuit-open 503 from the metadata probe instead of absorbing it', async () => {
      const circuitOpen = new ServiceUnavailableException(
        'File metadata service temporarily unavailable. Please try again later.'
      );
      mockUploadService.getFileMetadata.mockRejectedValue(circuitOpen);

      await expect(
        controller.deleteFile({ user: ownerUser }, 'videos/live.mp4')
      ).rejects.toThrow(ServiceUnavailableException);
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('propagates a circuit-open 503 raised by the actual delete call', async () => {
      mockUploadService.getFileMetadata.mockResolvedValue(objectOwnedByUser1);
      mockUploadService.deleteFile.mockRejectedValue(
        new ServiceUnavailableException(
          'File deletion service temporarily unavailable. Please try again later.'
        )
      );

      await expect(
        controller.deleteFile({ user: ownerUser }, 'videos/live.mp4')
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('re-throws arbitrary non-NotFound probe errors unchanged', async () => {
      const boom = new Error('socket hang up');
      mockUploadService.getFileMetadata.mockRejectedValue(boom);

      await expect(
        controller.deleteFile({ user: ownerUser }, 'videos/live.mp4')
      ).rejects.toThrow(boom);
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });
  });
});
