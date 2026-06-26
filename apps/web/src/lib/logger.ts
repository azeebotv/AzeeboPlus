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

  private write(_level: LogLevel, _message: string, _data?: unknown): void {
    // Logging disabled — no console output in dev or prod
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
