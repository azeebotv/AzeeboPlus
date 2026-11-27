import { LoggerService, LogLevel } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
// Light subpath import: the security barrel would pull @nestjs/core into
// every logger consumer (and logger's own unit tests).
import { LogRedactionService } from '@azeebo/security/log-redaction';

// Shared instance — LogRedactionService is stateless. Every message and
// context object written through StructuredLogger passes redaction before
// emission so plaintext emails/phones/tokens never reach the log pipeline.
const redaction = new LogRedactionService();

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

/** Extracts the current OpenTelemetry trace and span IDs from the active span. */
export function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/** JSON structured logger that outputs machine-parseable log entries with trace context. */
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
      message: redaction.redactString(message),
      service: this.serviceName,
      ...traceContext,
      ...(context ? (redaction.redactObject(context) as LogContext) : undefined),
    };

    let output: string;
    try {
      output = JSON.stringify(entry);
    } catch {
      output = JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        service: entry.service,
        error: 'Failed to serialize log entry',
      });
    }

    switch (level) {
      case 'error':
      case 'warn':
        console.error(output);
        break;
      default:
        console.log(output);
    }
  }
}

/** Factory function to create a StructuredLogger for the given service. */
export function createLogger(serviceName: string): StructuredLogger {
  return new StructuredLogger(serviceName);
}
