import { LoggerService, LogLevel } from '@nestjs/common';

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

export class StructuredLogger implements LoggerService {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  log(message: string, context?: LogContext): void {
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
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
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
