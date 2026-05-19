# @azeebo/observability

Observability package for Azeebo services providing metrics, tracing, and health checks.

## Installation

```bash
npm install @azeebo/observability
```

## Features

### MetricsService

Prometheus-compatible metrics with counters, gauges, histograms, and summaries.

```typescript
import { MetricsService } from '@azeebo/observability';

const metrics = new MetricsService();

// Counter for discrete events
metrics.incrementCounter('http_requests_total', { method: 'GET', status: '200' });

// Gauge for current values
metrics.setGauge('active_connections', 42);

// Histogram for distributions
metrics.recordHistogram('request_duration_ms', 150, { endpoint: '/api/users' });
```

### TracingService

Distributed tracing with span management.

```typescript
import { TracingService } from '@azeebo/observability';

const tracer = new TracingService();

// Start a span
const span = tracer.startSpan('process_payment');
span.setAttribute('user_id', userId);
span.setAttribute('amount', amount);

// End span
span.end();

// Create child span
const childSpan = tracer.startSpan('validate_payment', span);
childSpan.end();
```

### HealthCheckService

Health checks for database, Redis, and external services.

```typescript
import { HealthCheckService } from '@azeebo/observability';

const health = new HealthCheckService();

// Register checks
health.registerCheck('database', async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'healthy' };
});

health.registerCheck('redis', async () => {
  await redis.ping();
  return { status: 'healthy' };
});

// Run all checks
const result = await health.runChecks();
console.log(result);
// { database: { status: 'healthy' }, redis: { status: 'healthy' } }
```

## Integration with NestJS

```typescript
import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@azeebo/observability';

@Module({
  imports: [ObservabilityModule.register({
    serviceName: 'user-service',
    metricsEnabled: true,
    tracingEnabled: true,
  })],
})
export class AppModule {}
```

## Metrics Endpoint

When enabled, metrics are exposed at `/metrics` in Prometheus format.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | true | Enable metrics collection |
| `TRACING_ENABLED` | true | Enable distributed tracing |
| `OTEL_EXPORTER_URL` | - | OpenTelemetry collector URL |
| `SERVICE_NAME` | - | Service name for tracing |