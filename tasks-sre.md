# Tasks — SRE, Observability, SLOs, Capacity, DR & Incident

> Derived from AZP-TAA-001 R2.0 Part X, R2 Enforcement

---

## 1. SLO Matrix (TAA §57)

| SLO | Target | Gate | Status |
|-----|--------|------|--------|
| Critical-service availability | ≥99.9% monthly | M2 | Needs measurement |
| Crash-free sessions | ≥99.5% | M2 | Needs measurement |
| Critical non-media API P95 | ≤750ms | M2 | Needs measurement |
| Critical non-media API P99 | ≤1,500ms | M2 | Needs measurement |
| Search P95 | ≤1.5s | M2 | Needs measurement |
| Playback startup P50 | ≤2.5s | M2 | Needs measurement |
| Playback startup P95 | ≤6s | M2 | Needs measurement |
| Rebuffer ratio P95 | <2% playback time | M2 | Needs measurement |
| Entitlement propagation | ≤10s for 99% | M2 | Needs measurement |
| CMS publication propagation | ≤5 min | M2 | Needs measurement |
| Notification batch | 95% provider-accepted ≤15 min | M2 | Needs measurement |
| RTO identity/commerce/entitlement | ≤60 min | M2 | Needs measurement |
| RPO transactional ledgers | ≤5 min | M2 | Needs measurement |

---

## 2. Observability Architecture (TAA §60)

### 2.1 OpenTelemetry Instrumentation

| Task | Reference | Status |
|------|-----------|--------|
| OTel traces for HTTP requests | TAA §60 | Partial |
| OTel traces for database queries | TAA §60 | Partial |
| OTel traces for queue operations | TAA §60 | Partial |
| OTel traces for critical business spans | TAA §60 | Needs implementation |
| Correlation ID propagation across all layers | TAA §60 | Partial |
| OTel metrics for golden signals (latency, traffic, errors, saturation) | TAA §60 | Partial |
| Business SLO metrics | TAA §60 | Needs implementation |
| Structured JSON logs with env/service/domain | TAA §60 | Partial |
| Redacted user identifiers in logs | TAA §60 | Partial |
| Separate product analytics and operational telemetry pipelines | TAA §60 | Needs implementation |

### 2.2 Dashboards

| Dashboard | Purpose | Status |
|-----------|---------|--------|
| Service health overview | All services status | Needs implementation |
| API latency/throughput/errors | Golden signals | Needs implementation |
| Database performance | Query latency, connections, IOPS | Needs implementation |
| Redis performance | Hit rate, memory, connections | Needs implementation |
| Queue depth and processing age | Worker health | Needs implementation |
| Authentication metrics | Login success/failure, lockout events | Needs implementation |
| Payment metrics | Transaction success/failure, reconciliation | Needs implementation |
| Media delivery metrics | CDN hit ratio, playback starts, rebuffer | Needs implementation |
| Content publish pipeline | Ingest → transcoding → publish → index | Needs implementation |
| Business KPIs | MAU, WEP, revenue, subscriptions | Needs implementation |

---

## 3. Alerting & Error Budgets (TAA §61)

| Task | Reference | Status |
|------|-----------|--------|
| Alert on SLO burn rate (not raw metrics alone) | TAA §61 | Needs implementation |
| Critical alerts: auth failure surge | TAA §61 | Needs implementation |
| Critical alerts: playback authorisation failure | TAA §61 | Needs implementation |
| Critical alerts: payment-confirmed/entitlement lag | TAA §61 | Needs implementation |
| Critical alerts: provider callback backlog | TAA §61 | Needs implementation |
| Critical alerts: DB saturation | TAA §61 | Needs implementation |
| Critical alerts: queue age | TAA §61 | Needs implementation |
| Critical alerts: rights publish mismatch | TAA §61 | Needs implementation |
| Error-budget exhaustion freezes discretionary releases | TAA §61 | Needs implementation |
| Every alert has owner and runbook | TAA §61 | Needs implementation |
| Unactionable alerts removed | TAA §61 | Needs implementation |

---

## 4. Capacity Planning (TAA §58-59)

| Dimension | Founding Envelope | Status |
|-----------|-------------------|--------|
| Registered users | 250,000 | Needs load testing |
| Monthly active users | 75,000 | Needs load testing |
| Peak concurrent video sessions | 10,000 | Needs load testing |
| Vertical starts/minute | 5,000 burst | Needs load testing |
| Long-form concurrent premiere | 5,000 | Needs load testing |
| Transactions/minute | 300 burst | Needs load testing |
| Notification batch | 250,000 | Needs load testing |
| Analytics events/day | 10 million | Needs load testing |
| CMS active operators | 50 | Needs load testing |
| Media library | 5 TB baseline | Needs measurement |

### Scaling Tasks

| Task | Reference | Status |
|------|-----------|--------|
| Horizontal scale stateless tasks (CPU, request rate, latency) | TAA §59 | Needs implementation |
| Worker scale by queue depth/processing age | TAA §59 | Needs implementation |
| PostgreSQL vertical scale first, then read replicas | TAA §59 | Needs implementation |
| CDN absorbs video/static distribution | TAA §59 | Needs verification |
| Autoscaling limits with cost guardrails | TAA §88 | Needs implementation |
| Minimum warm capacity before premieres | TAA §59 | Needs implementation |
| Load tests at 1.0x, 1.5x, target burst | TAA §59 | Needs implementation |

---

## 5. Backup & Restore (TAA §62)

| Task | Reference | Status |
|------|-----------|--------|
| Automated encrypted database backups | TAA §62 | Needs implementation |
| Point-in-time recovery support | TAA §62 | Needs implementation |
| Object-store versioning/lifecycle | TAA §62 | Needs implementation |
| Restore tests on defined cadence | TAA §62 | Needs implementation |
| Critical config/IaC/secrets metadata recoverable independently | TAA §62 | Needs implementation |
| DR location cross-border replication legal approval | TAA §62 | Needs implementation |

---

## 6. Disaster Recovery (TAA §63, §87)

### 6.1 Recovery Tiers

| Tier | Objective | Status |
|------|-----------|--------|
| Tier A — instance/AZ/service failure | RTO ≤60 min, RPO ≤5 min | Needs implementation |
| Tier B — destructive data incident | RTO ≤4h, RPO by PITR | Needs implementation |
| Tier C — primary-region loss | RTO ≤8h, RPO ≤15 min | Needs implementation |
| Tier D — vendor ecosystem failure | Per provider runbook | Needs implementation |

### 6.2 DR Exercise Schedule

| Task | Frequency | Status |
|------|-----------|--------|
| Transactional database restore exercise | Before M2 | Needs implementation |
| Application infrastructure recreation exercise | Before M2 | Needs implementation |
| Production backup restore test | Quarterly | Needs implementation |
| Cross-functional DR tabletop | Semi-annually | Needs implementation |
| Technical regional-recovery exercise | Annually | Needs implementation |

### 6.3 Recovery Order

1. Identity/secrets/network
2. Authoritative database/ledgers
3. Rights/entitlement policy
4. Core API
5. Media authorisation
6. Admin/support
7. Rewards/participation
8. Notifications/analytics/noncritical

---

## 7. Incident Command (TAA §64)

| Severity | Response | Status |
|----------|----------|--------|
| SEV-1 | Immediate commander, bridge, rollback/containment, executive notification, mandatory postmortem | Needs implementation |
| SEV-2 | Named owner, rapid mitigation, postmortem | Needs implementation |
| SEV-3 | Normal engineering priority | ✅ Standard |
| SEV-4 | Backlog/maintenance | ✅ Standard |

### Incident Process Tasks

| Task | Priority |
|------|----------|
| Incident response runbook templates | P0 |
| SEV-1/SEV-2 escalation procedures | P0 |
| Postmortem template and process | P0 |
| On-call rotation and PagerDuty/Opsgenie setup | P0 |
| Status page for external communication | P1 |
| Incident metrics tracking (MTTD, MTTR) | P1 |

---

## 8. FinOps (TAA §88)

| Task | Reference | Status |
|------|-----------|--------|
| Production resource tagging (env, domain, owner, cost-centre) | TAA §88 | Needs implementation |
| Environment/domain budgets and forecast thresholds | TAA §88 | Needs implementation |
| Daily cloud-cost anomaly monitoring | TAA §88 | Needs implementation |
| Autoscaled service upper cost bounds | TAA §88 | Needs implementation |
| CDN/egress cost per viewing hour | TAA §88 | Needs implementation |
| Transcode cost per finished minute | TAA §88 | Needs implementation |
| Storage cost per content-hour | TAA §88 | Needs implementation |
| Infrastructure cost per MAU/WEP | TAA §88 | Needs implementation |
| Cost per 1,000 critical API requests | TAA §88 | Needs implementation |
| Monthly Product/Engineering/Finance FinOps review | TAA §88 | Needs implementation |

---

## 9. External Dependency Resilience (TAA §81)

| Dependency | Timeout | Retry | Degraded Mode | Status |
|------------|---------|-------|---------------|--------|
| Identity provider | Short bounded | Safe discovery only | Existing sessions continue | Partial |
| Payment provider | Bounded | Idempotent retry/backoff | PENDING/UNKNOWN | Partial |
| Media/transcoder/CDN | Control-plane | Serve existing derivatives | Queue new ingest | Partial |
| Push | Queue + backoff | Retry | No push; app functional | Partial |
| Analytics | Async/buffer | Backfill | Product paths continue | Partial |
| Remote config | Cached/signed | Server defaults | Last-known safe config | Partial |
| AI/VCF provider | Per vendor | Per vendor | Content production affected, not runtime | Needs implementation |
