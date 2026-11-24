# Azeebo+ — Data Protection, PII Retention & Lawful Basis Policy

**Document ID:** AZP-COMP-PII-2026-v1.0  
**Effective Date:** Q4 2026  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§6.2 R-06, §7.6, Decision D-09), `scripts/data-retention.mjs`  
**Governing Regulations:** NDPR (Nigeria Data Protection Regulation 2019 / NDPA 2023), GDPR (Regulation (EU) 2016/679)  
**Classification:** Legal & Regulatory Compliance Instrument

---

## 1. Lawful Basis for Processing (GDPR Art. 6 / NDPA Part V)

1. **Contractual Necessity (Art. 6(1)(b)):** Processing of user credentials, payment identifiers, virtual wallet balances, and subscription records is required to fulfill the Terms of Service.
2. **Legal Obligation (Art. 6(1)(c)):** Financial ledger records, payment transactions, and tax receipts are retained to satisfy statutory accounting and anti-money laundering (AML) laws.
3. **Legitimate Interests (Art. 6(1)(f)):** Telemetry, audit logs, and fraud prevention signals are processed to protect platform integrity, prevent double-spending, and maintain service availability.
4. **Explicit Consent (Art. 6(1)(a)):** Non-essential telemetry, promotional notifications, and personalized recommendation profiling require affirmative opt-in consent recorded in `analytics_service.consent_ledgers`.

---

## 2. Retention Schedules by Data Category

| Data Classification | Storage Location | Retention Window | Lawful Basis | Deletion Mechanism |
| :--- | :--- | :---: | :--- | :--- |
| **Authentication & Profile PII** | `auth_service`, `user_service` | Duration of active account + 30 days | Contractual | Hard delete / anonymization upon account closure |
| **Financial Ledger Entries** | `wallet_service.ledger_entries` | **7 Years** | Statutory Financial Obligation | Immutable archive; never purged |
| **Payment Intents & Receipts** | `payment_service.payments` | **7 Years** | Statutory Tax & Commercial Code | Immutable archive; encrypted at rest |
| **Analytics Telemetry & Events** | `analytics_service.events` | **12–36 Months** | Legitimate Interest / Consent | Automated TTL sweeper (`scripts/data-retention.mjs`) |
| **Moderation Reports & Appeals** | `moderation_service` | **24 Months** | Platform Safety & Legal Defense | Automated purge after retention expiration |
| **Transient Session Logs & Traces** | Redis / Loki / Promtail | **30 Days** | Operational Reliability | Automated FIFO sliding window |

---

## 3. Data Subject Rights & DSAR Erasure Implementation

In compliance with GDPR Articles 15–22 and NDPR:
1. **Right to Erasure (RTBF):** User can request account deletion via `DELETE /api/v1/users/me`.
2. **DSAR Consumer Service:** Orchestrated via `erasure-consumer.service.ts` across all 26 databases:
   - S3 profile avatar and uploaded media blobs deleted.
   - User profile and contact details scrubbed.
   - Financial ledger entries are retained as mandated by law but stripped of personal identifiers (`user_id` hashed/anonymized).
3. **Execution Safety:** Automated cleanup scripts run in `--dry-run` mode by default, requiring explicit `--execute` flags and master keys for deletion.
