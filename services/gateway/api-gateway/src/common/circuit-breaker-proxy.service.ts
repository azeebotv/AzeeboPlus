import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { CircuitBreaker, CircuitState, CircuitBreakerStats } from '@azeebo/shared-types';
// OpenTelemetry tracing - optional dependency
let trace: unknown;
try {
  trace = require('@opentelemetry/api').trace;
} catch {
  // OpenTelemetry not available
}

interface Tracer {
  startActiveSpan<T>(name: string, opts: Record<string, unknown>, fn: (span: Span) => T): T;
  setAttribute?(key: string, value: string | number): void;
}

interface Span {
  setAttribute(key: string, value: string | number): void;
  setStatus(status: { code: number; message?: string }): void;
  end(): void;
}

const SpanStatusCode = { OK: 0, ERROR: 2 } as const;

interface ProxyRequestOptions {
  method: string;
  targetUrl: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  queryString?: string;
  timeout?: number;
  requestId?: string;
  traceId?: string;
}

interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  circuitState: CircuitState;
}

interface RetryConfig {
  retries: number;
  delay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  delay: 100,
  maxDelay: 1000,
  backoffFactor: 3,
};

function jitter(value: number, factor: number = 0.3): number {
  const randomization = value * factor;
  return (Math.random() * 2 - 1) * randomization;
}

function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.delay * Math.pow(config.backoffFactor, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  const jitterAmount = jitter(cappedDelay);
  return Math.round(cappedDelay + jitterAmount);
}

@Injectable()
export class CircuitBreakerProxyService {
  private readonly logger = new Logger(CircuitBreakerProxyService.name);
  private readonly circuitBreakers: Map<string, CircuitBreaker>;

  constructor() {
    this.circuitBreakers = new Map();
  }

  getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker({
          failureThreshold: 5,
          resetTimeout: 60000,
          halfOpenRequests: 3,
        })
      );
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  async proxyRequest(options: ProxyRequestOptions): Promise<ProxyResponse> {
    const {
      method,
      targetUrl,
      path,
      headers,
      body,
      queryString,
      timeout = 30000,
      requestId,
      traceId,
    } = options;

    const target = `${targetUrl}${path}${queryString ? `?${queryString}` : ''}`;
    let serviceName = 'unknown';
    try {
      serviceName = new URL(targetUrl).hostname || 'unknown';
    } catch {
      this.logger.warn(`Failed to parse targetUrl: ${targetUrl}`);
    }

    // Use path-based key to avoid shared circuit breakers across services on same host
    const circuitKey = `${serviceName}:${path.split('/')[1] || 'root'}`;

    this.logger.debug(`Proxying ${method} ${path}`, { requestId });

    const circuitBreaker = this.getCircuitBreaker(circuitKey);
    const otelTrace = trace as { getTracer(name: string): Tracer } | undefined;

    if (!otelTrace?.getTracer) {
      this.logger.debug(`OpenTelemetry not available, proceeding without tracing [${requestId}]`);
      const result = await circuitBreaker.execute(async () => {
        return this.executeProxyRequest(method, target, headers, body, timeout, requestId);
      });
      return {
        ...result,
        circuitState: circuitBreaker.getState(),
      };
    }

    return await otelTrace
      .getTracer('api-gateway')
      .startActiveSpan(
        `proxy.${serviceName}`,
        { attributes: { 'http.method': method, 'http.url': target } },
        async (span: Span) => {
          try {
            const result = await circuitBreaker.execute(async () => {
              return this.executeProxyRequest(
                method,
                target,
                headers,
                body,
                timeout,
                requestId,
                span
              );
            });

            return {
              ...result,
              circuitState: circuitBreaker.getState(),
            };
          } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            const currentStats = circuitBreaker.getStats();
            this.logger.error(
              `Circuit breaker error for ${serviceName}: ${(error as Error).message}`,
              { requestId, stats: currentStats }
            );

            if (circuitBreaker.isOpen()) {
              return {
                status: HttpStatus.SERVICE_UNAVAILABLE,
                data: {
                  message: 'Service temporarily unavailable. Please try again later.',
                  retryAfter: currentStats.nextAttempt,
                  circuitState: CircuitState.OPEN,
                },
                headers: {},
                circuitState: CircuitState.OPEN,
              };
            }

            throw error;
          } finally {
            span.end();
          }
        }
      );
  }

  private shouldRetryStatus(status: number | undefined): boolean {
    if (status !== undefined && status >= 500) return true;
    if (status !== undefined && status === 429) return true;
    return false;
  }

  private async executeProxyRequest(
    method: string,
    target: string,
    headers: Record<string, string>,
    body: unknown,
    timeout: number,
    requestId: string | undefined,
    span?: Span
  ): Promise<Omit<ProxyResponse, 'circuitState'>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= DEFAULT_RETRY_CONFIG.retries; attempt++) {
      try {
        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: AbortSignal.timeout(timeout),
        };

        if (body && method !== 'GET' && method !== 'HEAD') {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(target, fetchOptions);

        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP ${response.status}`);
        }

        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of response.headers.entries()) {
          responseHeaders[key] = value;
        }

        let responseData: unknown;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else if (contentType?.includes('text/')) {
          responseData = await response.text();
        } else {
          responseData = await response.arrayBuffer();
        }

        if (span) {
          span.setAttribute('http.status_code', response.status);
        }
        return {
          status: response.status,
          data: responseData,
          headers: responseHeaders,
        };
      } catch (retryError) {
        lastError = retryError as Error;
        const retryStatus =
          typeof retryError === 'object' && retryError !== null && 'status' in retryError
            ? (retryError as { status: number }).status
            : undefined;
        const shouldRetry =
          attempt < DEFAULT_RETRY_CONFIG.retries && this.shouldRetryStatus(retryStatus);
        if (!shouldRetry) {
          throw retryError;
        }
        const delay = calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  getCircuitStats(serviceName: string): CircuitBreakerStats | null {
    const breaker = this.circuitBreakers.get(serviceName);
    return breaker ? breaker.getStats() : null;
  }

  getAllCircuitStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      stats[service] = breaker.getStats();
    }
    return stats;
  }

  resetCircuitBreaker(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.resetCircuit();
      return true;
    }
    return false;
  }
}
