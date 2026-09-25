import { HealthCheckService } from './health-check.service';

describe('HealthCheckService (shared-services)', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    service = new HealthCheckService();
  });

  describe('getLiveness', () => {
    it('should return ok status', () => {
      expect(service.getLiveness()).toEqual({ status: 'ok' });
    });
  });

  describe('getReadiness', () => {
    it('should return ok when all checks pass', async () => {
      const result = await service.getReadiness([async () => true, async () => true]);
      expect(result.status).toBe('ok');
    });

    it('should return error when any check fails', async () => {
      const result = await service.getReadiness([async () => true, async () => false]);
      expect(result.status).toBe('error');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy when all checks pass', async () => {
      const result = await service.checkHealth('my-service', '1.0.0', [
        { name: 'db', check: async () => ({ status: 'up' }) },
      ]);
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('my-service');
    });

    it('should return unhealthy when a check is down', async () => {
      const result = await service.checkHealth('s', '1', [
        { name: 'db', check: async () => ({ status: 'down', message: 'refused' }) },
      ]);
      expect(result.status).toBe('unhealthy');
    });

    it('should include metrics', async () => {
      const result = await service.checkHealth('s', '1', []);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkDatabase', () => {
    it('should handle missing prisma gracefully', async () => {
      const result = await service.checkDatabase();
      expect(result.status).toBe('up');
      expect(result.message).toContain('not configured');
    });
  });

  describe('checkRedis', () => {
    it('should handle missing redis gracefully', async () => {
      const result = await service.checkRedis();
      expect(result.status).toBe('up');
      expect(result.message).toContain('not configured');
    });
  });

  describe('checkExternalService', () => {
    it('should not throw', async () => {
      const result = await service.checkExternalService('test', 'http://localhost:1', 50);
      expect(['up', 'down', 'degraded']).toContain(result.status);
    });
  });

  describe('recordRequest/recordError', () => {
    it('should not throw', () => {
      expect(() => service.recordRequest()).not.toThrow();
      expect(() => service.recordError('test')).not.toThrow();
    });
  });
});
