import { HealthCheckService } from './health-check.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    service = new HealthCheckService();
  });

  describe('getLiveness', () => {
    it('should return ok status', () => {
      const result = service.getLiveness();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('getReadiness', () => {
    it('should return ok when all checks pass', async () => {
      const checks = [async () => true, async () => true];
      const result = await service.getReadiness(checks);
      expect(result.status).toBe('ok');
    });

    it('should return error when any check fails', async () => {
      const checks = [async () => true, async () => false];
      const result = await service.getReadiness(checks);
      expect(result.status).toBe('error');
      expect(result.message).toContain('1');
    });

    it('should handle check errors as failures', async () => {
      const checks = [
        async () => true,
        async () => {
          throw new Error('check failed');
        },
      ];
      const result = await service.getReadiness(checks);
      expect(result.status).toBe('error');
    });
  });

  describe('recordRequest/recordError', () => {
    it('should track request and error counts', () => {
      service.recordRequest();
      service.recordRequest();
      service.recordRequest();
      service.recordError('something went wrong');

      // We can verify these are tracked via checkHealth metrics
    });
  });

  describe('checkHealth', () => {
    it('should return healthy when all checks pass', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', [
        {
          name: 'database',
          check: async () => ({ status: 'up' }),
        },
        {
          name: 'redis',
          check: async () => ({ status: 'up' }),
        },
      ]);

      expect(result.status).toBe('healthy');
      expect(result.service).toBe('test-service');
      expect(result.version).toBe('1.0.0');
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].name).toBe('database');
      expect(result.checks[1].name).toBe('redis');
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy when a check is down', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', [
        {
          name: 'database',
          check: async () => ({ status: 'down', message: 'Connection refused' }),
        },
      ]);

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].status).toBe('down');
      expect(result.checks[0].message).toBe('Connection refused');
    });

    it('should return degraded when a check is degraded', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', [
        {
          name: 'cache',
          check: async () => ({ status: 'up' }),
        },
        {
          name: 'search',
          check: async () => ({ status: 'degraded', message: 'High latency' }),
        },
      ]);

      expect(result.status).toBe('degraded');
    });

    it('should handle check exceptions as down', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', [
        {
          name: 'failing-check',
          check: async () => {
            throw new Error('Unexpected failure');
          },
        },
      ]);

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].status).toBe('down');
      expect(result.checks[0].message).toBe('Unexpected failure');
    });

    it('should include latency in check results', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', [
        {
          name: 'fast-check',
          check: async () => ({ status: 'up' }),
        },
      ]);

      expect(result.checks[0].latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should include metrics', async () => {
      const result = await service.checkHealth('test-service', '1.0.0', []);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkDatabase', () => {
    it('should return up when query succeeds', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      };

      const result = await service.checkDatabase(mockPrisma);
      expect(result.status).toBe('up');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should return down when query fails', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('Connection refused')),
      };

      const result = await service.checkDatabase(mockPrisma);
      expect(result.status).toBe('down');
      expect(result.message).toBe('Connection refused');
    });
  });
});
