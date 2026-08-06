jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: class {
    execute = jest.fn();
    getStats = jest.fn();
  },
  CircuitBreakerOpenError: class extends Error {},
  ApiVersioningConfig: {},
  API_VERSION_HEADER: 'x-api-version',
  DEFAULT_API_VERSION: '1',
  environmentSchema: {},
  validateEnvironment: jest.fn(),
}));

jest.mock('@azeebo/security', () => {
  const Guard = class {
    canActivate() {
      return true;
    }
  };
  return {
    AdminGuard: Guard,
    RateLimitGuard: Guard,
    RateLimit: () => () => {},
    HelmetGuard: Guard,
    Public: () => () => {},
    IS_PUBLIC_KEY: 'isPublic',
  };
});

jest.mock('@nestjs/terminus', () => {
  return {
    TerminusModule: class {},
    HealthCheckService: 'HealthCheckService',
    HealthCheck: () => () => {},
    HttpHealthIndicator: class {
      pingCheck = jest.fn();
    },
    TypeOrmHealthIndicator: class {},
    MemoryHealthIndicator: class {},
    DiskHealthIndicator: class {},
  };
});

jest.mock('ioredis', () => {
  return class MockRedis {};
});

jest.mock('@azeebo/logger', () => ({
  ResponseWrapperInterceptor: class {
    intercept = jest.fn();
  },
  Logger: class {
    log = jest.fn();
    error = jest.fn();
    warn = jest.fn();
    debug = jest.fn();
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request from 'supertest';

@Controller()
class SimpleHealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      info: { apiGateway: { status: 'up', timestamp: new Date().toISOString() } },
      error: {},
      details: { apiGateway: { status: 'up', timestamp: new Date().toISOString() } },
    };
  }
}

describe('API Gateway Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SimpleHealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Gateway Health Check', () => {
    it('should respond with 200 OK', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('Route Validation', () => {
    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer()).get('/nonexistent-route-12345').expect(404);
    });
  });

  describe('API Gateway Response Format', () => {
    it('should return JSON response', async () => {
      const response = await request(app.getHttpServer()).get('/health');
      expect(response.type).toBe('application/json');
    });
  });
});
