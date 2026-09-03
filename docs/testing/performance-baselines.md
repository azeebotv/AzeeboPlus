# Performance Baselines — Azeebo+

This document defines acceptable performance thresholds for all services.

---

## Web Application (Next.js)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| First Contentful Paint (FCP) | < 1.5s | > 2.0s | > 3.0s |
| Largest Contentful Paint (LCP) | < 2.5s | > 3.0s | > 4.0s |
| Cumulative Layout Shift (CLS) | < 0.1 | > 0.15 | > 0.25 |
| Interaction to Next Paint (INP) | < 200ms | > 300ms | > 500ms |
| Time to First Byte (TTFB) | < 800ms | > 1.0s | > 1.5s |
| Total Page Weight | < 1MB | > 1.5MB | > 2MB |
| JavaScript Bundle Size | < 500KB | > 750KB | > 1MB |

### Page Load Targets
| Page | Load Time | FCP | LCP |
|------|-----------|-----|-----|
| Homepage | < 2s | < 1.5s | < 2.5s |
| Content Detail | < 2s | < 1.5s | < 2.5s |
| Search Results | < 1.5s | < 1.0s | < 2.0s |
| Profile | < 1.5s | < 1.0s | < 2.0s |
| Wallet | < 1.5s | < 1.0s | < 2.0s |

---

## API Gateway (NestJS)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Average Response Time | < 100ms | > 200ms | > 500ms |
| P95 Response Time | < 200ms | > 500ms | > 1000ms |
| P99 Response Time | < 500ms | > 1000ms | > 2000ms |
| Requests per Second | > 1000 | < 500 | < 200 |
| Error Rate | < 0.1% | > 1% | > 5% |
| Concurrent Connections | > 10,000 | < 5,000 | < 1,000 |

---

## Backend Services

### Content Service
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| List Query Time | < 50ms | > 100ms | > 200ms |
| Detail Query Time | < 20ms | > 50ms | > 100ms |
| Search Query Time | < 100ms | > 200ms | > 500ms |
| Cache Hit Rate | > 80% | < 70% | < 50% |

### Auth Service
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Login Response Time | < 200ms | > 500ms | > 1000ms |
| Token Refresh Time | < 50ms | > 100ms | > 200ms |
| Rate Limit Response | < 10ms | > 20ms | > 50ms |

### Payment Service
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Payment Init Time | < 500ms | > 1000ms | > 2000ms |
| Webhook Processing | < 100ms | > 200ms | > 500ms |
| Reconciliation Time | < 5s | > 10s | > 30s |

### Messaging Service
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Message Delivery | < 100ms | > 200ms | > 500ms |
| WebSocket Latency | < 50ms | > 100ms | > 200ms |
| Connection Stability | > 99% | < 98% | < 95% |

---

## Database (PostgreSQL)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Query Time (P95) | < 50ms | > 100ms | > 200ms |
| Connection Pool Usage | < 70% | > 80% | > 90% |
| Cache Hit Ratio | > 95% | < 90% | < 80% |
| Dead Tuples | < 1000 | > 5000 | > 10000 |
| Replication Lag | < 1s | > 5s | > 30s |

---

## Redis

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Get Latency | < 1ms | > 5ms | > 10ms |
| Set Latency | < 1ms | > 5ms | > 10ms |
| Memory Usage | < 70% | > 80% | > 90% |
| Hit Rate | > 80% | < 70% | < 50% |
| Connected Clients | < 1000 | > 2000 | > 5000 |

---

## Infrastructure

### Kubernetes
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Pod CPU Usage | < 70% | > 80% | > 90% |
| Pod Memory Usage | < 80% | > 85% | > 95% |
| Pod Restart Count | < 1/day | > 3/day | > 10/day |
| HPA Scaling Time | < 30s | > 60s | > 120s |

### Load Balancer
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Active Connections | < 10,000 | > 15,000 | > 20,000 |
| Request Rate | < 10,000/s | > 15,000/s | > 20,000/s |
| 5xx Error Rate | < 0.01% | > 0.1% | > 1% |

---

## Monitoring & Alerting

### Prometheus Alerts
| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| ServiceDown | up == 0 | 1m | critical |
| HighErrorRate | > 5% | 5m | warning |
| HighLatency | P95 > 1s | 5m | warning |
| HighMemoryUsage | > 80% | 5m | warning |
| HighCPUUsage | > 80% | 5m | warning |
| PaymentFailureRate | > 10% | 5m | critical |

### Grafana Dashboards
- Service Overview
- API Gateway Metrics
- Database Performance
- Redis Performance
- Kubernetes Cluster
- Payment Analytics

---

## Testing Load Profiles

### Normal Load
- 100 concurrent users
- 500 requests/second
- 24/7 sustained

### Peak Load
- 1000 concurrent users
- 2000 requests/second
- 2-hour duration

### Stress Test
- 5000 concurrent users
- 5000 requests/second
- 1-hour duration

### Spike Test
- 10,000 concurrent users
- 10,000 requests/second
- 5-minute duration

---

## Baseline Measurements

### Last Updated: 2024-01-15
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| FCP | 1.2s | < 1.5s | Pass |
| LCP | 2.1s | < 2.5s | Pass |
| CLS | 0.05 | < 0.1 | Pass |
| API P95 | 150ms | < 200ms | Pass |
| Error Rate | 0.05% | < 0.1% | Pass |

---

*This document should be reviewed and updated quarterly.*
