# Load Test Specifications

This document specifies load tests for critical paths in the Azeebo platform.

## Test Framework

- **Primary**: k6 (Grafana k6)
- **Supporting**: Artillery for complex scenarios
- **Metrics**: Prometheus + Grafana

## Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Staging | https://staging.api.azeebo.com | Pre-production validation |
| Production | https://api.azeebo.com | Baseline and regression |

## Test Scenarios

### 1. Gateway Load Test

**Endpoint**: `GET/POST /api/*`
**Purpose**: Validate API Gateway handles expected traffic

| Scenario | RPS Target | Duration | VUs |
|----------|------------|----------|-----|
| Baseline | 100 | 5m | 50 |
| Peak | 500 | 10m | 200 |
| Stress | 1000 | 5m | 400 |
| Spike | 2000 | 2m | 800 |

**Success Criteria**:
- p95 latency < 500ms
- Error rate < 1%
- No 5xx errors

### 2. Feed Load Test

**Endpoints**: `GET /content/feed`, `GET /reality/feed`, `GET /sports/feed`
**Purpose**: Validate feed serving under load

| Scenario | RPS Target | Duration | VUs |
|----------|------------|----------|-----|
| Normal | 200 | 10m | 100 |
| Peak | 800 | 5m | 400 |

**Success Criteria**:
- p95 latency < 300ms
- p99 latency < 800ms
- Cache hit ratio > 70%

### 3. Voting/Supervote Load Test

**Endpoints**: `POST /reality/votes`, `POST /reality/supervotes`
**Purpose**: Validate voting system handles high-volume events

| Scenario | RPS Target | Duration | VUs |
|----------|------------|----------|-----|
| Normal | 50 | 10m | 50 |
| Finale | 500 | 5m | 500 |
| Flash | 1000 | 30s | 1000 |

**Success Criteria**:
- p95 latency < 200ms
- Transaction integrity 100%
- No duplicate votes processed
- Wallet deductions accurate

### 4. Analytics Ingestion Load Test

**Endpoint**: `POST /analytics/track`
**Purpose**: Validate analytics pipeline handles event volume

| Scenario | Events/sec | Duration | VUs |
|----------|------------|----------|-----|
| Normal | 1000 | 10m | 50 |
| Peak | 5000 | 5m | 200 |
| Campaign | 10000 | 10m | 500 |

**Success Criteria**:
- p95 latency < 100ms
- No events dropped
- Correct user/universe attribution

### 5. Search Load Test

**Endpoint**: `GET /search?q=...`
**Purpose**: Validate search performance

| Scenario | RPS Target | Duration | VUs |
|----------|------------|----------|-----|
| Normal | 100 | 10m | 50 |
| Peak | 300 | 5m | 150 |

**Success Criteria**:
- p95 latency < 500ms
- p99 latency < 1s
- Relevance scores maintained

### 6. Media Upload Load Test

**Endpoints**: `POST /media/upload`, `POST /media/transcode`
**Purpose**: Validate media processing pipeline

| Scenario | Concurrent Uploads | Duration | File Size |
|----------|-------------------|----------|-----------|
| Normal | 10 | 30m | 100MB |
| Peak | 50 | 15m | 500MB |

**Success Criteria**:
- Upload completes within timeout
- Transcoding completes within SLA
- No partial uploads

### 7. Payment Webhook Load Test

**Endpoints**: `POST /webhooks/paystack`, `POST /webhooks/flutterwave`
**Purpose**: Validate webhook processing under load

| Scenario | Webhooks/sec | Duration | VUs |
|----------|--------------|----------|-----|
| Normal | 50 | 10m | 25 |
| Batch | 200 | 5m | 100 |
| Storm | 500 | 2m | 250 |

**Success Criteria**:
- All webhooks processed
- Idempotency maintained
- No duplicate transactions
- p95 processing time < 500ms

## k6 Script Example

```javascript
// load-tests/gateway-baseline.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at baseline
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'errors': ['rate<0.01'],          // Error rate < 1%
    'latency': ['p(95)<500'],         // p95 latency < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.api.azeebo.com';

export default function () {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/content/feed?page=1&limit=20`);

  latency.add(Date.now() - start);
  errorRate.add(res.status !== 200);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has content': (r) => r.json('data').length > 0,
  });

  sleep(1);
}
```

## Artillery Script Example

```yaml
# load-tests/voting-load.yml
config:
  target: "https://staging.api.azeebo.com"
  phases:
    - duration: 300
      arrivalRate: 50
      name: "Normal load"
    - duration: 180
      arrivalRate: 250
      name: "Peak load"
    - duration: 60
      arrivalRate: 500
      name: "Stress test"
  processor: "./voting-processor.js"

scenarios:
  - name: "Submit vote"
    weight: 70
    flow:
      - post:
          url: "/reality/shows/{{ showId }}/vote"
          json:
            contestantId: "{{ contestantId }}"
            amount: 100
          beforeRequest: "setAuth"
          afterResponse: "processVoteResponse"

  - name: "Submit supervote"
    weight: 30
    flow:
      - post:
          url: "/reality/shows/{{ showId }}/supervote"
          json:
            contestantId: "{{ contestantId }}"
            count: 5
          beforeRequest: "setAuth"
```

## CI Integration

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        run: |
          curl -fsSL https://github.com/grafana/k6/releases/download/v0.49.0/k6-v0.49.0-linux-amd64.tar.gz | tar xz
          sudo mv k6 /usr/local/bin

      - name: Run gateway baseline
        run: k6 run load-tests/gateway-baseline.js
        env:
          BASE_URL: ${{ inputs.environment == 'staging' && 'https://staging.api.azeebo.com' || 'https://api.azeebo.com' }}

      - name: Run voting load test
        run: k6 run load-tests/voting-load.js
        env:
          BASE_URL: ${{ inputs.environment == 'staging' && 'https://staging.api.azeebo.com' || 'https://api.azeebo.com' }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: |
            *.json
            *.html
```

## Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|------------------|
| Request Rate | > 95% of target | < 80% of target |
| Error Rate | < 1% | > 5% |
| p95 Latency | < 500ms | > 1s |
| p99 Latency | < 1s | > 2s |
| CPU Usage | < 80% | > 90% |
| Memory Usage | < 80% | > 90% |
| DB Connection Pool | < 80% | > 90% |
| Redis Connection Pool | < 80% | > 90% |

## Performance Budget

| Service | Max p95 Latency | Max Error Rate |
|---------|-----------------|----------------|
| API Gateway | 200ms | 0.1% |
| Auth Service | 150ms | 0.1% |
| Content Service | 300ms | 0.5% |
| Wallet Service | 250ms | 0.1% |
| Payment Service | 500ms | 0.5% |
| Reality Service | 200ms | 0.5% |
| Analytics Service | 100ms | 1% |

## Peak Concurrent Users

### Target Metrics

| Scenario | Concurrent Users | Duration | Expected Throughput |
|----------|------------------|----------|---------------------|
| Normal Operation | 10,000 | Continuous | 1,000 req/sec |
| Peak Hours | 50,000 | 2 hours | 5,000 req/sec |
| Special Events | 100,000 | 30 mins | 10,000 req/sec |
| Disaster Recovery | 20,000 | Continuous | 2,000 req/sec |

### Success Criteria
- System remains responsive (p95 < 500ms)
- No service degradation during peak
- All critical services maintain availability

## Payment Processing Throughput

### Test Scenarios

**Endpoint**: `POST /payments/initialize`, `POST /payments/verify`, `POST /wallet/fund`

| Scenario | Transactions/sec | Duration | VUs |
|----------|------------------|----------|-----|
| Normal | 100 | 10m | 50 |
| Peak | 500 | 5m | 200 |
| Flash Sale | 1000 | 2m | 500 |

### Success Criteria
- Transaction success rate > 99.9%
- p95 latency < 500ms
- No double-charging
- Wallet balance consistency maintained
- Webhook delivery success > 99.9%

### Database Query Performance

**Critical Queries to Test**:

| Query | Target p95 | Target p99 |
|-------|-----------|-----------|
| User authentication | < 50ms | < 100ms |
| Content feed retrieval | < 200ms | < 500ms |
| Wallet balance lookup | < 100ms | < 200ms |
| Vote processing | < 150ms | < 300ms |
| Search queries | < 300ms | < 800ms |

### Test Scenarios

| Scenario | Concurrent Queries | Duration | Query Mix |
|----------|-------------------|----------|-----------|
| Read-heavy | 500 | 10m | 90% read, 10% write |
| Write-heavy | 200 | 5m | 30% read, 70% write |
| Mixed | 300 | 10m | 60% read, 40% write |

### Success Criteria
- All queries meet p95 targets
- Database CPU < 80%
- Query cache hit ratio > 70%
- No deadlocks or timeouts

## Media Streaming Capacity

### Test Scenarios

| Scenario | Concurrent Streams | Bitrate | Duration |
|----------|-------------------|---------|----------|
| Normal | 1,000 | 2Mbps | 30m |
| Peak | 5,000 | 2Mbps | 15m |
| HD Streaming | 2,000 | 5Mbps | 30m |

### Success Criteria
- Stream startup time < 3s
- Buffer underrun rate < 1%
- CDN cache hit ratio > 90%
- Origin server CPU < 70%

### Load Test Script: Payment Throughput

```javascript
// load-tests/payment-throughput.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('payment_errors');
const latency = new Trend('payment_latency');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'payment_errors': ['rate<0.001'],
    'payment_latency': ['p(95)<500', 'p(99)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.api.azeebo.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  const payload = JSON.stringify({
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: 'NGN',
    paymentMethod: ['card', 'transfer', 'wallet'][Math.floor(Math.random() * 3)],
    description: 'Load test payment',
  });

  const res = http.post(`${BASE_URL}/payments/initialize`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });

  latency.add(res.timings.duration);
  errorRate.add(res.status !== 201);

  check(res, {
    'payment initialized': (r) => r.status === 201,
    'has payment ID': (r) => r.json('data.paymentId') !== undefined,
  });

  sleep(0.5);
}
```

### Load Test Script: Database Query Performance

```javascript
// load-tests/database-query.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const queryLatency = new Trend('query_latency');
const errorRate = new Rate('query_errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'query_errors': ['rate<0.01'],
    'query_latency': ['p(95)<300', 'p(99)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.api.azeebo.com';

export default function () {
  const queries = [
    () => http.get(`${BASE_URL}/content/feed?page=1&limit=20`),
    () => http.get(`${BASE_URL}/search?q=test`),
    () => http.get(`${BASE_URL}/users/profile`),
    () => http.get(`${BASE_URL}/wallet/balance`),
    () => http.get(`${BASE_URL}/reality/shows`),
  ];

  const queryFn = queries[Math.floor(Math.random() * queries.length)];
  const res = queryFn();

  queryLatency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2);
}
```

### Load Test Script: Media Streaming

```javascript
// load-tests/media-streaming.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const streamStartLatency = new Trend('stream_start_latency');
const errorRate = new Rate('stream_errors');

export const options = {
  stages: [
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'stream_errors': ['rate<0.01'],
    'stream_start_latency': ['p(95)<3000', 'p(99)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.api.azeebo.com';

export default function () {
  const contentIds = ['video-1', 'video-2', 'video-3', 'video-4', 'video-5'];
  const contentId = contentIds[Math.floor(Math.random() * contentIds.length)];
  
  const res = http.get(`${BASE_URL}/media/stream/${contentId}`, {
    headers: { 'Range': 'bytes=0-102400' },
  });

  streamStartLatency.add(res.timings.duration);
  errorRate.add(res.status !== 206 && res.status !== 200);

  check(res, {
    'stream started': (r) => r.status === 206 || r.status === 200,
    'content-length present': (r) => r.headers['Content-Length'] !== undefined,
  });

  sleep(10);
}
```