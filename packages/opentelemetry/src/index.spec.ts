import { initializeOpenTelemetry, createTracedHttpClient } from './index';

describe('OpenTelemetry', () => {
  it('should export initializeOpenTelemetry as a function', () => {
    expect(typeof initializeOpenTelemetry).toBe('function');
  });

  it('should export createTracedHttpClient as a function', () => {
    expect(typeof createTracedHttpClient).toBe('function');
  });
});
