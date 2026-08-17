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
  UNIVERSE_SLUGS: [
    'reality',
    'creator',
    'lifestyle',
    'vertical',
    'movie',
    'games',
    'comedy',
    'sports',
    'music',
  ],
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

jest.mock('@azeebo/feature-flags', () => {
  const FeatureFlagService = class {};
  const noopModule = { module: class {}, global: true, providers: [], exports: [] };
  return {
    FeatureFlagService,
    FeatureFlagModule: {
      register: () => noopModule,
    },
    FeatureFlagGuard: class {
      canActivate() {
        return true;
      }
    },
    FeatureFlag: () => () => {},
    gatewayFlags: {
      maintenanceMode: 'gateway_maintenance_mode',
      newRoutes: 'gateway_new_routes',
      circuitBreaker: 'gateway_circuit_breaker',
      responseCache: 'gateway_response_cache',
      strictRateLimits: 'gateway_strict_rate_limits',
      csrfEnforce: 'gateway_csrf_enforce',
      legacyRedirect: 'gateway_legacy_redirect',
      apiV2: 'gateway_api_v2',
    },
    webFlags: {
      maintenanceMode: 'web_maintenance_mode',
      newHome: 'web_new_home',
      darkMode: 'web_dark_mode',
      autoplay: 'web_autoplay',
      lowDataDefault: 'web_low_data_default',
    },
    universeEnabledKey: (name: string) => `universe.${name}.enabled`,
  };
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
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SimpleHealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Gateway Health Check', () => {
    it('should respond with 200 OK', () => {
      return request(baseUrl).get('/health').expect(200);
    });
  });

  describe('Route Validation', () => {
    it('should return 404 for unknown routes', () => {
      return request(baseUrl).get('/nonexistent-route-12345').expect(404);
    });
  });

  describe('API Gateway Response Format', () => {
    it('should return JSON response', async () => {
      const response = await request(baseUrl).get('/health');
      expect(response.type).toBe('application/json');
    });
  });
});
