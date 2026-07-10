// Mock @opentelemetry/api before importing the module
const mockGetActiveSpan = jest.fn();
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: mockGetActiveSpan,
  },
}));

// Mock @nestjs/common with Injectable decorator
jest.mock('@nestjs/common', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Injectable: () => (target: any) => target,
  LoggerService: class {},
  Logger: class {
    log() {}
    error() {}
    warn() {}
    debug() {}
    verbose() {}
  },
  LogLevel: {},
  NestInterceptor: {},
  CallHandler: {},
  ExecutionContext: {},
}));

// Mock the interceptor re-exports since we're only testing StructuredLogger
jest.mock('./logging.interceptor', () => ({
  LoggingInterceptor: class {},
}));
jest.mock('./response-wrapper.interceptor', () => ({
  ResponseWrapperInterceptor: class {},
}));
jest.mock('./response-sanitizer.interceptor', () => ({
  ResponseSanitizationInterceptor: class {},
  SanitizationConfig: {},
}));
jest.mock('./distributed-tracing.interceptor', () => ({
  DistributedTracingInterceptor: class {},
  createTraceHeaders: jest.fn(),
}));

import { StructuredLogger, createLogger, getTraceContext } from './index';

describe('createLogger', () => {
  it('should create a StructuredLogger instance', () => {
    const logger = createLogger('test-service');
    expect(logger).toBeInstanceOf(StructuredLogger);
  });
});

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleSpy: { log: jest.SpyInstance; error: jest.SpyInstance };

  beforeEach(() => {
    logger = createLogger('test-service');
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
    mockGetActiveSpan.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('should output structured JSON log', () => {
      logger.log('Hello world');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.level).toBe('log');
      expect(output.message).toBe('Hello world');
      expect(output.service).toBe('test-service');
      expect(output.timestamp).toBeDefined();
    });

    it('should include context fields in log entry', () => {
      logger.log('Action performed', { userId: 'u1', requestId: 'req-123' });

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.userId).toBe('u1');
      expect(output.requestId).toBe('req-123');
    });
  });

  describe('error', () => {
    it('should output error to console.error', () => {
      logger.error('Something failed', 'stack trace here');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.level).toBe('error');
      expect(output.message).toBe('Something failed');
      expect(output.trace).toBe('stack trace here');
    });
  });

  describe('warn', () => {
    it('should output warning to console.error', () => {
      logger.warn('Low memory');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.level).toBe('warn');
      expect(output.message).toBe('Low memory');
    });
  });

  describe('debug', () => {
    it('should output debug to console.log', () => {
      logger.debug('Debug info');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.level).toBe('debug');
      expect(output.message).toBe('Debug info');
    });
  });

  describe('verbose', () => {
    it('should output verbose to console.log', () => {
      logger.verbose('Verbose info');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.level).toBe('verbose');
      expect(output.message).toBe('Verbose info');
    });
  });

  describe('trace context', () => {
    it('should include trace context when active span exists', () => {
      mockGetActiveSpan.mockReturnValue({
        spanContext: () => ({
          traceId: 'abc123',
          spanId: 'def456',
        }),
      });

      logger.log('With trace');

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.traceId).toBe('abc123');
      expect(output.spanId).toBe('def456');
    });

    it('should work without active span', () => {
      mockGetActiveSpan.mockReturnValue(null);

      logger.log('Without trace');

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.traceId).toBeUndefined();
      expect(output.spanId).toBeUndefined();
    });
  });
});

describe('getTraceContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return trace context from active span', () => {
    mockGetActiveSpan.mockReturnValue({
      spanContext: () => ({
        traceId: 'trace-123',
        spanId: 'span-456',
      }),
    });

    const ctx = getTraceContext();
    expect(ctx.traceId).toBe('trace-123');
    expect(ctx.spanId).toBe('span-456');
  });

  it('should return empty object when no active span', () => {
    mockGetActiveSpan.mockReturnValue(null);

    const ctx = getTraceContext();
    expect(ctx).toEqual({});
  });
});
