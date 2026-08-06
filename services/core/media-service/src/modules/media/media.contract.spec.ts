import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { UploadModule } from '../upload/upload.module';
import { UploadService } from '../upload/upload.service';
import { S3Service } from '../upload/s3.service';
import { PremiumContentService } from '../upload/premium-content.service';
import { RedisService } from '@azeebo/shared-services';
import { FileValidationService } from '../../common/services/file-validation.service';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';

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
      imports: [UploadModule],
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
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
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
      });

      const response = await request(app.getHttpServer())
        .post('/media/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(201);
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
