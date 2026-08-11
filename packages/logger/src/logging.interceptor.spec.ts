import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let loggerSpy: { log: jest.Mock; error: jest.Mock };

  const buildContext = (overrides: Record<string, unknown> = {}): ExecutionContext => {
    const request = {
      headers: { 'x-request-id': overrides.traceId ?? undefined },
      method: 'GET',
      url: '/v1/test',
      user: { id: 'user-123' },
      traceId: undefined,
      spanId: undefined,
    } as unknown as { headers: Record<string, string | undefined>; method: string; url: string; user?: { id?: string }; traceId?: string; spanId?: string };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode: 200 }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    loggerSpy = {
      log: jest.fn(),
      error: jest.fn(),
    };
    // Swap the private Nest Logger for a spy.
    (interceptor as unknown as { logger: { log: jest.Mock; error: jest.Mock } }).logger = loggerSpy as never;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SERVICE_NAME;
  });

  it('logs a structured success entry with trace id + user id', (done) => {
    process.env.SERVICE_NAME = 'test-service';
    const context = buildContext();

    interceptor
      .intercept(context, { handle: () => of({ success: true }) } as CallHandler)
      .subscribe({
        complete: () => {
          expect(loggerSpy.log).toHaveBeenCalledTimes(1);
          const entry = JSON.parse(loggerSpy.log.mock.calls[0][0] as string);
          expect(entry.level).toBe('info');
          expect(entry.method).toBe('GET');
          expect(entry.path).toBe('/v1/test');
          expect(entry.statusCode).toBe(200);
          expect(entry.userId).toBe('user-123');
          expect(entry.service).toBe('test-service');
          expect(entry.traceId).toBeDefined();
          expect(entry.spanId).toBeDefined();
          expect(entry.duration).toBeGreaterThanOrEqual(0);
          done();
        },
      });
  });

  it('reuses an incoming x-request-id as the trace id', (done) => {
    const context = buildContext({ traceId: 'incoming-trace-42' });

    interceptor
      .intercept(context, { handle: () => of(null) } as CallHandler)
      .subscribe({
        complete: () => {
          const entry = JSON.parse(loggerSpy.log.mock.calls[0][0] as string);
          expect(entry.traceId).toBe('incoming-trace-42');
          done();
        },
      });
  });

  it('generates a trace id when the request has none', (done) => {
    const context = buildContext();
    const request = context.switchToHttp().getRequest() as unknown as { traceId?: string };

    interceptor
      .intercept(context, { handle: () => of(null) } as CallHandler)
      .subscribe({
        complete: () => {
          const entry = JSON.parse(loggerSpy.log.mock.calls[0][0] as string);
          expect(entry.traceId).toBeDefined();
          expect(request.traceId).toBe(entry.traceId);
          done();
        },
      });
  });

  it('logs the error branch with the failing message when the handler throws', (done) => {
    const context = buildContext();

    interceptor
      .intercept(context, { handle: () => throwError(() => new Error('boom')) } as CallHandler)
      .subscribe({
        error: () => {
          expect(loggerSpy.error).toHaveBeenCalledTimes(1);
          const entry = JSON.parse(loggerSpy.error.mock.calls[0][0] as string);
          expect(entry.level).toBe('error');
          expect(entry.method).toBe('GET');
          expect(entry.path).toBe('/v1/test');
          expect(entry.error.message).toBe('boom');
          expect(entry.userId).toBe('user-123');
          done();
        },
      });
  });

  it('omits userId when the request carries no user', (done) => {
    const requestless = buildContext();
    (requestless.switchToHttp().getRequest() as unknown as { user?: unknown }).user = undefined;

    interceptor
      .intercept(requestless, { handle: () => of(null) } as CallHandler)
      .subscribe({
        complete: () => {
          const entry = JSON.parse(loggerSpy.log.mock.calls[0][0] as string);
          expect(entry.userId).toBeUndefined();
          done();
        },
      });
  });
});
