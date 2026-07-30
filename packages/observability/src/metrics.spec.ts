import { MetricsService } from './metrics.service';

describe('MetricsService (re-exported from @azeebo/shared-services)', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  describe('registerMetric', () => {
    it('should register a counter metric', () => {
      service.registerMetric({
        name: 'test_counter',
        help: 'Test counter',
        type: 'counter',
      });
    });

    it('should register a gauge metric', () => {
      service.registerMetric({
        name: 'test_gauge',
        help: 'Test gauge',
        type: 'gauge',
      });
    });
  });

  describe('counter operations', () => {
    beforeEach(() => {
      service.registerMetric({
        name: 'requests',
        help: 'Request count',
        type: 'counter',
      });
    });

    it('should increment counter by 1 by default', () => {
      const counter = service.getCounter('requests');
      counter.increment();
      const metrics = service.getMetrics();
      const reqMetric = metrics.find((m) => m.name === 'requests');
      expect(reqMetric?.value).toBe(1);
    });

    it('should reset counter', () => {
      const counter = service.getCounter('requests');
      counter.increment(10);
      counter.reset();
      const metrics = service.getMetrics();
      const reqMetric = metrics.find((m) => m.name === 'requests');
      expect(reqMetric).toBeUndefined();
    });
  });

  describe('gauge operations', () => {
    beforeEach(() => {
      service.registerMetric({
        name: 'connections',
        help: 'Active connections',
        type: 'gauge',
      });
    });

    it('should set gauge value', () => {
      const gauge = service.getGauge('connections');
      gauge.set(42);
      const metrics = service.getMetrics();
      const connMetric = metrics.find((m) => m.name === 'connections');
      expect(connMetric?.value).toBe(42);
    });

    it('should increment gauge', () => {
      const gauge = service.getGauge('connections');
      gauge.set(10);
      gauge.increment();
      const metrics = service.getMetrics();
      const connMetric = metrics.find((m) => m.name === 'connections');
      expect(connMetric?.value).toBe(11);
    });
  });

  describe('recordRequest / recordError (backward compat)', () => {
    it('should record request without throwing', () => {
      expect(() => service.recordRequest('GET', 200, 100)).not.toThrow();
    });

    it('should record error without throwing', () => {
      expect(() => service.recordError('test_error')).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return empty array when no metrics registered', () => {
      const metrics = service.getMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('getPrometheusMetrics', () => {
    it('should return valid prometheus format', () => {
      const output = service.getPrometheusMetrics();
      expect(typeof output).toBe('string');
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      service.registerMetric({ name: 'test', help: 'test', type: 'counter' });
      service.getCounter('test').increment(5);
      service.reset();
      expect(service.getMetrics()).toEqual([]);
    });
  });
});
