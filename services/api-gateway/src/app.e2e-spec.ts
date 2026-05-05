import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('API Gateway (e2e)', () => {
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
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('should pass health check', () => {
      return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
    });

    it('should pass readiness check', () => {
      return request(app.getHttpServer()).get('/ready').expect(200);
    });

    it('should pass liveness check', () => {
      return request(app.getHttpServer()).get('/live').expect(200);
    });
  });

  describe('Auth Service Proxy', () => {
    it('should proxy register request', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          displayName: 'Test User',
        })
        .expect(201);
    });

    it('should reject invalid registration', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);
    });

    it('should proxy login request', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('Content Service Proxy', () => {
    it('should proxy get home feed', async () => {
      const response = await request(app.getHttpServer()).get('/content/home-feed');

      expect(response.status).toBeLessThan(500);
    });

    it('should proxy get trending content', async () => {
      const response = await request(app.getHttpServer()).get('/content/trending');

      expect(response.status).toBeLessThan(500);
    });

    it('should proxy search content', async () => {
      const response = await request(app.getHttpServer()).get('/content/search?query=test');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: `ratelimit${i}@example.com`,
              password: 'password123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r) => r.status);

      expect(statusCodes).toContain(429);
    });
  });
});
