import { LoggerService, LogLevel } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
export { LoggingInterceptor } from './logging.interceptor';
export { ResponseWrapperInterceptor } from './response-wrapper.interceptor';
export {
  ResponseSanitizationInterceptor,
  SanitizationConfig,
} from './response-sanitizer.interceptor';
export {
  DistributedTracingInterceptor,
  createTraceHeaders,
} from './distributed-tracing.interceptor';
export type { TraceContext } from './distributed-tracing.interceptor';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: unknown;
}

export function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export class StructuredLogger implements LoggerService {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  log(message: string, context?: LogContext): void {
    this.write('log', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.write('error', message, { ...context, trace });
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    const traceContext = getTraceContext();
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      ...traceContext,
      ...context,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
      case 'warn':
        // eslint-disable-next-line no-console
        console.error(output);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(output);
    }
  }
}

export function createLogger(serviceName: string): StructuredLogger {
  return new StructuredLogger(serviceName);
}
