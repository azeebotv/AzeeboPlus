# Azeebo+ Infrastructure Monitoring Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines infrastructure monitoring standards for Azeebo+ including metrics, alerts, and dashboards.

---

## Monitoring Stack

### Tools

| Purpose | Tool | Version |
|---------|------|---------|
| Metrics | Prometheus | 2.45+ |
| Tracing | Jaeger | 1.45+ |
| Logging | Loki | 2.9+ |
| Visualization | Grafana | 10.0+ |
| Alerting | Alertmanager | 0.65+ |
| APM | Datadog | Latest |

### Architecture

```
App → Metrics → Prometheus → Storage
     ↓
  Traces → Jaeger
     ↓
  Logs → Loki → Elasticsearch
     ↓
  Visualization → Grafana
     ↓
  Alerting → Alertmanager → Slack/PagerDuty
```

---

## Metrics Standards

### Core Infrastructure Metrics

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|-----------------|
| `node_cpu_usage_seconds_total` | Counter | instance, mode | > 80% for 5 min |
| `node_memory_MemAvailable_bytes` | Gauge | instance | < 20% for 5 min |
| `node_filesystem_avail_bytes` | Gauge | instance, mountpoint | < 10% for 5 min |
| `node_network_receive_bytes_total` | Counter | instance, device | N/A |
| `node_network_transmit_bytes_total` | Counter | instance, device | N/A |

### Service Metrics

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|-----------------|
| `http_requests_total` | Counter | method, path, status | N/A |
| `http_request_duration_seconds` | Histogram | method, path, status | p95 > 200ms |
| `http_requests_in_progress` | Gauge | method, path | N/A |
| `database_connections_active` | Gauge | database | > 80% of max |
| `cache_hit_ratio` | Gauge | cache | < 90% |
| `error_total` | Counter | service, type, code | > 10/min |

### Kubernetes Metrics

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|-----------------|
| `kube_pod_status_ready` | Gauge | pod, namespace, condition | < 1 for 5 min |
| `kube_pod_container_status_running` | Gauge | pod, namespace | < 1 for 5 min |
| `kube_pod_container_resource_requests` | Gauge | pod, namespace, resource | N/A |
| `kube_pod_container_resource_limits` | Gauge | pod, namespace, resource | N/A |
| `kube_deployment_status_replicas_available` | Gauge | deployment, namespace | < 1 for 5 min |

---

## Alerting Standards

### Alert Categories

| Category | Severity | Response Time | Examples |
|----------|----------|---------------|----------|
| Critical | P1 | 15 min | Service down, data loss |
| High | P2 | 1 hour | High error rate, degraded performance |
| Medium | P3 | 4 hours | Increased latency, capacity issues |
| Low | P4 | 24 hours | Minor issues, warnings |

### Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: infrastructure
    rules:
      - alert: NodeCPUHigh
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: medium
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: NodeMemoryLow
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 20
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Low memory on {{ $labels.instance }}"
          description: "Available memory is below 20% for more than 5 minutes"

      - alert: NodeDiskLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Available disk space is below 10% for more than 5 minutes"

  - name: services
    rules:
      - alert: ServiceDown
        expr: up{service="auth-service"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Auth service is down"
          description: "Auth service has been down for more than 5 minutes"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High error rate for {{ $labels.service }}"
          description: "Error rate is above 5% for more than 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "High latency for {{ $labels.service }}"
          description: "99th percentile latency is above 1 second"
```

### Alert Channels

| Severity | Channels |
|----------|----------|
| Critical | PagerDuty + Slack + Email |
| High | Slack + Email |
| Medium | Slack |
| Low | Slack (dedicated channel) |

---

## Dashboard Standards

### Core Dashboards

1. **Infrastructure Overview**
   - Node CPU/Memory/Disk
   - Network traffic
   - Kubernetes cluster health

2. **Service Health**
   - Request rate
   - Error rate
   - Latency distribution
   - Service dependencies

3. **Database Health**
   - Connection pool usage
   - Query performance
   - Replication lag
   - Storage usage

4. **Cache Health**
   - Hit/miss ratio
   - Memory usage
   - Eviction rate

5. **Kubernetes Health**
   - Pod status
   - Deployment status
   - Resource utilization
   - Node health

### Dashboard Best Practices

- Use consistent time ranges
- Include trend indicators
- Add annotations for deployments
- Group related metrics
- Include alert status
- Provide export functionality

---

## Log Aggregation

### Log Format

```json
{
  "timestamp": "2026-04-23T10:30:00.000Z",
  "level": "INFO",
  "traceId": "abc-123-def",
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

### Log Indices

| Index | Retention | Purpose |
|-------|-----------|---------|
| `logs-app-*` | 30 days | Application logs |
| `logs-k8s-*` | 14 days | Kubernetes logs |
| `logs-ingress-*` | 7 days | Ingress logs |
| `logs-audit-*` | 1 year | Audit logs |

---

## Tracing Standards

### Trace Sampling

| Environment | Sampling Rate |
|-------------|---------------|
| Development | 100% |
| Staging | 100% |
| Production | 1% |

### Trace Retention

| Environment | Retention |
|-------------|-----------|
| Development | 7 days |
| Staging | 14 days |
| Production | 30 days |

---

## Health Check Standards

### Service Health Check

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
    }
  ]
}
```

### Infrastructure Health Check

| Component | Check | Threshold |
|-----------|-------|-----------|
| Database | Connection | < 100ms |
| Redis | Connection | < 10ms |
| Elasticsearch | Connection | < 50ms |
| S3 | Connection | < 100ms |
| CDN | Health | 100% healthy |

---

## SLOs & SLAs

### SLO Targets

| SLO | Target | Measurement |
|-----|--------|-------------|
| API Availability | 99.9% | Monthly |
| API Latency (p95) | < 200ms | Daily |
| Error Rate | < 0.1% | Daily |
| Database Uptime | 99.9% | Monthly |
| Cache Hit Rate | > 90% | Daily |

### Error Budget

| Period | Error Budget |
|--------|--------------|
| Daily | 14.4 minutes |
| Weekly | 1.68 hours |
| Monthly | 7.2 hours |

---

## Incident Response

### Incident Severity

| Severity | Description | Response Time |
|----------|-------------|---------------|
| P1 | Service down, data loss | 15 min |
| P2 | Degraded performance | 1 hour |
| P3 | Minor issues | 4 hours |
| P4 | Enhancement requests | 24 hours |

### Incident Communication

| Severity | Communication |
|----------|---------------|
| P1 | Slack channel + Email + PagerDuty |
| P2 | Slack channel + Email |
| P3 | Slack channel |
| P4 | No immediate communication |

---

## Prohibited Actions

- No monitoring without alerts
- No ignoring critical alerts
- No disabling health checks
- No logging sensitive data
- No unbounded metric cardinality
- No disabling tracing in production
- No ignoring SLO breaches
- No manual alert suppression without approval