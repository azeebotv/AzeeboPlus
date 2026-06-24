import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MediaModule } from './media.module';
import { MediaRepository } from './media.repository';
import { JwtService } from '@nestjs/jwt';

describe('Media Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MediaModule],
    })
      .overrideProvider(MediaRepository)
      .useValue({
        upload: jest.fn(),
        findById: jest.fn(),
        delete: jest.fn(),
        listByUserId: jest.fn(),
        generateUploadUrl: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /media/upload', () => {
    it('should upload media', async () => {
      const mediaRepository = app.get(MediaRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(mediaRepository, 'upload').mockResolvedValue({
        id: 'media-123',
        userId: 'user-123',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        url: 'https://storage.example.com/test.jpg',
        thumbnailUrl: 'https://storage.example.com/test_thumb.jpg',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'media-123',
          url: expect.any(String),
        }),
      });
    });
  });

  describe('GET /media/:id', () => {
    it('should get media details', async () => {
      const mediaRepository = app.get(MediaRepository);

      jest.spyOn(mediaRepository, 'findById').mockResolvedValue({
        id: 'media-123',
        userId: 'user-123',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        url: 'https://storage.example.com/test.jpg',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer()).get('/media/media-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'media-123',
          url: expect.any(String),
        }),
      });
    });

    it('should return not found', async () => {
      const mediaRepository = app.get(MediaRepository);

      jest.spyOn(mediaRepository, 'findById').mockResolvedValue(null);

      const response = await request(app.getHttpServer()).get('/media/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      });
    });
  });

  describe('DELETE /media/:id', () => {
    it('should delete media', async () => {
      const mediaRepository = app.get(MediaRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(mediaRepository, 'delete').mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .delete('/media/media-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });
});
