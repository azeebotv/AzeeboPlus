/**
 * Sentry Error Tracking Integration
 * AN-002: Add error tracking
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

const DEFAULT_CONFIG: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
};

let initialized = false;

export function initSentry(config: Partial<SentryConfig> = {}): void {
  if (initialized || typeof window === 'undefined') return;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.dsn) {
    console.warn('[Sentry] No DSN configured, error tracking disabled');
    return;
  }

  // Dynamic import to avoid bundling Sentry in client if not needed
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn: mergedConfig.dsn,
        environment: mergedConfig.environment,
        release: mergedConfig.release,
        tracesSampleRate: mergedConfig.tracesSampleRate,
        replaysSessionSampleRate: mergedConfig.replaysSessionSampleRate,
        replaysOnErrorSampleRate: mergedConfig.replaysOnErrorSampleRate,

        // Don't send errors in development
        enabled: mergedConfig.environment !== 'development',

        // Attach context
        beforeSend(event) {
          // Don't send password or token data
          if (event.request?.data) {
            const data = event.request.data as Record<string, unknown>;
            delete data.password;
            delete data.token;
            delete data.refreshToken;
          }
          return event;
        },
      });

      initialized = true;
    })
    .catch(() => {
      // Sentry not installed, silently ignore
    });
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    })
    .catch(() => {});
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!initialized) return;

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureMessage(message, level);
    })
    .catch(() => {});
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!initialized) return;

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.setUser(user);
    })
    .catch(() => {});
}

export function clearUser(): void {
  if (!initialized) return;

  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.setUser(null);
    })
    .catch(() => {});
}
