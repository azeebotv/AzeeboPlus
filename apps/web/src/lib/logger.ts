/**
 * Web App Logger Utility
 * Wraps console methods with structured logging for Next.js client-side code.
 * Uses the @azeebo/logger pattern but adapted for browser environment.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface _LogEntry {
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
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}]`;
    const args = data !== undefined ? [prefix, message, data] : [prefix, message];
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else if (level === 'debug') console.debug(...args);
    else console.log(...args);
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
