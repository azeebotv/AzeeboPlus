import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Creator Portal (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/health (GET)', () => {
      return app.getHttpServer().get('/health').expect(200);
    });
  });

  describe('Creator Dashboard', () => {
    it('should require authentication for dashboard', () => {
      return app.getHttpServer().get('/creator/dashboard').expect(401);
    });
  });

  describe('Creator Content', () => {
    it('should require authentication for content listing', () => {
      return app.getHttpServer().get('/creator/content').expect(401);
    });
  });

  describe('Creator Earnings', () => {
    it('should require authentication for earnings', () => {
      return app.getHttpServer().get('/creator/earnings').expect(401);
    });
  });

  describe('Creator Analytics', () => {
    it('should require authentication for analytics', () => {
      return app.getHttpServer().get('/creator/analytics').expect(401);
    });
  });
});
