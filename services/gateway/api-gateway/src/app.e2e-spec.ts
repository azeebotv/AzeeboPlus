import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('API Gateway Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Gateway Health Check', () => {
    it('should respond with 200 OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('Route Validation', () => {
    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/nonexistent-route-12345')
        .expect(404);
    });
  });

  describe('API Gateway Response Format', () => {
    it('should return JSON response', async () => {
      const response = await request(app.getHttpServer()).get('/health');
      expect(response.type).toBe('application/json');
    });
  });
});
