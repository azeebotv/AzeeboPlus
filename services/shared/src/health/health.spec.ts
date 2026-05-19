import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('Health Check Endpoints', () => {
  let app: INestApplication;

  const mockHealthService = {
    checkHealth: jest.fn().mockResolvedValue({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
    checkReadiness: jest.fn().mockResolvedValue({
      status: 'ok',
      database: 'connected',
      cache: 'connected',
    }),
    checkLiveness: jest.fn().mockResolvedValue({
      status: 'ok',
      uptime: process.uptime(),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should not require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer()).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('cache');
    });

    it('should not require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/ready');

      expect(response.status).toBe(200);
    });

    it('should return 503 when dependencies are not ready', async () => {
      mockHealthService.checkReadiness.mockResolvedValueOnce({
        status: 'error',
        database: 'disconnected',
        cache: 'connected',
      });

      const response = await request(app.getHttpServer()).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer()).get('/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should not require authentication', async () => {
      const response = await request(app.getHttpServer()).get('/live');

      expect(response.status).toBe(200);
    });
  });
});
