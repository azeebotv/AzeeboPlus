# Chaos/Failure Test Specifications

This document specifies chaos engineering tests to validate system resilience and failure handling.

## Framework

- **Primary**: Chaos Toolkit
- **Kubernetes**: LitmusChaos
- **AWS**: AWS Chaos Studio

## Test Categories

### 1. Provider Downtime

| Experiment | Target | Expected Behavior | Severity |
|------------|--------|------------------|----------|
| Paystack API down | payment-service | Queue requests, retry with backoff | P0 |
| Flutterwave API down | payment-service | Queue requests, retry with backoff | P0 |
| SMS provider down | notification-service | Fallback to alternative provider | P1 |
| Email provider down | notification-service | Queue emails, retry later | P1 |
| External auth down | auth-service | Continue with cached tokens | P1 |

**Test Scenario**:
```yaml
# chaos/provider-downtime.yaml
apiVersion: chaos.chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: paystack-api-down
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: one
  duration: '300s'
  selector:
    namespaces:
      - production
    labelSelector:
      app: paystack-mock
```

### 2. Redis Outage

| Experiment | Expected Behavior |
|------------|-------------------|
| Redis pod fails | Services fall back to database sessions |
| Redis cluster partitioned | Local caching continues |
| Redis memory exhausted | LRU eviction, graceful degradation |

**Test Scenario**:
```yaml
apiVersion: chaos.chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: redis-network-partition
spec:
  action: partition
  mode: all
  duration: '120s'
  selector:
    namespaces:
      - production
    labelSelectors:
      app: redis
```

### 3. Database Connection Loss

| Experiment | Expected Behavior |
|------------|-------------------|
| Primary DB down | Read replicas continue serving |
| All DBs down | Services return 503 with retry header |
| Connection pool exhausted | Queue requests, timeout gracefully |
| Slow queries | Circuit breaker opens, cache serves |

**Test Scenario**:
```yaml
apiVersion: chaos.chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: postgres-failure
spec:
  action: pod-failure
  mode: one
  duration: '180s'
  selector:
    namespaces:
      - production
    labelSelectors:
      app: postgres-primary
```

### 4. Queue Backlog

| Experiment | Expected Behavior |
|------------|-------------------|
| Consumer down | Messages accumulate, alerts fire |
| Consumer slow | Backpressure propagates to producers |
| Queue full | Reject new messages, return 503 |
| DLQ buildup | Alert, process manually |

**Test Scenario**:
```yaml
apiVersion: chaos.chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: queue-consumer-down
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: queue-consumer
```

### 5. Webhook Duplication

| Test Case | Description | Expected Behavior |
|-----------|-------------|-------------------|
| Duplicate webhook delivery | Same event sent twice | Idempotency key prevents double processing |
| Out-of-order webhooks | Events arrive out of order | Event sourcing handles correctly |
| Missing webhook | Event not delivered | Retry mechanism eventually delivers |

**Test Implementation**:
```typescript
describe('Webhook Idempotency', () => {
  it('handles duplicate webhook delivery', async () => {
    const eventId = 'evt_duplicate_test';
    const webhookPayload = createWebhookPayload(eventId);

    // First delivery
    const result1 = await processWebhook(webhookPayload);
    expect(result1.status).toBe('processed');

    // Duplicate delivery
    const result2 = await processWebhook(webhookPayload);
    expect(result2.status).toBe('duplicate');
    expect(result2.originalEventId).toBe(result1.id);
  });
});
```

### 6. Partial Transaction Failures

| Test Case | Description | Expected Behavior |
|-----------|-------------|-------------------|
| Wallet debit succeeds, content fails | Rollback wallet debit |
| Payment succeeds, wallet credit fails | Refund payment |
| Vote succeeds, reward fails | Log inconsistency, alert |
| Multiple wallet operations | Atomic transaction |

**Test Implementation**:
```typescript
describe('Transaction Compensation', () => {
  it('rolls back wallet debit when content provisioning fails', async () => {
    const initialBalance = await walletService.getBalance(walletId);

    try {
      await contentService.purchaseContent({
        walletId,
        contentId,
        amount: 100,
      });
    } catch (error) {
      // Verify balance unchanged
      const finalBalance = await walletService.getBalance(walletId);
      expect(finalBalance).toBe(initialBalance);
    }
  });
});
```

### 7. Network Partitions

| Experiment | Expected Behavior |
|------------|-------------------|
| Service mesh split | Services continue with local state |
| Cross-AZ failure | Failover to other availability zone |
| Internet connectivity loss | Graceful degradation, offline mode |

### 8. Resource Exhaustion

| Resource | Experiment | Expected Behavior |
|----------|------------|-------------------|
| CPU | Throttle CPU | Rate limiting activates |
| Memory | OOMKill pod | Kubernetes restarts, circuit breaker |
| Disk | Fill disk | Cleanup job triggers, writes fail |
| File descriptors | Exhaust FDs | Connection pooling limits |

## Running Chaos Tests

### Local Development

```bash
# Install chaos toolkit
pip install chaostoolkit
pip install chaostoolkit-litmus

# Run a single experiment
chaos run chaos/experiments/provider-downtime.json

# Verify experiment was safe
chaos run --dry chaos/experiments/provider-downtime.json
```

### CI/CD Integration

```yaml
# .github/workflows/chaos.yml
name: Chaos Engineering
on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly at 3 AM
  workflow_dispatch:

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install chaos toolkit
        run: |
          pip install chaostoolkit
          pip install chaostoolkit-litmus
          pip install chaosplatform-cc

      - name: Run chaos experiments
        run: |
          chaos run --install http://litmusportal:9091 chaos/experiments/
        env:
          LITMUS_TOKEN: ${{ secrets.LITMUS_TOKEN }}

      - name: Upload experiment report
        uses: actions/upload-artifact@v3
        with:
          name: chaos-report
          path: report.json
```

## Experiment Definitions

### Paystack API Down

```json
{
  "title": "Paystack API unavailable",
  "description": "Verify payment service handles Paystack outage gracefully",
  "steady-state-hypothesis": {
    "title": "Payment service is healthy",
    "probes": [
      {
        "type": "http",
        "name": "payment-health",
        "tolerance": 200,
        "provider": {
          "type": "http",
          "url": "http://payment-service:3003/health"
        }
      }
    ]
  },
  "method": [
    {
      "type": "action",
      "name": "kill-paystack-mock",
      "provider": {
        "type": "python",
        "module": "chaosk8s.pod.actions",
        "func": "kill_microservice",
        "arguments": {
          "label_selector": "app=paystack-mock",
          "namespace": "production"
        }
      }
    }
  ],
  "rollbacks": []
}
```

## Observability Requirements

All chaos experiments must emit:
- Experiment start/end events
- Steady state before/after metrics
- Any errors encountered

## Rollback Procedures

Each experiment must have defined rollbacks:
1. Automatic rollback on steady state violation
2. Manual rollback procedures documented
3. Escalation path if rollback fails

## Severity Classification

| Severity | Impact | Test Frequency | Approval |
|----------|--------|----------------|----------|
| P0 | Revenue loss, data corruption | Weekly | DevOps Lead |
| P1 | Degraded performance | Bi-weekly | Team Lead |
| P2 | Minor feature impact | Monthly | Tech Lead |

## Post-Experiment Checklist

- [ ] Verify all services healthy
- [ ] Check error rates returned to normal
- [ ] Verify no data inconsistency
- [ ] Update runbook if new failure mode found
- [ ] Document findings in incident report