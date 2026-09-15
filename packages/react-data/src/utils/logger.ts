/**
 * Mobile App Logger Utility
 * Wraps console methods with structured logging.
 * In production, this can be connected to a remote logging service.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class MobileLogger {
  private serviceName: string;
  private isDev: boolean;

  constructor(serviceName: string = 'MobileApp') {
    this.serviceName = serviceName;
    this.isDev = __DEV__;
  }

  private write(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.serviceName,
      data,
    };

    if (this.isDev) {
      // In development, use console for readability
      const prefix = `[${entry.context}] ${entry.level.toUpperCase()}:`;
      switch (level) {
        case 'error':
          console.error(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        default:
          console.log(prefix, message, data || '');
      }
    }
    // In production, could send to remote logging service
  }

  log(message: string, context?: string, data?: unknown): void {
    this.write('log', message, context, data);
  }

  error(message: string, contextOrData?: string | unknown, data?: unknown): void {
    if (typeof contextOrData === 'string') {
      this.write('error', message, contextOrData, data);
    } else {
      this.write('error', message, undefined, contextOrData);
    }
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.write('warn', message, context, data);
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.write('debug', message, context, data);
  }
}

export const logger = new MobileLogger('MobileApp');

export function createMobileLogger(serviceName: string): MobileLogger {
  return new MobileLogger(serviceName);
}

/** Alias used by pricing config and other modules */
export function createLogger(serviceName: string): MobileLogger {
  return new MobileLogger(serviceName);
}
