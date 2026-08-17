import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Creator Portal (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

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
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/health (GET)', () => {
      return request(baseUrl).get('/health').expect(200);
    });
  });

  describe('Creator Dashboard', () => {
    it('should require authentication for dashboard', () => {
      return request(baseUrl).get('/creator/dashboard').expect(401);
    });
  });

  describe('Creator Content', () => {
    it('should require authentication for content listing', () => {
      return request(baseUrl).get('/creator/content').expect(401);
    });
  });

  describe('Creator Earnings', () => {
    it('should require authentication for earnings', () => {
      return request(baseUrl).get('/creator/earnings').expect(401);
    });
  });

  describe('Creator Analytics', () => {
    it('should require authentication for analytics', () => {
      return request(baseUrl).get('/creator/analytics').expect(401);
    });
  });
});
