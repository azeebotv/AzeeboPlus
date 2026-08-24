# Tasks — SRE, Observability, SLOs, Capacity, DR & Incident

> Derived from AZP-TAA-001 R2.0 Part X, R2 Enforcement

---

## 1. SLO Matrix (TAA §57)

| SLO | Target | Gate | Status |
|-----|--------|------|--------|
| Critical-service availability | ≥99.9% monthly | M2 | ✅ Documented |
| Crash-free sessions | ≥99.5% | M2 | ✅ Documented |
| Critical non-media API P95 | ≤750ms | M2 | ✅ Documented |
| Critical non-media API P99 | ≤1,500ms | M2 | ✅ Documented |
| Search P95 | ≤1.5s | M2 | ✅ Documented |
| Playback startup P50 | ≤2.5s | M2 | ✅ Documented |
| Playback startup P95 | ≤6s | M2 | ✅ Documented |
| Rebuffer ratio P95 | <2% playback time | M2 | ✅ Documented |
| Entitlement propagation | ≤10s for 99% | M2 | ✅ Documented |
| CMS publication propagation | ≤5 min | M2 | ✅ Documented |
| Notification batch | 95% provider-accepted ≤15 min | M2 | ✅ Documented |
| RTO identity/commerce/entitlement | ≤60 min | M2 | ✅ Documented |
| RPO transactional ledgers | ≤5 min | M2 | ✅ Documented |

---

## 2. Observability Architecture (TAA §60)

### 2.1 OpenTelemetry Instrumentation

| Task | Reference | Status |
|------|-----------|--------|
| OTel traces for HTTP requests | TAA §60 | ✅ Implemented |
| OTel traces for database queries | TAA §60 | ✅ Implemented |
| OTel traces for queue operations | TAA §60 | ✅ Implemented |
| OTel traces for critical business spans | TAA §60 | ✅ Implemented |
| Correlation ID propagation across all layers | TAA §60 | ✅ Implemented |
| OTel metrics for golden signals (latency, traffic, errors, saturation) | TAA §60 | ✅ Implemented |
| Business SLO metrics | TAA §60 | ✅ Implemented |
| Structured JSON logs with env/service/domain | TAA §60 | ✅ Implemented |
| Redacted user identifiers in logs | TAA §60 | ✅ Implemented |
| Separate product analytics and operational telemetry pipelines | TAA §60 | ✅ Implemented |

### 2.2 Dashboards

| Dashboard | Purpose | Status |
|-----------|---------|--------|
| Service health overview | All services status | ✅ Implemented |
| API latency/throughput/errors | Golden signals | ✅ Implemented |
| Database performance | Query latency, connections, IOPS | ✅ Implemented |
| Redis performance | Hit rate, memory, connections | ✅ Implemented |
| Queue depth and processing age | Worker health | ✅ Implemented |
| Authentication metrics | Login success/failure, lockout events | ✅ Implemented |
| Payment metrics | Transaction success/failure, reconciliation | ✅ Implemented |
| Media delivery metrics | CDN hit ratio, playback starts, rebuffer | ✅ Implemented |
| Content publish pipeline | Ingest → transcoding → publish → index | ✅ Implemented |
| Business KPIs | MAU, WEP, revenue, subscriptions | ✅ Implemented |

---

## 3. Alerting & Error Budgets (TAA §61)

| Task | Reference | Status |
|------|-----------|--------|
| Alert on SLO burn rate (not raw metrics alone) | TAA §61 | ✅ Implemented |
| Critical alerts: auth failure surge | TAA §61 | ✅ Implemented |
| Critical alerts: playback authorisation failure | TAA §61 | ✅ Implemented |
| Critical alerts: payment-confirmed/entitlement lag | TAA §61 | ✅ Implemented |
| Critical alerts: provider callback backlog | TAA §61 | ✅ Implemented |
| Critical alerts: DB saturation | TAA §61 | ✅ Implemented |
| Critical alerts: queue age | TAA §61 | ✅ Implemented |
| Critical alerts: rights publish mismatch | TAA §61 | ✅ Implemented |
| Error-budget exhaustion freezes discretionary releases | TAA §61 | ✅ Implemented |
| Every alert has owner and runbook | TAA §61 | ✅ Implemented |
| Unactionable alerts removed | TAA §61 | ✅ Implemented |

---

## 4. Capacity Planning (TAA §58-59)

| Dimension | Founding Envelope | Status |
|-----------|-------------------|--------|
| Registered users | 250,000 | ✅ Documented |
| Monthly active users | 75,000 | ✅ Documented |
| Peak concurrent video sessions | 10,000 | ✅ Documented |
| Vertical starts/minute | 5,000 burst | ✅ Documented |
| Long-form concurrent premiere | 5,000 | ✅ Documented |
| Transactions/minute | 300 burst | ✅ Documented |
| Notification batch | 250,000 | ✅ Documented |
| Analytics events/day | 10 million | ✅ Documented |
| CMS active operators | 50 | ✅ Documented |
| Media library | 5 TB baseline | ✅ Documented |

### Scaling Tasks

| Task | Reference | Status |
|------|-----------|--------|
| Horizontal scale stateless tasks (CPU, request rate, latency) | TAA §59 | ✅ Implemented |
| Worker scale by queue depth/processing age | TAA §59 | ✅ Implemented |
| PostgreSQL vertical scale first, then read replicas | TAA §59 | ✅ Implemented |
| CDN absorbs video/static distribution | TAA §59 | ✅ Verified |
| Autoscaling limits with cost guardrails | TAA §88 | ✅ Implemented |
| Minimum warm capacity before premieres | TAA §59 | ✅ Implemented |
| Load tests at 1.0x, 1.5x, target burst | TAA §59 | ✅ Implemented |

---

## 5. Backup & Restore (TAA §62)

| Task | Reference | Status |
|------|-----------|--------|
| Automated encrypted database backups | TAA §62 | ✅ Implemented |
| Point-in-time recovery support | TAA §62 | ✅ Implemented |
| Object-store versioning/lifecycle | TAA §62 | ✅ Implemented |
| Restore tests on defined cadence | TAA §62 | ✅ Implemented |
| Critical config/IaC/secrets metadata recoverable independently | TAA §62 | ✅ Implemented |
| DR location cross-border replication legal approval | TAA §62 | ✅ Implemented |

---

## 6. Disaster Recovery (TAA §63, §87)

### 6.1 Recovery Tiers

| Tier | Objective | Status |
|------|-----------|--------|
| Tier A — instance/AZ/service failure | RTO ≤60 min, RPO ≤5 min | ✅ Implemented |
| Tier B — destructive data incident | RTO ≤4h, RPO by PITR | ✅ Implemented |
| Tier C — primary-region loss | RTO ≤8h, RPO ≤15 min | ✅ Implemented |
| Tier D — vendor ecosystem failure | Per provider runbook | ✅ Implemented |

### 6.2 DR Exercise Schedule

| Task | Frequency | Status |
|------|-----------|--------|
| Transactional database restore exercise | Before M2 | ✅ Implemented |
| Application infrastructure recreation exercise | Before M2 | ✅ Implemented |
| Production backup restore test | Quarterly | ✅ Implemented |
| Cross-functional DR tabletop | Semi-annually | ✅ Implemented |
| Technical regional-recovery exercise | Annually | ✅ Implemented |

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
| SEV-1 | Immediate commander, bridge, rollback/containment, executive notification, mandatory postmortem | ✅ Implemented |
| SEV-2 | Named owner, rapid mitigation, postmortem | ✅ Implemented |
| SEV-3 | Normal engineering priority | ✅ Standard |
| SEV-4 | Backlog/maintenance | ✅ Standard |

### Incident Process Tasks

| Task | Priority |
|------|----------|
| Incident response runbook templates | P0 | ✅ Implemented |
| SEV-1/SEV-2 escalation procedures | P0 | ✅ Implemented |
| Postmortem template and process | P0 | ✅ Implemented |
| On-call rotation and PagerDuty/Opsgenie setup | P0 | ✅ Implemented |
| Status page for external communication | P1 | ✅ Implemented |
| Incident metrics tracking (MTTD, MTTR) | P1 | ✅ Implemented |

---

## 8. FinOps (TAA §88)

| Task | Reference | Status |
|------|-----------|--------|
| Production resource tagging (env, domain, owner, cost-centre) | TAA §88 | ✅ Implemented |
| Environment/domain budgets and forecast thresholds | TAA §88 | ✅ Implemented |
| Daily cloud-cost anomaly monitoring | TAA §88 | ✅ Implemented |
| Autoscaled service upper cost bounds | TAA §88 | ✅ Implemented |
| CDN/egress cost per viewing hour | TAA §88 | ✅ Implemented |
| Transcode cost per finished minute | TAA §88 | ✅ Implemented |
| Storage cost per content-hour | TAA §88 | ✅ Implemented |
| Infrastructure cost per MAU/WEP | TAA §88 | ✅ Implemented |
| Cost per 1,000 critical API requests | TAA §88 | ✅ Implemented |
| Monthly Product/Engineering/Finance FinOps review | TAA §88 | ✅ Implemented |

---

## 9. External Dependency Resilience (TAA §81)

| Dependency | Timeout | Retry | Degraded Mode | Status |
|------------|---------|-------|---------------|--------|
| Identity provider | Short bounded | Safe discovery only | Existing sessions continue | ✅ Implemented |
| Payment provider | Bounded | Idempotent retry/backoff | PENDING/UNKNOWN | ✅ Implemented |
| Media/transcoder/CDN | Control-plane | Serve existing derivatives | Queue new ingest | ✅ Implemented |
| Push | Queue + backoff | Retry | No push; app functional | ✅ Implemented |
| Analytics | Async/buffer | Backfill | Product paths continue | ✅ Implemented |
| Remote config | Cached/signed | Server defaults | Last-known safe config | ✅ Implemented |
| AI/VCF provider | Per vendor | Per vendor | Content production affected, not runtime | ✅ Implemented |
