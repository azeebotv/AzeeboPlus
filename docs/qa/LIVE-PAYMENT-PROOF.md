# Azeebo+ — Live Payment Proof & Settlement Protocol

**Document ID:** AZP-QA-PAY-2026-v1.0  
**Companion Tasks:** PMR Task 1.7, Risk R-07, Gate G-05, Decision D-06  
**Status:** Verification Record & Live Execution Protocol  
**Primary Rail:** Paystack (NGN card, bank transfer, USSD)  
**Secondary / Failover Rail:** Flutterwave (failover harness verified)  
**Ledger Enforcement:** `@azeebo/wallet-service` (PostgreSQL `SELECT ... FOR UPDATE` + Redis mutex + immutable ledger)

---

## 1. Overview & Regulatory Rationale

PMR finding **R-07** states: *“Payment rails unproven in live mode. Failure mode: first real charge fails or double-charges during launch traffic; reconciliation is manual and unexercised.”*

This document specifies the technical architecture, cryptographic verification, execution procedure, and automated settlement reconciliation protocol for live-mode payment execution.

---

## 2. Cryptographic Security & Anti-Tamper Verification

### 2.1 Webhook Verification Protocol (Paystack & Flutterwave)
Implemented in `services/core/payment-service/src/modules/webhooks/webhook-security.service.ts`:
1. **Raw Body Hash:** Signatures are evaluated against raw binary request buffers (`req.rawBody`), preventing JSON deserialization whitespace attacks.
2. **Timing-Safe Comparison:** Signatures are compared using `crypto.timingSafeEqual` to eliminate side-channel timing attacks.
3. **Replay Window Enforcement:** Webhooks timestamped outside a 300-second window are rejected with HTTP 400.
4. **Idempotency Deduplication:** The unique webhook ID (`x-paystack-event-id` or transaction reference) is recorded in Redis with a 24-hour TTL (`SETNX`). Duplicate webhook deliveries return HTTP 200 without reprocessing.

---

## 3. End-to-End Live Transaction Cycle (Execution Protocol)

The scripted test cycle exercises the complete financial lifecycle:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. User Wallet  │ ────► │ 2. Paystack API │ ────► │ 3. Webhook HMAC │
│ Top-Up (₦1,000) │       │ Charge Accepted │       │ Verified        │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 6. Discrepancy  │ ◄──── │ 5. Refund Re-   │ ◄──── │ 4. Wallet Ledger│
│ Reconciled (₦0) │       │ versal (₦1,000) │       │ Credited        │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Step 1: Client Fund Initiation
- **Endpoint:** `POST /api/v1/wallet/deposit`
- **Headers:** `X-Idempotency-Key: <UUIDv4>`
- **Payload:** `{"amount": 1000, "currency": "NGN", "provider": "paystack"}`
- **Assertion:** Gateway preserves and forwards `X-Idempotency-Key`.

### Step 2: Paystack Checkout & Authorization
- Transaction initialized with reference `azp_live_<timestamp>_<rand>`.
- Real card charge processed through Paystack NGN settlement channel.

### Step 3: Webhook Receipt & Validation
- **Event:** `charge.success`
- **HMAC Check:** `X-Paystack-Signature` matched against `PAYSTACK_LIVE_SECRET_KEY`.
- **Idempotency Check:** Event ID claimed in Redis.

### Step 4: Atomic Wallet Balance Credit
- **DB Execution:**
  ```sql
  BEGIN;
  SELECT * FROM wallets WHERE id = $1 FOR UPDATE;
  UPDATE wallets SET balance = balance + 1000 WHERE id = $1;
  INSERT INTO ledger_entries (wallet_id, amount, balance_after, type, reference)
  VALUES ($1, 1000, $new_balance, 'CREDIT_DEPOSIT', $ref);
  COMMIT;
  ```
- **Assertion:** Wallet balance increments by exactly ₦1,000.00.

### Step 5: Administrative Refund Execution
- **Endpoint:** `POST /api/v1/payments/refund`
- **Payload:** `{"reference": "azp_live_...", "amount": 1000, "reason": "PMR live verification drill"}`
- **Provider Action:** Paystack Refund API returns `status: "processed"`.
- **Ledger Reversal:**
  ```sql
  BEGIN;
  SELECT * FROM wallets WHERE id = $1 FOR UPDATE;
  UPDATE wallets SET balance = balance - 1000 WHERE id = $1;
  INSERT INTO ledger_entries (wallet_id, amount, balance_after, type, reference)
  VALUES ($1, -1000, $new_balance, 'DEBIT_REFUND', $ref);
  COMMIT;
  ```

### Step 6: Settlement Reconciliation Audit
- `PaymentReconciliationService` runs daily discrepancy matching between Paystack transaction export and `wallet_service.ledger_entries`.
- **Result:** Variance = ₦0.00 (Zero discrepancy).

---

## 4. Flutterwave Secondary Rail Failover Proof

Tested and verified via `payments.failover.e2e.spec.ts`:
- Primary rail latency timeout (>5,000ms) or HTTP 5xx triggers circuit breaker.
- Seamless retry routing initiates payment intent on Flutterwave secondary rail without customer re-authentication.

---

## 5. Sign-off & Audit Record

| Role | Name | Status | Timestamp |
| :--- | :--- | :---: | :--- |
| **Finance Director** | Signed on file | Approved | 2026-11-18 |
| **Lead Systems Architect** | Signed on file | Verified | 2026-11-18 |
| **Core Platform Lead** | Signed on file | Verified | 2026-11-18 |
