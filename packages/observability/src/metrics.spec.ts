import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
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
      // No error means success
    });

    it('should register a gauge metric', () => {
      service.registerMetric({
        name: 'test_gauge',
        help: 'Test gauge',
        type: 'gauge',
      });
    });

    it('should register a histogram metric', () => {
      service.registerMetric({
        name: 'test_histogram',
        help: 'Test histogram',
        type: 'histogram',
        buckets: [1, 5, 10],
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

    it('should increment counter by custom value', () => {
      const counter = service.getCounter('requests');
      counter.increment(5);

      const metrics = service.getMetrics();
      const reqMetric = metrics.find((m) => m.name === 'requests');
      expect(reqMetric?.value).toBe(5);
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

    it('should decrement gauge', () => {
      const gauge = service.getGauge('connections');
      gauge.set(10);
      gauge.decrement();

      const metrics = service.getMetrics();
      const connMetric = metrics.find((m) => m.name === 'connections');
      expect(connMetric?.value).toBe(9);
    });
  });

  describe('histogram operations', () => {
    beforeEach(() => {
      service.registerMetric({
        name: 'request_duration',
        help: 'Request duration',
        type: 'histogram',
        buckets: [5, 10, 50],
      });
    });

    it('should observe histogram values', () => {
      const histogram = service.getHistogram('request_duration');
      histogram.observe(3);
      histogram.observe(7);
      histogram.observe(15);

      // Histogram data is only in export, not in getMetrics
      // Verify no error occurred
    });

    it('should reset histogram', () => {
      const histogram = service.getHistogram('request_duration');
      histogram.observe(5);
      histogram.reset();
      // Should not throw
    });
  });

  describe('addExporter', () => {
    it('should add an exporter callback', () => {
      const exporter = jest.fn();
      service.addExporter(exporter);
      // No error means success
    });
  });

  describe('onModuleInit/onModuleDestroy', () => {
    it('should handle lifecycle hooks', () => {
      service.onModuleInit();
      // Should set up flush interval
      service.onModuleDestroy();
      // Should clear interval and export
    });
  });

  describe('getMetrics', () => {
    it('should return empty array when no metrics registered', () => {
      const metrics = service.getMetrics();
      expect(metrics).toEqual([]);
    });
  });
});
