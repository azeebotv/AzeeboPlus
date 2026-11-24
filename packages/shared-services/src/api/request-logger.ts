/**
 * Request/Response Logging
 * API-006: Log API requests with correlation IDs
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('HttpRequest');

export interface RequestLogEntry {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export function createRequestLogger() {
  return {
    logRequest: (entry: RequestLogEntry) => {
      const msg = `[API] ${entry.correlationId} ${entry.method} ${entry.path} ${entry.statusCode} ${entry.duration}ms`;
      if (entry.statusCode >= 500) {
        logger.error(msg, JSON.stringify(entry));
      } else if (entry.duration > 1000) {
        logger.warn(msg);
      } else {
        logger.log(msg);
      }
    },
    logResponse: (correlationId: string, statusCode: number, duration: number) => {
      const msg = `${correlationId} ${statusCode} ${duration}ms`;
      if (statusCode >= 500) {
        logger.error(msg);
      } else if (statusCode >= 400) {
        logger.warn(msg);
      } else {
        logger.log(msg);
      }
    },
  };
}
