# Azeebo+ — 72-Hour Hypercare Launch Operations Runbook

**Document ID:** AZP-OPS-HYP-2026-v1.0  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§8.4 Item 8, §9.1 Task 4.6, §9.3 Criterion 11), `docs/operations/SLO.md`  
**Effective Period:** T-0 Launch Cutover through T+72 Hours  
**Primary Mission:** Zero SEV-1 incidents, <250ms p95 API latency, and 100% financial transaction integrity during live traffic transition.

---

## 1. 24/7 On-Call Escalation Roster (72-Hour Watch)

Four rotating 12-hour shifts staffed by primary and secondary engineers:

| Shift Window | Lead Incident Commander | Primary SRE / Infra | Core Platform (DB/Money) | Client Lead (Web/Mobile) |
| :--- | :--- | :--- | :--- | :--- |
| **Shift 1 (T-0 to T+12h)** | Lead Delivery Architect | SRE Lead | Core Platform Lead | Mobile & TV Lead |
| **Shift 2 (T+12h to T+24h)** | Technical Deputy Lead | Secondary SRE | Senior Backend Eng | Web Engineering Lead |
| **Shift 3 (T+24h to T+36h)** | Lead Delivery Architect | SRE Lead | Core Platform Lead | Mobile & TV Lead |
| **Shift 4 (T+36h to T+48h)** | Technical Deputy Lead | Secondary SRE | Senior Backend Eng | Web Engineering Lead |
| **Shift 5 (T+48h to T+60h)** | Lead Delivery Architect | SRE Lead | Core Platform Lead | Mobile & TV Lead |
| **Shift 6 (T+60h to T+72h)** | Technical Deputy Lead | Secondary SRE | Senior Backend Eng | Web Engineering Lead |

---

## 2. Severity Classification & SLO Burn Alerts

Alertmanager monitors real-time Prometheus metrics at `:3013/metrics`:

| Severity | Definition & Impact | Response Target | Escalation Action |
| :--- | :--- | :---: | :--- |
| **SEV-1 (Critical)** | Gateway down, wallet double-spend, payment processing failure, or data loss. | **< 5 minutes** | Immediate page to all on-call engineers; Incident Commander opens bridge. |
| **SEV-2 (High)** | Single universe offline (e.g. Reality voting failing), video playback degraded, error budget burning at $>14.4\times$. | **< 15 minutes** | Page Lead SRE and Core Platform Lead; prepare traffic shaping. |
| **SEV-3 (Medium)** | Non-blocking degradation, email/push notification delay, creator analytics lagging. | **< 1 hour** | Ticket dispatched to shift engineer; investigate during shift. |

---

## 3. Emergency Triage Protocols

### 3.1 Financial Mutation Freeze (Emergency Kill-Switch)
If an abnormal wallet state or payment reconciliation anomaly is detected:
1. Trigger the wallet maintenance kill-switch via Redis:
   ```bash
   redis-cli -u "$REDIS_URL" SET feature_flags:wallet_withdrawals_enabled '{"key":"wallet_withdrawals_enabled","enabled":false}'
   ```
2. Inbound withdrawal and fund-movement requests immediately return HTTP 503 while viewing and playback remain unaffected.

### 3.2 Gateway Maintenance Mode
If the edge or upstreams experience cascading failure:
```bash
redis-cli -u "$REDIS_URL" SET feature_flags:gateway_maintenance_mode '{"key":"gateway_maintenance_mode","enabled":true}'
```
All gateway traffic returns HTTP 503 with a `Retry-After: 300` header while backend recovery takes place.

### 3.3 Fast Rollback Procedure (<15 Minutes)
If a critical defect emerges immediately post-deploy:
```bash
bash scripts/rollback.sh --service all-in-one --to-tag <PREVIOUS_HEALTHY_IMAGE_TAG>
```
1. Script resolves prior container and verifies health.
2. In-memory state and Redis cache are preserved.
3. Total rollback completes in under 15 minutes without data loss.

---

## 4. Hypercare Exit Criteria (T+72h Transition to Business-As-Usual)

- 72 consecutive hours with zero SEV-1 incidents and zero open SEV-2 incidents.
- API p95 latency remains $\le 250\text{ms}$ across all endpoints.
- Total payment and wallet balance variance equals ₦0.00.
- Signed transition certificate by Executive Sponsor and Lead Architect.
