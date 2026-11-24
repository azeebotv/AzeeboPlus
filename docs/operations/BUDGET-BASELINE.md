# Azeebo+ — Financial & Operational Budget Baseline 2026–2027

**Document ID:** AZP-OPS-FIN-2026-v1.0  
**Effective Cycle:** Q4 2026 – Q1 2027 Launch  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§8.3), `pmr-task.md`, `pmr-todo.md`  
**Classification:** Steering Committee & Finance Record

---

## 1. Operating Expenditure (Monthly Cloud & SaaS Envelope)

Based on the single-container all-in-one staging/production topology (`ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docker-compose.prod.yml`), the baseline monthly run-rate is established below:

| Cost Driver | Specification & Sizing | Monthly Estimated Range (USD) | Notes & Optimization |
| :--- | :--- | :---: | :--- |
| **Application Container** | 12 GB RAM / 4 vCPU, Supervisor-managed | **$60 – $120** | Coolify / dedicated instance |
| **Managed PostgreSQL 16** | 26 databases in 1 cluster, PgBouncer pool | **$150 – $400** | Transaction mode pooling |
| **Redis 7 Cluster** | In-memory cache, BullMQ queues, mutex locks | **$30 – $80** | Redis 7 persistence enabled |
| **Object Storage & CDN** | AWS S3 Origin + CloudFront signed URLs | **$50 – $300** | Traffic & HLS video dependent |
| **Observability & Logging** | Prometheus, Grafana, Loki, Alertmanager | **$50 – $150** | Self-hosted monitoring stack |
| **Email / SMS / Push** | SendGrid, Twilio, Firebase Cloud Messaging | **$50 – $150** | OTP SMS volume is swing factor |
| **Domains / Edge TLS / WAF** | nginx edge, Cloudflare TLS, Let's Encrypt | **$20 – $60** | Edge rate limiting & DDoS |
| **CI/CD Compute** | GitHub Actions (22 workflows, Docker builds) | **$80 – $250** | Cached pnpm & layer caching |
| **Total Monthly Run-Rate** | **Platform Infrastructure & SaaS** | **$490 – $1,570 / month** | **Approved Opex Envelope** |

---

## 2. One-Off Assurance Capital Expenditure (Capex)

The following one-off assurance allocations are formally approved for Q4 2026:

| Item | Purpose | Approved Capex Budget (USD) | Status |
| :--- | :--- | :---: | :---: |
| **Third-Party Penetration Test** | Independent security evaluation across 29 services, API gateway, and clients | **$8,000 – $25,000** | Approved (D-04) |
| **Mobile App Store Registrations** | Apple Developer Program ($99/yr) + Google Play Console ($25) | **$124** | Approved (D-05) |
| **Expo Application Services (EAS)** | EAS Build & Submit production tier | **$99 / month** | Approved |
| **Mobile Test Device Lab** | Physical iOS and Android devices for biometric & DRM testing | **$1,500** | Approved |
| **Total One-Off Assurance Capex** | **Pre-Launch Assurance & Compliance** | **$9,723 – $26,723** | **Approved** |

---

## 3. Financial Controls & Reporting

1. **Monthly Reconciliation:** SRE and Finance review cloud invoices against this baseline on the 1st of every month.
2. **Variance Threshold:** Any month-over-month variance exceeding 20% triggers an operational review by the Executive Sponsor.
3. **Sign-off:** Approved by Finance Director and Executive Sponsor (VMNL).
