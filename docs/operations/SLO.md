# Azeebo+ Launch-Grade Service Level Objectives (SLO)

**Controlling Authority:** Site Reliability Engineering (SRE)  
**Effective Target:** M1 Beta & M2 Public Launch  
**Review Frequency:** Bi-weekly during pre-launch; Monthly post-launch

---

## 1. Core Service Availability & Latency SLOs

| Service / Flow | SLI (Metric) | Target SLO | Measurement Window | Error Budget Policy |
|---|---|:---:|:---:|---|
| **API Gateway** | `% requests returning < 500` | **99.9%** | Rolling 30 days | Alert on 1h burn > 2% or 6h burn > 5% |
| **API Latency (p95)** | `http_request_duration_ms <= 250ms` | **95.0%** | Rolling 7 days | Degraded cache / DB connection alert |
| **Video Playback Start (TTFB)** | `time_to_first_frame <= 1200ms` | **99.0%** | Rolling 30 days | CDN edge failover drill trigger |
| **Auth & Token Verification** | `% successful JWT verifications` | **99.95%** | Rolling 30 days | Sentry SEV-1 notification |
| **Wallet & Payment Debits** | `% idempotent successful transactions` | **99.99%** | Rolling 30 days | Immediate on-call page on double-spend |
| **Content Delivery & Streaming** | `% media chunk requests returning 200` | **99.9%** | Rolling 30 days | Transcoder / storage failover |

---

## 2. Disaster Recovery Targets (RTO / RPO)

| Failure Scenario | Tier | Target RTO | Target RPO | Automated Procedures |
|---|:---:|:---:|:---:|---|
| **Instance / Container Failure** | Tier A | **≤ 15 min** | **0 min** | Docker / Coolify restart policy |
| **Multi-AZ / Database Failover** | Tier A | **≤ 60 min** | **≤ 5 min** | PostgreSQL standby promotion |
| **Data Corruption Incident** | Tier B | **≤ 4 hours** | **PITR safe point** | `scripts/verify-backup-restore.sh` |
| **Primary Region Catastrophe** | Tier C | **≤ 8 hours** | **≤ 15 min** | Cross-region S3 replication restore |

---

## 3. Burn Rate Alerting Matrix

- **Page (Critical):** 14.4x burn rate (2% error budget consumed in 1 hour) → PagerDuty / On-call notification.
- **Ticket (Warning):** 6x burn rate (5% error budget consumed in 6 hours) → SRE Slack channel.
- **Dashboard Reference:** Grafana dashboard `/d/azeebo-overview/platform-slo`.
