import { MetricsService } from './metrics.service';

describe('MetricsService (shared-services)', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  describe('registerMetric', () => {
    it('should register a counter metric', () => {
      service.registerMetric({ name: 'visits', help: 'Visit count', type: 'counter' });
      const counter = service.getCounter('visits');
      counter.increment(1);
      const metrics = service.getMetrics();
      expect(metrics.find((m) => m.name === 'visits')?.value).toBe(1);
    });

    it('should register a gauge metric', () => {
      service.registerMetric({ name: 'temp', help: 'Temperature', type: 'gauge' });
      service.getGauge('temp').set(36);
      const metrics = service.getMetrics();
      expect(metrics.find((m) => m.name === 'temp')?.value).toBe(36);
    });

    it('should register a histogram metric', () => {
      service.registerMetric({ name: 'latency', help: 'Latency', type: 'histogram', buckets: [1, 5] });
      service.getHistogram('latency').observe(3);
      // Histogram data not in getMetrics, just verify no throw
    });
  });

  describe('counter operations', () => {
    beforeEach(() => {
      service.registerMetric({ name: 'req', help: 'Requests', type: 'counter' });
    });

    it('should increment by 1 by default', () => {
      service.getCounter('req').increment();
      expect(service.getMetrics().find((m) => m.name === 'req')?.value).toBe(1);
    });

    it('should increment by custom value', () => {
      service.getCounter('req').increment(5);
      expect(service.getMetrics().find((m) => m.name === 'req')?.value).toBe(5);
    });

    it('should reset counter', () => {
      service.getCounter('req').increment(10);
      service.getCounter('req').reset();
      expect(service.getMetrics().find((m) => m.name === 'req')).toBeUndefined();
    });
  });

  describe('gauge operations', () => {
    beforeEach(() => {
      service.registerMetric({ name: 'conn', help: 'Connections', type: 'gauge' });
    });

    it('should set gauge value', () => {
      service.getGauge('conn').set(42);
      expect(service.getMetrics().find((m) => m.name === 'conn')?.value).toBe(42);
    });

    it('should increment and decrement', () => {
      service.getGauge('conn').set(10);
      service.getGauge('conn').increment();
      expect(service.getMetrics().find((m) => m.name === 'conn')?.value).toBe(11);
      service.getGauge('conn').decrement();
      expect(service.getMetrics().find((m) => m.name === 'conn')?.value).toBe(10);
    });
  });

  describe('recordRequest / recordError', () => {
    it('should not throw', () => {
      expect(() => service.recordRequest('GET', 200, 100)).not.toThrow();
      expect(() => service.recordError('test_error')).not.toThrow();
    });
  });

  describe('getPrometheusMetrics', () => {
    it('should return formatted string', () => {
      const output = service.getPrometheusMetrics();
      expect(typeof output).toBe('string');
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      service.registerMetric({ name: 'x', help: 'x', type: 'counter' });
      service.getCounter('x').increment(5);
      service.reset();
      expect(service.getMetrics()).toEqual([]);
    });
  });

  describe('addExporter', () => {
    it('should add an exporter callback', () => {
      const exporter = jest.fn();
      service.addExporter(exporter);
      service.onModuleInit();
      service.onModuleDestroy();
      expect(exporter).toHaveBeenCalled();
    });
  });
});
