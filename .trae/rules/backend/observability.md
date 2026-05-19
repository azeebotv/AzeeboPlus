# Azeebo+ Observability Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines observability standards including distributed tracing, metrics, and log correlation for the Azeebo+ platform.

---

## Distributed Tracing

### Trace Context Propagation

All services MUST propagate trace context:

```typescript
// ✅ Good - Backend Interceptor
import { Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: any, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const traceId = req.headers['x-trace-id'] || randomUUID();
    const spanId = randomUUID().substring(0, 16);
    
    req.traceId = traceId;
    req.spanId = spanId;
    req.headers['x-trace-id'] = traceId;
    req.headers['x-span-id'] = spanId;

    return next.handle().pipe(
      tap(() => {
        this.logger.debug('Request completed', {
          traceId,
          spanId,
          method: req.method,
          path: req.path,
          status: context.switchToHttp().getResponse().statusCode,
        });
      }),
    );
  }
}
```

### Trace Context Headers

| Header | Description | Required |
|--------|-------------|----------|
| `X-Trace-Id` | Global trace identifier | Yes |
| `X-Span-Id` | Current span identifier | Yes |
| `X-Parent-Span-Id` | Parent span identifier | Yes (if nested) |
| `X-Sampled` | Whether trace is sampled | Yes |

### Frontend Trace Context

```typescript
// ✅ Good
interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  sampled: boolean;
}

const createTraceContext = (): TraceContext => {
  const traceId = crypto.randomUUID();
  const spanId = crypto.randomUUID().substring(0, 16);
  
  return {
    traceId,
    spanId,
    sampled: true,
  };
};

// Store in request headers
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: {
    'X-Trace-Id': traceContext.traceId,
    'X-Span-Id': traceContext.spanId,
  },
});
```

---

## OpenTelemetry Integration

### Backend Setup

```typescript
// ✅ Good
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'auth-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTLP_EXPORTER_URL,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          return req.url.includes('/health');
        },
      },
    }),
  ],
});

sdk.start();
```

### Frontend Setup

```typescript
// ✅ Good
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { fetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

const provider = new WebTracerProvider({
  resource: new Resource({
    'service.name': 'web-app',
    'service.version': '1.0.0',
    'deployment.environment': process.env.NODE_ENV,
  }),
});

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTLP_EXPORTER_URL,
    }),
  ),
);

provider.register();

registerInstrumentations({
  instrumentations: [fetchInstrumentation],
});
```

---

## Metrics Collection

### Backend Metrics

```typescript
// ✅ Good
import { Counter, Histogram, Gauge, Summary } from 'prom-client';

const metrics = {
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status', 'service'],
  }),
  
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  }),
  
  activeConnections: new Gauge({
    name: 'database_connections_active',
    help: 'Active database connections',
    labelNames: ['database'],
  }),
  
  errorTotal: new Counter({
    name: 'errors_total',
    help: 'Total errors by type',
    labelNames: ['type', 'service', 'code'],
  }),
};

// Usage
app.use((req, res, next) => {
  const end = metrics.httpRequestDuration.startTimer({
    method: req.method,
    path: req.path,
  });

  res.on('finish', () => {
    end({ status: res.statusCode });
    metrics.httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      service: process.env.SERVICE_NAME,
    });
  });

  next();
});
```

### Frontend Metrics

```typescript
// ✅ Good
interface ClientMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  errors: ClientError[];
  userInteractions: UserInteraction[];
}

interface ClientError {
  message: string;
  file: string;
  line: number;
  column: number;
  stack?: string;
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input';
  element: string;
  timestamp: number;
  duration?: number;
}

// Report metrics
const reportClientMetrics = async (metrics: ClientMetrics) => {
  try {
    await fetch('/api/client-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
        service: 'web-app',
      }),
    });
  } catch (error) {
    // Don't block on metrics reporting
    console.error('Failed to report metrics:', error);
  }
};
```

---

## Log Correlation

### Log Format with Trace Context

```json
{
  "timestamp": "2026-04-23T10:30:00.000Z",
  "level": "INFO",
  "traceId": "abc-123-def-456",
  "spanId": "span-789",
  "service": "auth-service",
  "message": "User login successful",
  "userId": "user-123",
  "metadata": {
    "loginMethod": "password",
    "mfaEnabled": false
  }
}
```

### Log Correlation in Backend

```typescript
// ✅ Good
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(email: string, password: string): Promise<AuthResponse> {
    const traceId = this.getRequestTraceId();
    const spanId = this.getRequestSpanId();

    this.logger.log({
      level: 'info',
      message: 'User login attempt',
      traceId,
      spanId,
      metadata: { email, loginMethod: 'password' },
    });

    try {
      const user = await this.validateUser(email, password);
      
      this.logger.log({
        level: 'info',
        message: 'User login successful',
        traceId,
        spanId,
        metadata: { userId: user.id, email: user.email },
      });

      return this.generateToken(user);
    } catch (error) {
      this.logger.error({
        message: 'Login failed',
        traceId,
        spanId,
        error: error.message,
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        metadata: { email },
      });
      throw error;
    }
  }

  private getRequestTraceId(): string {
    const req = this.getRequest();
    return req?.traceId || 'no-trace-id';
  }

  private getRequestSpanId(): string {
    const req = this.getRequest();
    return req?.spanId || 'no-span-id';
  }
}
```

---

## Error Tracking & Correlation

### Error Event Format

```typescript
// ✅ Good
interface ErrorEvent {
  id: string;
  timestamp: string;
  traceId: string;
  spanId: string;
  service: string;
  level: 'error' | 'fatal';
  message: string;
  stack: string;
  context: {
    userId?: string;
    requestId?: string;
    metadata: Record<string, any>;
  };
  tags: {
    environment: string;
    service: string;
    version: string;
    [key: string]: string;
  };
}

// Report error with trace context
const reportError = async (
  error: Error,
  context?: Record<string, any>,
): Promise<void> => {
  const traceId = context?.traceId || 'no-trace-id';
  const spanId = context?.spanId || 'no-span-id';

  const event: ErrorEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    traceId,
    spanId,
    service: process.env.SERVICE_NAME,
    level: 'error',
    message: error.message,
    stack: error.stack,
    context: {
      userId: context?.userId,
      requestId: context?.requestId,
      metadata: context?.metadata || {},
    },
    tags: {
      environment: process.env.NODE_ENV,
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
    },
  };

  await fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
};
```

---

## Performance Monitoring

### Backend Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | From request to response |
| Database Query Time (p95) | < 50ms | Query execution only |
| Cache Hit Rate | > 90% | Hits / (Hits + Misses) |
| Error Rate | < 1% | Errors / Total Requests |
| CPU Usage | < 70% | Average over 5 minutes |
| Memory Usage | < 80% | Average over 5 minutes |

### Frontend Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 2.5s | From navigation start |
| FID | < 100ms | From first interaction |
| CLS | < 0.1 | During page lifetime |
| TTI | < 3.8s | From navigation start |
| Time to First Byte | < 200ms | Server response time |

---

## Health Check Standards

### Service Health Check

```typescript
// ✅ Good
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HttpCode(200)
  async check(): Promise<HealthCheck> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
    };
  }

  @Get('live')
  @HttpCode(200)
  async liveness(): Promise<LivenessCheck> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(200)
  async readiness(): Promise<ReadinessCheck> {
    const checks = await this.healthService.checkAll();
    const allHealthy = checks.every((check) => check.status === 'ok');

    return {
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
```

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2026-04-23T10:30:00.000Z",
  "service": "auth-service",
  "version": "1.0.0",
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "duration": 15,
      "message": "Connection established"
    },
    {
      "name": "redis",
      "status": "ok",
      "duration": 5,
      "message": "Connection established"
    },
    {
      "name": "auth-service",
      "status": "ok",
      "duration": 2,
      "message": "Service healthy"
    }
  ]
}
```

---

## Distributed Tracing Tools

### Recommended Tools

| Purpose | Tool | Integration |
|---------|------|-------------|
| Tracing | Jaeger / Tempo | OpenTelemetry |
| Metrics | Prometheus | OpenTelemetry |
| Logging | Loki | OpenTelemetry |
| APM | Datadog / New Relic | Native SDK |
| Alerting | Alertmanager | Prometheus |

### OpenTelemetry Configuration

```yaml
# Example OpenTelemetry Collector config
receivers:
  otlp:
    protocols:
      grpc:
      http:

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"
  jaeger:
    endpoint: "jaeger:14250"
    tls:
      enabled: false

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      exporters: [loki]
```

---

## Prohibited Actions

- No trace ID without propagation
- No metrics without labels
- No uncorrelated logs
- No ignoring errors silently
- No disabling tracing in production
- No logging sensitive data in traces
- No unbounded metric cardinality