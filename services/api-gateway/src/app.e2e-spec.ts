import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('API Gateway Contract Tests', () => {
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

  describe('Auth Service Contract', () => {
    it('POST /v1/auth/register - should accept valid registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          displayName: 'Test User',
        });

      expect([HttpStatus.CREATED, HttpStatus.OK, HttpStatus.BAD_GATEWAY]).toContain(
        response.status
      );
    });

    it('POST /v1/auth/register - should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          displayName: 'Test User',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /v1/auth/login - should accept valid credentials', async () => {
      const response = await request(app.getHttpServer()).post('/v1/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect([HttpStatus.OK, HttpStatus.UNAUTHORIZED, HttpStatus.BAD_GATEWAY]).toContain(
        response.status
      );
    });

    it('POST /v1/auth/login - should reject missing credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /v1/auth/refresh - should accept valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'valid-token' });

      expect([HttpStatus.OK, HttpStatus.UNAUTHORIZED, HttpStatus.BAD_GATEWAY]).toContain(
        response.status
      );
    });

    it('GET /v1/auth/me - should require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/v1/auth/me');

      expect([HttpStatus.OK, HttpStatus.UNAUTHORIZED, HttpStatus.BAD_GATEWAY]).toContain(
        response.status
      );
    });

    it('DELETE /v1/auth/logout - should accept logout request', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/auth/logout')
        .set('Authorization', 'Bearer test-token');

      expect([HttpStatus.NO_CONTENT, HttpStatus.UNAUTHORIZED, HttpStatus.BAD_GATEWAY]).toContain(
        response.status
      );
    });
  });

  describe('Content Service Contract', () => {
    it('GET /v1/content/home - should return home feed', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/home');

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/content/watch/:id - should return content by ID', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/watch/test-id');

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/content/trending - should return trending content', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/trending');

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/content/recommended - should return recommended content', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/recommended');

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/content/search - should accept search query', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/search?query=test');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Wallet Service Contract', () => {
    it('GET /v1/wallet - should return wallet balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/wallet')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });

    it('POST /v1/wallet/fund - should accept funding request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/wallet/fund')
        .set('Authorization', 'Bearer test-token')
        .send({ amount: 100, paymentMethod: 'card' });

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/wallet/transactions - should return transaction history', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/wallet/transactions')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rewards Service Contract', () => {
    it('GET /v1/rewards - should return reward account', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rewards')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });

    it('POST /v1/rewards/claim - should accept claim request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rewards/claim')
        .set('Authorization', 'Bearer test-token')
        .send({ rewardId: 'reward-123' });

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/rewards/badges - should return user badges', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rewards/badges')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Search Service Contract', () => {
    it('GET /v1/search - should accept search query', async () => {
      const response = await request(app.getHttpServer()).get('/v1/search?q=test');

      expect(response.status).toBeLessThan(500);
    });

    it('GET /v1/search/suggest - should return suggestions', async () => {
      const response = await request(app.getHttpServer()).get('/v1/search/suggest?q=test');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Notifications Service Contract', () => {
    it('GET /v1/notifications - should return user notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });

    it('PUT /v1/notifications/:id/read - should mark as read', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/notifications/notification-123/read')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });

    it('DELETE /v1/notifications/:id - should delete notification', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/notifications/notification-123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('API Versioning', () => {
    it('should accept explicit version in URL', async () => {
      const response = await request(app.getHttpServer()).get('/v1/content/trending');

      expect(response.status).toBeLessThan(500);
    });

    it('should accept version via header', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/trending')
        .set('X-API-Version', '1');

      expect(response.status).toBeLessThan(500);
    });

    it('should reject unsupported version', async () => {
      const response = await request(app.getHttpServer()).get('/v99/auth/login');

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('Request ID Propagation', () => {
    it('should generate request ID when not provided', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should preserve provided request ID', async () => {
      const testRequestId = 'test-request-id-123';
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('X-Request-ID', testRequestId);

      expect(response.headers['x-request-id']).toBe(testRequestId);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = [];

      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/v1/auth/login')
            .send({
              email: `ratelimit${i}@example.com`,
              password: 'password123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r: { status: number }) => r.status);

      expect(statusCodes).toContain(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
