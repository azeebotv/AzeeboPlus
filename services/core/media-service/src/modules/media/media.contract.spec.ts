import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { UploadModule } from '../upload/upload.module';
import { UploadService } from '../upload/upload.service';
import { S3Service } from '../upload/s3.service';
import { PremiumContentService } from '../upload/premium-content.service';
import { AdminModule } from '../admin/admin.module';
import { RedisService } from '@azeebo/shared-services';
import { FileValidationService } from '../../common/services/file-validation.service';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { FeatureFlagGuard, FeatureFlagModule, FeatureFlagService } from '@azeebo/feature-flags';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

class MockAdminGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

describe('Media Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      // FeatureFlagModule is registered globally in the real app.module; the
      // contract spec imports it the same way so child-module providers (e.g.
      // CdnFlagPurgeQueueService) can resolve FeatureFlagService before the
      // override below replaces it with the mock.
      imports: [
        UploadModule,
        AdminModule,
        // Stub redis so the real (soon-overridden) FeatureFlagService never
        // opens a connection that would keep the test worker alive.
        FeatureFlagModule.register({ global: true, redis: { quit: jest.fn() } as never }),
      ],
    })
      .overrideProvider(UploadService)
      .useValue({
        uploadImage: jest.fn(),
        uploadVideo: jest.fn(),
        uploadAudio: jest.fn(),
        uploadDocument: jest.fn(),
        uploadThumbnail: jest.fn(),
        uploadAvatar: jest.fn(),
        uploadBanner: jest.fn(),
        getPresignedDownloadUrl: jest.fn(),
        getPresignedUploadUrl: jest.fn(),
        deleteFile: jest.fn(),
        getFileMetadata: jest.fn(),
      })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn(),
        getSignedDownloadUrl: jest.fn(),
        getSignedUploadUrl: jest.fn(),
        deleteFile: jest.fn(),
        getFileMetadata: jest.fn(),
        generateKey: jest.fn(),
        cleanupOrphanedFiles: jest.fn(),
      })
      .overrideProvider(PremiumContentService)
      .useValue({
        generatePremiumUrl: jest.fn(),
        generateCdnPremiumUrl: jest.fn(),
        validatePremiumUrl: jest.fn(),
        invalidatePremiumUrl: jest.fn(),
        invalidateAllUserUrls: jest.fn(),
        getUrlAnalytics: jest.fn(),
      })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
      })
      .overrideProvider(FileValidationService)
      .useValue({
        validateFile: jest.fn(),
        validatePresignedUpload: jest.fn(),
      })
      .overrideProvider(FeatureFlagService)
      .useValue({ isEnabled: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .overrideGuard(FeatureFlagGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseWrapperInterceptor());
    // Mock ServiceAuthGuard behavior: set req.user when Authorization header present
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer ') &&
          !req.user
        ) {
          req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
        }
        next();
      }
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /admin/cdn/purge', () => {
    it('should accept a prefix purge request', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/cdn/purge')
        .set('Authorization', 'Bearer valid-token')
        .send({ prefix: 'uploads' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prefix).toBe('uploads');
      expect(response.body.data).toHaveProperty('purged');
    });

    it('should reject a purge with no target', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/cdn/purge')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /media/upload/image', () => {
    it('should upload image', async () => {
      const uploadService = app.get(UploadService);

      jest.spyOn(uploadService, 'uploadImage').mockResolvedValue({
        key: 'images/test.jpg',
        url: 'https://storage.example.com/test.jpg',
        cdnUrl: 'https://cdn.example.com/test.jpg',
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        cacheControl: 'public, max-age=31536000, immutable',
        cachePolicy: 'immutable',
      });

      const response = await request(app.getHttpServer())
        .post('/media/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(201);
      // CDN cache-control header comes from media_cdn_edge_cache.
      expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          key: 'images/test.jpg',
          url: expect.any(String),
        }),
      });
    });
  });

  describe('GET /media/metadata', () => {
    it('should get file metadata', async () => {
      const uploadService = app.get(UploadService);

      jest.spyOn(uploadService, 'getFileMetadata').mockResolvedValue({
        contentType: 'image/jpeg',
        contentLength: 1024,
        lastModified: new Date(),
        metadata: {},
      });

      const response = await request(app.getHttpServer())
        .get('/media/metadata?key=images/test.jpg')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          contentType: 'image/jpeg',
          contentLength: 1024,
        }),
      });
    });
  });

  describe('DELETE /media/:key', () => {
    it('should delete file', async () => {
      const uploadService = app.get(UploadService);

      jest.spyOn(uploadService, 'deleteFile').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/media/images%2Ftest.jpg')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          message: 'File deleted successfully',
        }),
      });
    });
  });
});
