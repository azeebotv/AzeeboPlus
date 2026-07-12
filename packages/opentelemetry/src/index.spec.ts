// Mock all OpenTelemetry dependencies to avoid version conflicts
jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('@opentelemetry/sdk-trace-base', () => ({
  ParentBasedSampler: jest.fn(),
  TraceIdRatioBasedSampler: jest.fn(),
}));
jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn(),
}));
jest.mock('@opentelemetry/resources', () => ({
  Resource: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@opentelemetry/semantic-conventions', () => ({
  SemanticResourceAttributes: {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version',
    DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  },
}));
jest.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: jest.fn(),
}));
jest.mock('@opentelemetry/instrumentation-http', () => ({
  HttpInstrumentation: jest.fn(),
}));
jest.mock('@opentelemetry/instrumentation-express', () => ({
  ExpressInstrumentation: jest.fn(),
}));
jest.mock('@prisma/instrumentation', () => ({
  PrismaInstrumentation: jest.fn(),
}));

import { initializeOpenTelemetry, createTracedHttpClient } from './index';

describe('OpenTelemetry', () => {
  it('should export initializeOpenTelemetry as a function', () => {
    expect(typeof initializeOpenTelemetry).toBe('function');
  });

  it('should export createTracedHttpClient as a function', () => {
    expect(typeof createTracedHttpClient).toBe('function');
  });
});
