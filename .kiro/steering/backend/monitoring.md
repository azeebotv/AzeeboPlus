# Azeebo+ Monitoring & Observability Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines monitoring, logging, and observability standards for the Azeebo+ platform.

---

## Logging Standards

### Structured Logging Format

All logs MUST be JSON formatted:

```json
{
  "timestamp": "2026-04-23T10:30:00.000Z",
  "level": "INFO",
  "traceId": "abc-123-def-456",
  "spanId": "span-789",
  "service": "auth-service",
  "message": "User login successful",
  "userId": "user-123",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "loginMethod": "password",
    "mfaEnabled": false
  }
}
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `DEBUG` | Development debugging | Variable values, method entry/exit |
| `INFO` | Normal operations | User login, payment processed |
| `WARN` | Unexpected but handled | Rate limit approaching, cache miss |
| `ERROR` | Errors handled gracefully | Database retry, validation failure |
| `FATAL` | Unrecoverable errors | Service crash, data corruption |

### Logging Rules

**DO:**
- Include relevant context in logs
- Use structured JSON format
- Include trace/span IDs for correlation
- Log at appropriate levels
- Include error codes for known errors

**DON'T:**
- Log sensitive data (passwords, tokens, PII)
- Log full request bodies
- Use console.log directly
- Create logs without context
- Log the same event repeatedly in loops

### Backend Logging (NestJS)

```typescript
// ✅ Good
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(email: string, password: string): Promise<AuthResponse> {
    this.logger.debug(`Attempting login for user: ${email}`);

    try {
      const user = await this.validateUser(email, password);
      
      this.logger.info('User login successful', {
        userId: user.id,
        email: user.email,
        loginMethod: 'password',
      });

      return this.generateToken(user);
    } catch (error) {
      this.logger.error('Login failed', {
        email,
        error: error.message,
        errorCode: 'AUTH_INVALID_CREDENTIALS',
      });
      throw error;
    }
  }
}

// ❌ Bad
console.log('User logged in:', user);
```

### Frontend Logging

```typescript
// ✅ Good
import { Logger } from '@/lib/logger';

const logger = new Logger('PaymentComponent');

const processPayment = async (amount: number) => {
  logger.info('Processing payment', {
    amount,
    currency: 'NGN',
    userId: currentUser.id,
  });

  try {
    const result = await paymentService.initialize(amount);
    logger.info('Payment initialized', { paymentId: result.id });
    return result;
  } catch (error) {
    logger.error('Payment failed', {
      amount,
      error: error.message,
      errorCode: error.code,
    });
    throw error;
  }
};

// ❌ Bad
console.log('Payment processing');
```

---

## Tracing & Correlation

### Trace ID Propagation

Every request MUST include a trace ID:

```typescript
// Backend - NestJS Interceptor
import { Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: any, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const traceId = req.headers['x-trace-id'] || randomUUID();
    
    req.traceId = traceId;
    req.headers['x-trace-id'] = traceId;

    return next.handle();
  }
}
```

### Span Context

```typescript
// ✅ Good
interface SpanContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  timestamp: number;
  duration: number;
  service: string;
  operation: string;
  status: 'ok' | 'error';
  tags: Record<string, string>;
}
```

---

## Metrics

### Core Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, path, status | Request duration |
| `http_requests_in_progress` | Gauge | method, path | In-progress requests |
| `database_queries_total` | Counter | query, status | Database query count |
| `database_query_duration_seconds` | Histogram | query | Query duration |
| `cache_hits_total` | Counter | cache, type | Cache hits |
| `cache_misses_total` | Counter | cache, type | Cache misses |
| `error_total` | Counter | service, type, code | Error count |
| `custom_event_total` | Counter | event, universe | Custom events |

### Prometheus Metrics (Backend)

```typescript
// ✅ Good
import { Counter, Histogram, Gauge } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const activeConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Active database connections',
});

// Usage
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    path: req.path,
  });

  res.on('finish', () => {
    end({ status: res.statusCode });
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
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
  timeToInteractive: number;
  errors: Array<{
    message: string;
    file: string;
    line: number;
    column: number;
  }>;
  userInteractions: Array<{
    type: string;
    element: string;
    timestamp: number;
  }>;
}

// Report metrics to backend
const reportMetrics = async (metrics: ClientMetrics) => {
  await fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
  });
};
```

---

## Health Checks

### Backend Health Endpoints

Every service MUST implement:

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
      service: 'auth-service',
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
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "duration": 15
    },
    {
      "name": "redis",
      "status": "ok",
      "duration": 5
    },
    {
      "name": "auth-service",
      "status": "ok",
      "duration": 2
    }
  ]
}
```

---

## Alerting

### Alert Categories

| Category | Severity | Response Time | Examples |
|----------|----------|---------------|----------|
| Critical | P1 | 15 min | Service down, data loss |
| High | P2 | 1 hour | High error rate, degraded performance |
| Medium | P3 | 4 hours | Increased latency, capacity issues |
| Low | P4 | 24 hours | Minor issues, warnings |

### Alert Rules

```yaml
# Prometheus alerting rules
groups:
  - name: auth-service
    rules:
      - alert: AuthServiceDown
        expr: up{service="auth-service"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Auth service is down"
          description: "Auth service has been down for more than 5 minutes"

      - alert: HighAuthErrorRate
        expr: rate(auth_login_failed_total[5m]) > 10
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High authentication failure rate"
          description: "Authentication failures are above 10 per minute"

      - alert: HighDatabaseLatency
        expr: histogram_quantile(0.99, rate(database_query_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "High database latency"
          description: "99th percentile database latency is above 1 second"
```

### Alert Channels

| Severity | Channels |
|----------|----------|
| Critical | PagerDuty + Slack + Email |
| High | Slack + Email |
| Medium | Slack |
| Low | Slack (dedicated channel) |

---

## Dashboard Requirements

### Core Dashboards

1. **Platform Overview**
   - DAU/MAU trends
   - Revenue metrics
   - Error rates
   - Service health

2. **Service-Specific**
   - Auth service: Login rates, token issues
   - Payment service: Transaction rates, failures
   - Content service: Uploads, views, errors

3. **Business Metrics**
   - User acquisition
   - Retention curves
   - Conversion funnels
   - Revenue by universe

### Dashboard Best Practices

- Use consistent time ranges
- Include trend indicators
- Add annotations for deployments
- Group related metrics
- Include alert status
- Provide export functionality

---

## Error Tracking

### Error Collection

```typescript
// ✅ Good
interface ErrorEvent {
  id: string;
  timestamp: string;
  service: string;
  level: 'error' | 'fatal';
  message: string;
  stack: string;
  context: {
    userId?: string;
    requestId?: string;
    traceId?: string;
    metadata: Record<string, any>;
  };
  tags: Record<string, string>;
}

// Report error
const reportError = async (error: Error, context?: Record<string, any>) => {
  const event: ErrorEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME,
    level: 'error',
    message: error.message,
    stack: error.stack,
    context: {
      userId: context?.userId,
      requestId: context?.requestId,
      traceId: context?.traceId,
      metadata: context?.metadata || {},
    },
    tags: {
      environment: process.env.NODE_ENV,
      service: process.env.SERVICE_NAME,
    },
  };

  await fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
};
```

### Error Grouping

Errors should be grouped by:
- Error type
- Error message (normalized)
- Stack trace (normalized)
- Context

---

## Performance Monitoring

### Core Web Vitals (Frontend)

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | From navigation start |
| FID (First Input Delay) | < 100ms | From first interaction |
| CLS (Cumulative Layout Shift) | < 0.1 | During page lifetime |
| TTI (Time to Interactive) | < 3.8s | From navigation start |

### Backend Performance

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Database Query Time (p95) | < 50ms |
| Cache Hit Rate | > 90% |
| Error Rate | < 1% |

---

## Log Retention

| Environment | Log Retention | Metric Retention |
|-------------|---------------|------------------|
| Development | 7 days | 30 days |
| Staging | 14 days | 90 days |
| Production | 30 days | 1 year |

---

## Prohibited Actions

- No logging sensitive data
- No console.log in production
- No unstructured logs
- No ignoring errors silently
- No alert fatigue (too many alerts)
- No disabling monitoring in any environment