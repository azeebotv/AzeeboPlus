import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

interface TracingRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { id?: string };
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  traceState?: Record<string, string>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId?: string;
  service?: string;
  startTime: number;
  tags?: Record<string, string>;
  baggage?: Record<string, string>;
}

@Injectable()
export class DistributedTracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('DistributedTracing');
  private readonly serviceName: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'unknown';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TracingRequest>();
    const response = context.switchToHttp().getResponse();

    const traceContext = this.extractOrCreateTraceContext(request);
    const method = request.method || 'UNKNOWN';
    const url = request.url || 'UNKNOWN';
    const startTime = Date.now();

    request.traceId = traceContext.traceId;
    request.spanId = traceContext.spanId;
    request.parentSpanId = traceContext.parentSpanId;

    response.setHeader('X-Trace-Id', traceContext.traceId);
    response.setHeader('X-Span-Id', traceContext.spanId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logTrace({
            ...traceContext,
            method,
            path: url,
            statusCode,
            duration,
            success: true,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logTrace({
            ...traceContext,
            method,
            path: url,
            duration,
            success: false,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          });
        },
      })
    );
  }

  private extractOrCreateTraceContext(request: TracingRequest): TraceContext {
    const headers = request.headers || {};
    const existingTraceId = this.getHeaderValue(headers, 'x-trace-id');
    const existingSpanId = this.getHeaderValue(headers, 'x-span-id');
    const existingParentSpanId = this.getHeaderValue(headers, 'x-parent-span-id');

    const traceId = existingTraceId || randomUUID();
    const spanId = randomUUID().substring(0, 8);
    const parentSpanId = existingSpanId || existingParentSpanId;

    const baggageHeader = this.getHeaderValue(headers, 'x-trace-baggage');
    const baggage = baggageHeader ? this.parseBaggage(baggageHeader) : {};

    return {
      traceId,
      spanId,
      parentSpanId,
      userId: request.user?.id,
      service: this.serviceName,
      startTime: Date.now(),
      baggage,
    };
  }

  private getHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    key: string
  ): string | undefined {
    const value = headers[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private parseBaggage(baggageHeader: string): Record<string, string> {
    try {
      return baggageHeader.split(',').reduce(
        (acc, pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            acc[key.trim()] = decodeURIComponent(value.trim());
          }
          return acc;
        },
        {} as Record<string, string>
      );
    } catch {
      return {};
    }
  }

  private logTrace(context: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    userId?: string;
    service?: string;
    method: string;
    path: string;
    statusCode?: number;
    duration: number;
    success: boolean;
    error?: { name: string; message: string; stack?: string };
    baggage?: Record<string, string>;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: context.success ? 'info' : 'error',
      message: `${context.method} ${context.path} ${context.statusCode || 'ERROR'} ${context.duration}ms`,
      traceId: context.traceId,
      spanId: context.spanId,
      parentSpanId: context.parentSpanId,
      userId: context.userId,
      service: context.service,
      method: context.method,
      path: context.path,
      statusCode: context.statusCode,
      duration: context.duration,
      success: context.success,
      baggage: context.baggage,
      ...(context.error && { error: context.error }),
    };

    if (context.success) {
      this.logger.log(JSON.stringify(logEntry));
    } else {
      this.logger.error(JSON.stringify(logEntry));
    }
  }
}

export function createTraceHeaders(context: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Trace-Id': context.traceId,
    'X-Span-Id': context.spanId,
  };

  if (context.parentSpanId) {
    headers['X-Parent-Span-Id'] = context.parentSpanId;
  }

  if (context.baggage && Object.keys(context.baggage).length > 0) {
    const baggageString = Object.entries(context.baggage)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join(',');
    headers['X-Trace-Baggage'] = baggageString;
  }

  return headers;
}
