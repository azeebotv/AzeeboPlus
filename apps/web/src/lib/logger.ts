/**
 * Web App Logger Utility
 * Wraps console methods with structured logging for Next.js client-side code.
 * Uses the @azeebo/logger pattern but adapted for browser environment.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  data?: unknown;
}

class WebLogger {
  private serviceName: string;

  constructor(serviceName: string = 'WebApp') {
    this.serviceName = serviceName;
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      data,
    };

    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${entry.service}] ${entry.level.toUpperCase()}:`;
      switch (level) {
        case 'error':
          // eslint-disable-next-line no-console
          console.error(prefix, message, data || '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(prefix, message, data || '');
          break;
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(prefix, message, data || '');
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(prefix, message, data || '');
      }
    }
  }

  log(message: string, data?: unknown): void {
    this.write('log', message, data);
  }

  error(message: string, data?: unknown): void {
    this.write('error', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write('warn', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.write('debug', message, data);
  }
}

export const webLogger = new WebLogger('WebApp');

export function createWebLogger(serviceName: string): WebLogger {
  return new WebLogger(serviceName);
}
