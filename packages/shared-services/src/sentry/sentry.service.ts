import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Scope } from '@sentry/core';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      });
      this.initialized = true;
      this.logger.log('Sentry initialized');
    } else {
      this.logger.warn('SENTRY_DSN not set — Sentry is disabled');
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): string | undefined {
    if (!this.initialized) return undefined;
    return Sentry.withScope((scope: Scope) => {
      if (context) scope.setExtras(context);
      return Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>): string | undefined {
    if (!this.initialized) return undefined;
    return Sentry.withScope((scope: Scope) => {
      scope.setLevel(level);
      if (context) scope.setExtras(context);
      return Sentry.captureMessage(message, level);
    });
  }
}
